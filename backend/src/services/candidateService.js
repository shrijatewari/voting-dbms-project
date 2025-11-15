const pool = require('../config/database');

class CandidateService {
  async createCandidate(candidateData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(
        'INSERT INTO candidates (election_id, name, manifesto) VALUES (?, ?, ?)',
        [
          candidateData.election_id,
          candidateData.name,
          candidateData.manifesto || null
        ]
      );

      // Add to manifestos table
      if (candidateData.manifesto) {
        await connection.query(
          'INSERT INTO candidate_manifestos (candidate_id, manifesto_text, version) VALUES (?, ?, ?)',
          [result.insertId, candidateData.manifesto, 1]
        );
      }

      await connection.commit();
      return await this.getCandidateById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getCandidateById(candidateId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM candidates WHERE candidate_id = ?',
        [candidateId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  async getCandidatesByElection(electionId, page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      const [rows] = await connection.query(
        'SELECT * FROM candidates WHERE election_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [electionId, limit, offset]
      );
      const [countRows] = await connection.query(
        'SELECT COUNT(*) as total FROM candidates WHERE election_id = ?',
        [electionId]
      );
      return {
        candidates: rows,
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

  async getAllCandidates(page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      const [rows] = await connection.query(
        'SELECT * FROM candidates ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      const [countRows] = await connection.query('SELECT COUNT(*) as total FROM candidates');
      return {
        candidates: rows,
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

  async updateCandidate(candidateId, candidateData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const updates = [];
      const values = [];

      if (candidateData.name) {
        updates.push('name = ?');
        values.push(candidateData.name);
      }
      if (candidateData.manifesto !== undefined) {
        updates.push('manifesto = ?');
        values.push(candidateData.manifesto);
      }

      if (updates.length > 0) {
        values.push(candidateId);
        await connection.query(
          `UPDATE candidates SET ${updates.join(', ')} WHERE candidate_id = ?`,
          values
        );
      }

      // Update manifestos if manifesto changed
      if (candidateData.manifesto) {
        const [manifestoRows] = await connection.query(
          'SELECT MAX(version) as max_version FROM candidate_manifestos WHERE candidate_id = ?',
          [candidateId]
        );
        const nextVersion = (manifestoRows[0]?.max_version || 0) + 1;
        
        await connection.query(
          'INSERT INTO candidate_manifestos (candidate_id, manifesto_text, version) VALUES (?, ?, ?)',
          [candidateId, candidateData.manifesto, nextVersion]
        );
      }

      await connection.commit();
      return await this.getCandidateById(candidateId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteCandidate(candidateId) {
    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM candidates WHERE candidate_id = ?', [candidateId]);
      return { success: true };
    } finally {
      connection.release();
    }
  }
}

module.exports = new CandidateService();

