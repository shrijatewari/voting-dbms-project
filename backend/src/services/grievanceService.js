const pool = require('../config/database');
const crypto = require('crypto');

/**
 * Grievance Service
 * Handles citizen grievances and support tickets
 */
class GrievanceService {
  /**
   * Generate unique ticket number
   */
  generateTicketNumber() {
    const prefix = 'GRV';
    const timestamp = Date.now().toString().slice(-8);
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Create grievance
   */
  async createGrievance(grievanceData) {
    const connection = await pool.getConnection();
    try {
      // Validate required fields
      if (!grievanceData.issue_type || !grievanceData.subject || !grievanceData.description) {
        throw new Error('Issue type, subject, and description are required');
      }
      
      const ticketNumber = this.generateTicketNumber();
      
      // Convert empty strings to null
      const voterId = grievanceData.voter_id && grievanceData.voter_id.trim() !== '' 
        ? parseInt(grievanceData.voter_id) || null 
        : null;
      const aadhaarNumber = grievanceData.aadhaar_number && grievanceData.aadhaar_number.trim() !== '' 
        ? grievanceData.aadhaar_number.trim() 
        : null;
      
      const [result] = await connection.query(
        `INSERT INTO grievances 
         (ticket_number, voter_id, aadhaar_number, issue_type, subject, description, priority) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          ticketNumber,
          voterId,
          aadhaarNumber,
          grievanceData.issue_type,
          grievanceData.subject.trim(),
          grievanceData.description.trim(),
          grievanceData.priority || 'medium'
        ]
      );

      return await this.getGrievanceById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Get grievance by ID
   */
  async getGrievanceById(grievanceId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM grievances WHERE grievance_id = ?',
        [grievanceId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get grievance by ticket number
   */
  async getGrievanceByTicket(ticketNumber) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM grievances WHERE ticket_number = ?',
        [ticketNumber]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all grievances with filters
   */
  async getAllGrievances(filters = {}, page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM grievances WHERE 1=1';
      const params = [];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.issue_type) {
        query += ' AND issue_type = ?';
        params.push(filters.issue_type);
      }

      if (filters.priority) {
        query += ' AND priority = ?';
        params.push(filters.priority);
      }

      if (filters.voter_id) {
        query += ' AND voter_id = ?';
        params.push(filters.voter_id);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await connection.query(query, params);
      const [countRows] = await connection.query(
        query.replace('SELECT *', 'SELECT COUNT(*) as total').replace('ORDER BY created_at DESC LIMIT ? OFFSET ?', ''),
        params.slice(0, -2)
      );

      return {
        grievances: rows,
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
   * Update grievance status
   */
  async updateGrievance(grievanceId, updateData) {
    const connection = await pool.getConnection();
    try {
      const updates = [];
      const params = [];

      if (updateData.status) {
        updates.push('status = ?');
        params.push(updateData.status);
        if (updateData.status === 'resolved') {
          updates.push('resolved_at = ?');
          params.push(new Date());
        }
      }

      if (updateData.resolution) {
        updates.push('resolution = ?');
        params.push(updateData.resolution);
      }

      if (updateData.assigned_to) {
        updates.push('assigned_to = ?');
        params.push(updateData.assigned_to);
      }

      if (updateData.priority) {
        updates.push('priority = ?');
        params.push(updateData.priority);
      }

      if (updates.length === 0) {
        return await this.getGrievanceById(grievanceId);
      }

      params.push(grievanceId);
      await connection.query(
        `UPDATE grievances SET ${updates.join(', ')} WHERE grievance_id = ?`,
        params
      );

      return await this.getGrievanceById(grievanceId);
    } finally {
      connection.release();
    }
  }

  /**
   * Reopen grievance
   */
  async reopenGrievance(grievanceId, reason) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'UPDATE grievances SET status = ?, resolution = CONCAT(COALESCE(resolution, ""), "\n\nReopened: ", ?) WHERE grievance_id = ?',
        ['reopened', reason, grievanceId]
      );
      return await this.getGrievanceById(grievanceId);
    } finally {
      connection.release();
    }
  }
}

module.exports = new GrievanceService();

