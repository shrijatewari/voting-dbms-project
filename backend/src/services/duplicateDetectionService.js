const pool = require('../config/database');
const stringMatching = require('../utils/stringMatching');
const biometricService = require('./biometricService');

class DuplicateDetectionService {
  /**
   * Enhanced similarity calculation using multiple algorithms
   * Uses Soundex, Jaro-Winkler, phonetic matching, and address clustering
   */
  calculateSimilarity(voter1, voter2, algorithms = ['name_phonetic', 'name_fuzzy', 'dob', 'address', 'face']) {
    const scores = {};
    const flags = [];
    
    // Name phonetic matching (Soundex)
    if (algorithms.includes('name_phonetic') && voter1.name && voter2.name) {
      const soundex1 = stringMatching.soundex(voter1.name);
      const soundex2 = stringMatching.soundex(voter2.name);
      scores.name_phonetic = soundex1 === soundex2 ? 1 : 0;
      if (scores.name_phonetic === 1) flags.push('name_phonetic_match');
    }
    
    // Name fuzzy matching (Jaro-Winkler)
    if (algorithms.includes('name_fuzzy') && voter1.name && voter2.name) {
      scores.name_fuzzy = stringMatching.jaroWinkler(
        voter1.name.toLowerCase().trim(),
        voter2.name.toLowerCase().trim()
      );
      if (scores.name_fuzzy > 0.85) flags.push('name_fuzzy_high');
    }
    
    // DOB exact match
    if (algorithms.includes('dob') && voter1.dob && voter2.dob) {
      scores.dob = voter1.dob === voter2.dob ? 1 : 0;
      if (scores.dob === 1) flags.push('dob_match');
    }
    
    // Address similarity
    if (algorithms.includes('address')) {
      scores.address = stringMatching.addressSimilarity(
        {
          pin_code: voter1.pin_code || voter1.pin,
          district: voter1.district,
          city: voter1.city || voter1.village_city,
          street: voter1.street || voter1.house_number
        },
        {
          pin_code: voter2.pin_code || voter2.pin,
          district: voter2.district,
          city: voter2.city || voter2.village_city,
          street: voter2.street || voter2.house_number
        }
      );
      if (scores.address > 0.7) flags.push('address_similar');
    }
    
    // Face embedding similarity (if available)
    if (algorithms.includes('face') && voter1.face_embedding_hash && voter2.face_embedding_hash) {
      // Check if face hashes match (exact)
      scores.face = voter1.face_embedding_hash === voter2.face_embedding_hash ? 1 : 0;
      if (scores.face === 1) flags.push('face_match');
    }
    
    // Aadhaar exact match (highest confidence)
    if (voter1.aadhaar_number && voter2.aadhaar_number) {
      scores.aadhaar = voter1.aadhaar_number === voter2.aadhaar_number ? 1 : 0;
      if (scores.aadhaar === 1) flags.push('aadhaar_exact_match');
    }
    
    // Calculate weighted average
    const weights = {
      aadhaar: 0.4,  // Highest weight
      face: 0.3,
      name_phonetic: 0.15,
      name_fuzzy: 0.1,
      dob: 0.05,
      address: 0.1
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [key, score] of Object.entries(scores)) {
      if (score !== undefined) {
        totalScore += score * (weights[key] || 0.1);
        totalWeight += weights[key] || 0.1;
      }
    }
    
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    return {
      score: finalScore,
      scores,
      flags,
      confidence: finalScore > 0.9 ? 'high' : finalScore > 0.7 ? 'medium' : 'low'
    };
  }

