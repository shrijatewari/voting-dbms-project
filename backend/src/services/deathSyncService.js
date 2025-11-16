const pool = require('../config/database');
const voterService = require('./voterService');

class DeathSyncService {
  async createDeathRecord(deathRecordData) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'INSERT INTO death_records (aadhaar_number, death_date) VALUES (?, ?) ON DUPLICATE KEY UPDATE death_date = ?',
        [deathRecordData.aadhaar_number, deathRecordData.death_date, deathRecordData.death_date]
      );
      return await this.getDeathRecordByAadhaar(deathRecordData.aadhaar_number);
    } finally {
      connection.release();
    }
  }

  async getDeathRecordByAadhaar(aadhaarNumber) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM death_records WHERE aadhaar_number = ?',
        [aadhaarNumber]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  async getAllDeathRecords(page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      const [rows] = await connection.query(
        'SELECT * FROM death_records ORDER BY recorded_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      const [countRows] = await connection.query('SELECT COUNT(*) as total FROM death_records');
      return {
        death_records: rows,
        pagination: {
          page,
          limit,
          total: countRows[0].total,
          totalPages: Math.ceil(countRows[0].total / limit)
        }
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Batch upload death records
   */
  async batchUploadDeathRecords(records) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const inserted = [];
      const errors = [];
      
      for (const record of records) {
        try {
          const [result] = await connection.query(
            `INSERT INTO death_records (aadhaar_number, death_date, source_id)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE death_date = VALUES(death_date), source_id = VALUES(source_id)`,
            [record.aadhaar_number, record.death_date, record.source_id || null]
          );
          inserted.push(record);
        } catch (error) {
          errors.push({
            aadhaar_number: record.aadhaar_number,
            error: error.message
          });
        }
      }
      
      await connection.commit();
      return {
        inserted: inserted.length,
        errors: errors.length,
        error_details: errors
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Sync death records with voter database
   * Enhanced with flags, verification workflow, and appeal window
   */
  async runDeathSync(options = {}) {
    const {
      mode = 'dry-run', // 'dry-run' or 'apply'
      threshold = 0.9
    } = options;
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Get all death records
      const [deathRecords] = await connection.query('SELECT * FROM death_records');

      let matched = 0;
      let flagged = 0;
      let errors = [];
      const flags = [];

      for (const record of deathRecords) {
        try {
          // Find voter by Aadhaar
          const [voters] = await connection.query(
            'SELECT * FROM voters WHERE aadhaar_number = ? LIMIT 1',
            [record.aadhaar_number]
          );
          const voter = voters[0] || null;
          
          if (voter) {
            matched++;
            
            // Calculate match confidence (simplified - in production use fuzzy matching)
            const matchConfidence = 1.0; // Exact Aadhaar match = 100%
            
            if (matchConfidence >= threshold) {
              // Create flag for verification
              const [flagResult] = await connection.query(
                `INSERT INTO death_sync_flags (aadhaar_number, voter_id, match_score, status)
                 VALUES (?, ?, ?, 'pending')
                 ON DUPLICATE KEY UPDATE match_score = VALUES(match_score)`,
                [record.aadhaar_number, voter.voter_id, matchConfidence]
              );
              
              flagged++;
              flags.push({
                aadhaar_number: record.aadhaar_number,
                voter_id: voter.voter_id,
                match_score: matchConfidence
              });
              
              // If mode is 'apply' and confidence is very high, auto-mark (with appeal window)
              if (mode === 'apply' && matchConfidence >= 0.95) {
                const appealWindowEnd = new Date();
                appealWindowEnd.setDate(appealWindowEnd.getDate() + 14);
                
                await connection.query(
                  `UPDATE voters SET is_verified = FALSE, is_active = FALSE WHERE voter_id = ?`,
                  [voter.voter_id]
                );
                
                await connection.query(
                  `UPDATE death_records 
                   SET voter_marked_deceased = TRUE, appeal_window_end = ?
                   WHERE aadhaar_number = ?`,
                  [appealWindowEnd, record.aadhaar_number]
                );
              }
            }
          } else {
            errors.push({
              aadhaar_number: record.aadhaar_number,
              error: 'Voter not found in database'
            });
          }
        } catch (error) {
          errors.push({
            aadhaar_number: record.aadhaar_number,
            error: error.message
          });
        }
      }

      if (mode === 'dry-run') {
        await connection.rollback();
      } else {
        await connection.commit();
      }

      return {
        mode,
        total_death_records: deathRecords.length,
        matched,
        flagged,
        flags,
        errors: errors.length,
        error_details: errors
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get death sync flags (for admin verification)
   */
  async getDeathSyncFlags(status = null) {
    const connection = await pool.getConnection();
    try {
      let query = `
        SELECT f.*, d.aadhaar_number, d.death_date, v.name as voter_name, v.aadhaar_number as voter_aadhaar
        FROM death_sync_flags f
        JOIN death_records d ON f.aadhaar_number = d.aadhaar_number
        JOIN voters v ON f.voter_id = v.voter_id
        WHERE 1=1
      `;
      const params = [];
      
      if (status) {
        query += ' AND f.status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY f.flagged_at DESC';
      
      const [flags] = await connection.query(query, params);
      return flags;
    } finally {
      connection.release();
    }
  }

  /**
   * Mark voter as deceased (admin action)
   */
  async markVoterDeceased(voterId, deathData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { death_date, source_id, verified_by } = deathData;
      
      // Calculate appeal window
      const appealWindowEnd = new Date();
      appealWindowEnd.setDate(appealWindowEnd.getDate() + 14);
      
      // Mark voter as inactive
      await connection.query(
        'UPDATE voters SET is_verified = FALSE, is_active = FALSE WHERE voter_id = ?',
        [voterId]
      );
      
      // Update death record
      await connection.query(
        `UPDATE death_records 
         SET voter_marked_deceased = TRUE, verified_by = ?, verified_at = NOW(), appeal_window_end = ?
         WHERE aadhaar_number = (SELECT aadhaar_number FROM voters WHERE voter_id = ?)`,
        [verified_by, appealWindowEnd, voterId]
      );
      
      // Update flag status
      await connection.query(
        `UPDATE death_sync_flags 
         SET status = 'verified', verified_by = ?, verified_at = NOW()
         WHERE voter_id = ?`,
        [verified_by, voterId]
      );
      
      // Log audit event
      const auditService = require('./auditLogService');
      await auditService.logAction({
        action_type: 'voter_marked_deceased',
        entity_type: 'voter',
        entity_id: voterId,
        actor_id: verified_by,
        metadata: JSON.stringify({ death_date, source_id, appeal_window_end: appealWindowEnd.toISOString() })
      });
      
      await connection.commit();
      return { success: true, voter_id: voterId, appeal_window_end: appealWindowEnd };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Verify if a voter can vote (not deceased)
   */
  async canVote(aadhaarNumber) {
    const deathRecord = await this.getDeathRecordByAadhaar(aadhaarNumber);
    return !deathRecord;
  }
}

module.exports = new DeathSyncService();

