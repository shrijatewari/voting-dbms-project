/**
 * Appeal Service
 * Handles voter appeals for removals, duplicate flags, verification rejections
 * Includes SLA tracking and auto-escalation
 */

const pool = require('../config/database');

class AppealService {
  /**
   * Create appeal
   */
  async createAppeal(appealData) {
    const connection = await pool.getConnection();
    try {
      const { voter_id, appeal_type, reason, attachments } = appealData;
      
      // Calculate SLA deadline (14 days from submission)
      const slaDeadline = new Date();
      slaDeadline.setDate(slaDeadline.getDate() + 14);
      
      const [result] = await connection.query(
        `INSERT INTO appeals (voter_id, appeal_type, reason, attachments, sla_deadline)
         VALUES (?, ?, ?, ?, ?)`,
        [
          voter_id,
          appeal_type,
          reason,
          JSON.stringify(attachments || []),
          slaDeadline
        ]
      );
      
      // Log audit event
      const auditService = require('./auditLogService');
      await auditService.logAction({
        action_type: 'appeal_created',
        entity_type: 'appeal',
        entity_id: result.insertId,
        actor_id: voter_id,
        metadata: JSON.stringify({ appeal_type, reason })
      });
      
      return await this.getAppealById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Get appeal by ID
   */
  async getAppealById(appealId) {
    const connection = await pool.getConnection();
    try {
      const [appeals] = await connection.query(
        `SELECT a.*, v.name as voter_name, v.aadhaar_number
         FROM appeals a
         JOIN voters v ON a.voter_id = v.voter_id
         WHERE a.appeal_id = ?`,
        [appealId]
      );
      return appeals[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get appeals by voter
   */
  async getAppealsByVoter(voterId) {
    const connection = await pool.getConnection();
    try {
      const [appeals] = await connection.query(
        `SELECT * FROM appeals
         WHERE voter_id = ?
         ORDER BY submitted_at DESC`,
        [voterId]
      );
      return appeals;
    } finally {
      connection.release();
    }
  }

  /**
   * Get appeals by status (for admin)
   */
  async getAppealsByStatus(status, page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      
      const [appeals] = await connection.query(
        `SELECT a.*, v.name as voter_name, v.aadhaar_number
         FROM appeals a
         JOIN voters v ON a.voter_id = v.voter_id
         WHERE a.status = ?
         ORDER BY a.sla_deadline ASC, a.submitted_at DESC
         LIMIT ? OFFSET ?`,
        [status, limit, offset]
      );
      
      const [count] = await connection.query(
        'SELECT COUNT(*) as total FROM appeals WHERE status = ?',
        [status]
      );
      
      return {
        appeals,
        pagination: {
          page,
          limit,
          total: count[0].total,
          totalPages: Math.ceil(count[0].total / limit)
        }
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Review appeal (admin action)
   */
  async reviewAppeal(appealId, reviewData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { status, review_notes, reviewed_by } = reviewData;
      
      if (!['approved', 'rejected', 'escalated'].includes(status)) {
        throw new Error('Invalid status. Must be: approved, rejected, or escalated');
      }
      
      await connection.query(
        `UPDATE appeals 
         SET status = ?, review_notes = ?, reviewed_by = ?, reviewed_at = NOW()
         WHERE appeal_id = ?`,
        [status, review_notes, reviewed_by, appealId]
      );
      
      const appeal = await this.getAppealById(appealId);
      
      // If approved, reverse the original action
      if (status === 'approved') {
        await this.processApprovedAppeal(appeal, connection);
      }
      
      // Log audit event
      const auditService = require('./auditLogService');
      await auditService.logAction({
        action_type: 'appeal_reviewed',
        entity_type: 'appeal',
        entity_id: appealId,
        actor_id: reviewed_by,
        metadata: JSON.stringify({ status, review_notes })
      });
      
      await connection.commit();
      return appeal;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Process approved appeal (reverse original action)
   */
  async processApprovedAppeal(appeal, connection) {
    if (appeal.appeal_type === 'removal') {
      // Restore voter
      await connection.query(
        'UPDATE voters SET is_verified = TRUE, is_active = TRUE WHERE voter_id = ?',
        [appeal.voter_id]
      );
    } else if (appeal.appeal_type === 'duplicate-flag') {
      // Remove duplicate flag
      await connection.query(
        `UPDATE duplicate_checks 
         SET action = 'reject', resolved = FALSE, resolved_at = NULL
         WHERE (voter_id_1 = ? OR voter_id_2 = ?) AND resolved = TRUE`,
        [appeal.voter_id, appeal.voter_id]
      );
    }
  }

  /**
   * Check SLA violations (auto-escalation)
   */
  async checkSLAViolations() {
    const connection = await pool.getConnection();
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Find appeals past SLA deadline
      const [violations] = await connection.query(
        `SELECT * FROM appeals
         WHERE status IN ('submitted', 'under-review')
         AND sla_deadline < ?
         ORDER BY sla_deadline ASC`,
        [today]
      );
      
      // Auto-escalate
      for (const appeal of violations) {
        if (appeal.status === 'submitted') {
          await connection.query(
            'UPDATE appeals SET status = ? WHERE appeal_id = ?',
            ['under-review', appeal.appeal_id]
          );
        } else if (appeal.status === 'under-review') {
          await connection.query(
            'UPDATE appeals SET status = ? WHERE appeal_id = ?',
            ['escalated', appeal.appeal_id]
          );
        }
      }
      
      return {
        violations_found: violations.length,
        escalated: violations.length
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = new AppealService();

