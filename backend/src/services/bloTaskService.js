/**
 * BLO (Booth Level Officer) Task Service
 * Handles field verification tasks, geo-tagging, photo evidence, and offline sync
 */

const pool = require('../config/database');

class BLOTaskService {
  /**
   * Assign task to BLO
   */
  async assignTask(taskData) {
    const connection = await pool.getConnection();
    try {
      const { task_type, voter_id, blo_id, due_date } = taskData;
      
      const [result] = await connection.query(
        `INSERT INTO blo_tasks (task_type, voter_id, blo_id, due_date)
         VALUES (?, ?, ?, ?)`,
        [task_type, voter_id, blo_id, due_date || null]
      );
      
      return await this.getTaskById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Get tasks for a BLO
   */
  async getBLOTasks(bloId, status = null) {
    const connection = await pool.getConnection();
    try {
      let query = `
        SELECT 
          t.*, 
          v.name as voter_name, 
          v.aadhaar_number,
          v.house_number,
          v.street,
          v.village_city,
          v.district,
          v.state,
          v.pin_code,
          CONCAT_WS(', ', 
            NULLIF(v.house_number, ''), 
            NULLIF(v.street, ''), 
            NULLIF(v.village_city, ''), 
            NULLIF(v.district, ''), 
            NULLIF(v.state, ''), 
            NULLIF(v.pin_code, '')
          ) as voter_address
        FROM blo_tasks t
        JOIN voters v ON t.voter_id = v.voter_id
        WHERE t.blo_id = ?
      `;
      const params = [bloId];
      
      if (status) {
        query += ' AND t.status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY t.due_date ASC, t.assigned_at DESC';
      
      const [tasks] = await connection.query(query, params);
      return tasks;
    } finally {
      connection.release();
    }
  }

  /**
   * Submit task completion
   */
  async submitTask(taskId, submissionData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { geo, photos, notes, status } = submissionData;
      
      // Validate geo-fencing (mock - in production, check if BLO is near voter address)
      const task = await this.getTaskById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Update task
      await connection.query(
        `UPDATE blo_tasks 
         SET status = ?, geo_latitude = ?, geo_longitude = ?, photos = ?, notes = ?, submitted_at = NOW()
         WHERE task_id = ?`,
        [
          status || 'completed',
          geo?.lat || null,
          geo?.lng || null,
          JSON.stringify(photos || []),
          notes || null,
          taskId
        ]
      );
      
      // If verification passed, update voter status
      if (status === 'completed' && task.task_type === 'field-verification') {
        await connection.query(
          'UPDATE voters SET is_verified = TRUE WHERE voter_id = ?',
          [task.voter_id]
        );
      }
      
      // Log audit event
      const auditService = require('./auditLogService');
      await auditService.logAction({
        action_type: 'blo_task_submitted',
        entity_type: 'task',
        entity_id: taskId,
        actor_id: task.blo_id,
        metadata: JSON.stringify({
          geo,
          photo_count: photos?.length || 0,
          status
        })
      });
      
      await connection.commit();
      return await this.getTaskById(taskId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId) {
    const connection = await pool.getConnection();
    try {
      const [tasks] = await connection.query(
        `SELECT 
          t.*, 
          v.name as voter_name, 
          v.aadhaar_number,
          v.house_number,
          v.street,
          v.village_city,
          v.district,
          v.state,
          v.pin_code,
          CONCAT_WS(', ', 
            NULLIF(v.house_number, ''), 
            NULLIF(v.street, ''), 
            NULLIF(v.village_city, ''), 
            NULLIF(v.district, ''), 
            NULLIF(v.state, ''), 
            NULLIF(v.pin_code, '')
          ) as voter_address
         FROM blo_tasks t
         JOIN voters v ON t.voter_id = v.voter_id
         WHERE t.task_id = ?`,
        [taskId]
      );
      return tasks[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get tasks by status (for admin dashboard)
   */
  async getTasksByStatus(status, page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      
      const [tasks] = await connection.query(
        `SELECT t.*, v.name as voter_name, v.aadhaar_number
         FROM blo_tasks t
         JOIN voters v ON t.voter_id = v.voter_id
         WHERE t.status = ?
         ORDER BY t.due_date ASC
         LIMIT ? OFFSET ?`,
        [status, limit, offset]
      );
      
      const [count] = await connection.query(
        'SELECT COUNT(*) as total FROM blo_tasks WHERE status = ?',
        [status]
      );
      
      return {
        tasks,
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
}

module.exports = new BLOTaskService();

