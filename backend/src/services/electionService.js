const pool = require('../config/database');

class ElectionService {
  async createElection(electionData) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'INSERT INTO elections (title, start_date, end_date, status) VALUES (?, ?, ?, ?)',
        [
          electionData.title,
          electionData.start_date,
          electionData.end_date,
          electionData.status || 'upcoming'
        ]
      );
      return await this.getElectionById(result.insertId);
    } finally {
      connection.release();
    }
  }

  async getElectionById(electionId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM elections WHERE election_id = ?',
        [electionId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  async getAllElections(page = 1, limit = 10, filters = {}) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      let query = 'SELECT e.*, COUNT(DISTINCT v.vote_id) as total_votes, COUNT(DISTINCT c.candidate_id) as total_candidates FROM elections e LEFT JOIN votes v ON e.election_id = v.election_id LEFT JOIN candidates c ON e.election_id = c.election_id';
      const params = [];
      const conditions = [];

      // Filter by status
      if (filters.status) {
        conditions.push('e.status = ?');
        params.push(filters.status);
      }

      // Filter by date range
      if (filters.start_date) {
        conditions.push('e.start_date >= ?');
        params.push(filters.start_date);
      }
      if (filters.end_date) {
        conditions.push('e.end_date <= ?');
        params.push(filters.end_date);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY e.election_id ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await connection.query(query, params);
      
      // Get counts by status
      const [statusCounts] = await connection.query(
        'SELECT status, COUNT(*) as count FROM elections GROUP BY status'
      );

      const [countRows] = await connection.query(
        conditions.length > 0 
          ? `SELECT COUNT(*) as total FROM elections WHERE ${conditions.join(' AND ')}`
          : 'SELECT COUNT(*) as total FROM elections',
        conditions.length > 0 ? params.slice(0, -2) : []
      );

      // Auto-update election statuses based on dates
      const now = new Date();
      for (const election of rows) {
        const startDate = new Date(election.start_date);
        const endDate = new Date(election.end_date);
        
        if (election.status === 'upcoming' && now >= startDate && now <= endDate) {
          await connection.query(
            'UPDATE elections SET status = ? WHERE election_id = ?',
            ['active', election.election_id]
          );
          election.status = 'active';
        } else if (election.status === 'active' && now > endDate) {
          await connection.query(
            'UPDATE elections SET status = ? WHERE election_id = ?',
            ['completed', election.election_id]
          );
          election.status = 'completed';
        }
      }

      return {
        elections: rows,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item.status] = item.count;
          return acc;
        }, {}),
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

  async getActiveElections() {
    const connection = await pool.getConnection();
    try {
      const now = new Date();
      const [rows] = await connection.query(
        `SELECT e.*, COUNT(DISTINCT v.vote_id) as total_votes 
         FROM elections e 
         LEFT JOIN votes v ON e.election_id = v.election_id 
         WHERE e.status = 'active' AND ? >= e.start_date AND ? <= e.end_date
         GROUP BY e.election_id
         ORDER BY e.start_date ASC`,
        [now, now]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  async getCompletedElections(page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      const [rows] = await connection.query(
        `SELECT e.*, COUNT(DISTINCT v.vote_id) as total_votes, 
                COUNT(DISTINCT c.candidate_id) as total_candidates,
                MAX(v.created_at) as last_vote_time
         FROM elections e 
         LEFT JOIN votes v ON e.election_id = v.election_id 
         LEFT JOIN candidates c ON e.election_id = c.election_id
         WHERE e.status = 'completed'
         GROUP BY e.election_id
         ORDER BY e.end_date DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      const [countRows] = await connection.query(
        "SELECT COUNT(*) as total FROM elections WHERE status = 'completed'"
      );
      return {
        elections: rows,
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

  async updateElection(electionId, electionData) {
    const connection = await pool.getConnection();
    try {
      const updates = [];
      const values = [];

      if (electionData.title) {
        updates.push('title = ?');
        values.push(electionData.title);
      }
      if (electionData.start_date) {
        updates.push('start_date = ?');
        values.push(electionData.start_date);
      }
      if (electionData.end_date) {
        updates.push('end_date = ?');
        values.push(electionData.end_date);
      }
      if (electionData.status) {
        updates.push('status = ?');
        values.push(electionData.status);
      }

      if (updates.length === 0) {
        return await this.getElectionById(electionId);
      }

      values.push(electionId);
      await connection.query(
        `UPDATE elections SET ${updates.join(', ')} WHERE election_id = ?`,
        values
      );
      return await this.getElectionById(electionId);
    } finally {
      connection.release();
    }
  }

  async deleteElection(electionId) {
    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM elections WHERE election_id = ?', [electionId]);
      return { success: true };
    } finally {
      connection.release();
    }
  }

  async isElectionActive(electionId) {
    const connection = await pool.getConnection();
    try {
      const election = await this.getElectionById(electionId);
      if (!election) return false;
      
      const now = new Date();
      const startDate = new Date(election.start_date);
      const endDate = new Date(election.end_date);
      
      return election.status === 'active' && now >= startDate && now <= endDate;
    } finally {
      connection.release();
    }
  }
}

module.exports = new ElectionService();

