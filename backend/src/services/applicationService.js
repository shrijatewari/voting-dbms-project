const pool = require('../config/database');
const crypto = require('crypto');

/**
 * Application Service
 * Handles voter registration application tracking
 */
class ApplicationService {
  /**
   * Generate unique application ID
   */
  generateApplicationId() {
    const prefix = 'APP';
    const year = new Date().getFullYear();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}${year}${random}`;
  }

  /**
   * Generate EPIC number (Electors Photo Identity Card)
   */
  generateEPICNumber(stateCode, districtCode) {
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${stateCode}${districtCode}${random}`;
  }

  /**
   * Create application
   */
  async createApplication(voterId) {
    const connection = await pool.getConnection();
    try {
      const applicationId = this.generateApplicationId();
      
      await connection.query(
        'UPDATE voters SET application_id = ?, application_status = ? WHERE voter_id = ?',
        [applicationId, 'submitted', voterId]
      );

      // Create tracking entry
      await connection.query(
        'INSERT INTO application_tracking (application_id, voter_id, status) VALUES (?, ?, ?)',
        [applicationId, voterId, 'submitted']
      );

      return applicationId;
    } finally {
      connection.release();
    }
  }

  /**
   * Update application status
   */
  async updateStatus(applicationId, newStatus, changedBy, remarks = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update voter status
      await connection.query(
        'UPDATE voters SET application_status = ? WHERE application_id = ?',
        [newStatus, applicationId]
      );

      // Add tracking entry
      await connection.query(
        'INSERT INTO application_tracking (application_id, voter_id, status, changed_by, remarks) SELECT application_id, voter_id, ?, ?, ? FROM voters WHERE application_id = ?',
        [newStatus, changedBy, remarks, applicationId]
      );

      // If approved, generate EPIC
      if (newStatus === 'approved') {
        const [voters] = await connection.query(
          'SELECT voter_id, state, district FROM voters WHERE application_id = ?',
          [applicationId]
        );
        
        if (voters.length > 0) {
          const voter = voters[0];
          const stateCode = voter.state ? voter.state.substring(0, 2).toUpperCase() : 'XX';
          const districtCode = voter.district ? voter.district.substring(0, 2).toUpperCase() : 'XX';
          const epicNumber = this.generateEPICNumber(stateCode, districtCode);
          
          await connection.query(
            'UPDATE voters SET epic_number = ?, application_status = ? WHERE application_id = ?',
            [epicNumber, 'epic_generated', applicationId]
          );
        }
      }

      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get application tracking history
   */
  async getTrackingHistory(applicationId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT at.*, u.username, u.role 
         FROM application_tracking at
         LEFT JOIN users u ON at.changed_by = u.user_id
         WHERE at.application_id = ?
         ORDER BY at.status_changed_at ASC`,
        [applicationId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get application by ID
   */
  async getApplicationByID(applicationId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM voters WHERE application_id = ?',
        [applicationId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }
}

module.exports = new ApplicationService();