  /**
   * Run duplicate detection with configurable scope and algorithms
   */
  async runDuplicateDetection(options = {}) {
    const {
      scope = 'all', // 'district', 'state', 'all'
      threshold = 0.85,
      algorithms = ['name_phonetic', 'name_fuzzy', 'dob', 'address', 'face'],
      dryRun = false
    } = options;
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Build query based on scope
      let query = 'SELECT voter_id, name, dob, aadhaar_number, pin_code, district, city, street, village_city, house_number, face_embedding_hash, biometric_hash FROM voters WHERE 1=1';
      const params = [];
      
      if (scope === 'district' && options.district) {
        query += ' AND district = ?';
        params.push(options.district);
      } else if (scope === 'state' && options.state) {
        query += ' AND state = ?';
        params.push(options.state);
      }
      
      const [voters] = await connection.query(query, params);
      
      console.log(`[DUPLICATE] Running detection on ${voters.length} voters with threshold ${threshold}`);
      
      const duplicates = [];
      const checkedPairs = new Set();
      let comparisons = 0;

      for (let i = 0; i < voters.length; i++) {
        for (let j = i + 1; j < voters.length; j++) {
          const pairKey = `${Math.min(voters[i].voter_id, voters[j].voter_id)}-${Math.max(voters[i].voter_id, voters[j].voter_id)}`;
          
          if (checkedPairs.has(pairKey)) continue;
          checkedPairs.add(pairKey);
          comparisons++;

          const similarity = this.calculateSimilarity(voters[i], voters[j], algorithms);

          // Flag if similarity score exceeds threshold
          if (similarity.score >= threshold) {
            // Check if already flagged
            const [existing] = await connection.query(
              `SELECT check_id FROM duplicate_checks 
               WHERE (voter_id_1 = ? AND voter_id_2 = ?) OR (voter_id_1 = ? AND voter_id_2 = ?)`,
              [voters[i].voter_id, voters[j].voter_id, voters[j].voter_id, voters[i].voter_id]
            );

            if (existing.length === 0) {
              const duplicateData = {
                voter_id_1: voters[i].voter_id,
                voter_id_2: voters[j].voter_id,
                similarity_score: similarity.score,
                confidence: similarity.confidence,
                flags: JSON.stringify(similarity.flags),
                algorithm_details: JSON.stringify(similarity.scores),
                scope: scope
              };
              
              if (!dryRun) {
                await connection.query(
                  `INSERT INTO duplicate_checks 
                   (voter_id_1, voter_id_2, similarity_score, confidence, flags, algorithm_details, scope) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    duplicateData.voter_id_1,
                    duplicateData.voter_id_2,
                    duplicateData.similarity_score.toFixed(4),
                    duplicateData.confidence,
                    duplicateData.flags,
                    duplicateData.algorithm_details,
                    duplicateData.scope
                  ]
                );
              }
              
              duplicates.push(duplicateData);
            }
          }
        }
      }

      if (!dryRun) {
        await connection.commit();
      } else {
        await connection.rollback();
      }

      return {
        duplicates_found: duplicates.length,
        duplicates,
        comparisons,
        scope,
        threshold,
        algorithms,
        dry_run: dryRun
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getAllDuplicates(page = 1, limit = 10, resolved = null) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT dc.*, 
               v1.name as voter1_name, v1.aadhaar_number as voter1_aadhaar,
               v2.name as voter2_name, v2.aadhaar_number as voter2_aadhaar
        FROM duplicate_checks dc
        JOIN voters v1 ON dc.voter_id_1 = v1.voter_id
        JOIN voters v2 ON dc.voter_id_2 = v2.voter_id
      `;
      const params = [];

      if (resolved !== null) {
        query += ' WHERE dc.resolved = ?';
        params.push(resolved);
      }

      query += ' ORDER BY dc.flagged_date DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await connection.query(query, params);
      const [countRows] = await connection.query(
        `SELECT COUNT(*) as total FROM duplicate_checks ${resolved !== null ? 'WHERE resolved = ?' : ''}`,
        resolved !== null ? [resolved] : []
      );

      return {
        duplicates: rows,
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

  async resolveDuplicate(checkId, resolutionData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { action, note, approved_by, appeal_window_end } = resolutionData;
      
      // Update duplicate check
      await connection.query(
        `UPDATE duplicate_checks 
         SET action = ?, resolved = ?, resolved_at = ?, note = ?, approved_by = ?, appeal_window_end = ?
         WHERE check_id = ?`,
        [
          action,
          action !== 'pending',
          action !== 'pending' ? new Date() : null,
          note || null,
          approved_by || null,
          appeal_window_end || null,
          checkId
        ]
      );
      
      // If action is merge, mark one voter as inactive (soft delete)
      if (action === 'merge') {
        const duplicate = await this.getDuplicateById(checkId);
        if (duplicate) {
          // Mark voter_id_2 as inactive (merged into voter_id_1)
          await connection.query(
            'UPDATE voters SET is_verified = FALSE, is_active = FALSE WHERE voter_id = ?',
            [duplicate.voter_id_2]
          );
          
          // Log audit event
          const auditService = require('./auditLogService');
          await auditService.logAction({
            action_type: 'voter_merged',
            entity_type: 'voter',
            entity_id: duplicate.voter_id_2,
            actor_id: approved_by,
            metadata: JSON.stringify({
              merged_into: duplicate.voter_id_1,
              reason: 'Duplicate resolution',
              note
            })
          });
        }
      }
      
      // If action is mark-as-ghost, mark both as inactive
      if (action === 'mark-as-ghost') {
        const duplicate = await this.getDuplicateById(checkId);
        if (duplicate) {
          await connection.query(
            'UPDATE voters SET is_verified = FALSE, is_active = FALSE WHERE voter_id IN (?, ?)',
            [duplicate.voter_id_1, duplicate.voter_id_2]
          );
        }
      }
      
      await connection.commit();
      return await this.getDuplicateById(checkId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getDuplicateById(checkId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT dc.*, 
                v1.name as voter1_name, v1.aadhaar_number as voter1_aadhaar,
                v2.name as voter2_name, v2.aadhaar_number as voter2_aadhaar
         FROM duplicate_checks dc
         JOIN voters v1 ON dc.voter_id_1 = v1.voter_id
         JOIN voters v2 ON dc.voter_id_2 = v2.voter_id
         WHERE dc.check_id = ?`,
        [checkId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }
}

module.exports = new DuplicateDetectionService();

