const pool = require('../config/database');
const EventEmitter = require('events');

/**
 * Notification Service
 * Handles real-time notifications for high-risk flags
 */
class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.activeNotifications = new Map(); // userId -> Set of notification IDs
    this.checkInterval = null;
  }

  /**
   * Start polling for high-risk flags
   */
  startPolling(intervalSeconds = 30) {
    if (this.checkInterval) {
      console.log('⚠️  Notification polling already started');
      return;
    }

    console.log(`🔔 Starting notification polling (interval: ${intervalSeconds}s)`);
    
    // Check immediately
    this.checkHighRiskFlags();
    
    // Then poll periodically
    this.checkInterval = setInterval(() => {
      this.checkHighRiskFlags();
    }, intervalSeconds * 1000);
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Notification polling stopped');
    }
  }

  /**
   * Check for high-risk flags and emit notifications
   */
  async checkHighRiskFlags() {
    const connection = await pool.getConnection();
    try {
      // Check if table exists
      const [tables] = await connection.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'address_cluster_flags'
      `);
      
      if (tables.length === 0) {
        // Table doesn't exist, skip silently
        return;
      }
      
      // Get critical/high risk address flags created in last 5 minutes
      // Check if table exists and has the correct columns
      const [tableInfo] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'address_cluster_flags'
      `);
      
      if (tableInfo.length === 0) {
        // No columns found, skip silently
        return;
      }
      
      const hasIdColumn = tableInfo.some(col => col.COLUMN_NAME === 'id');
      const hasFlagIdColumn = tableInfo.some(col => col.COLUMN_NAME === 'flag_id');
      const hasClusterIdColumn = tableInfo.some(col => col.COLUMN_NAME === 'cluster_id');
      
      const idColumn = hasIdColumn ? 'id' : (hasFlagIdColumn ? 'flag_id' : (hasClusterIdColumn ? 'cluster_id' : null));
      
      if (!idColumn) {
        // Table doesn't have ID column, skip silently
        return;
      }
      
      // Build query based on available columns
      const hasRiskLevel = tableInfo.some(col => col.COLUMN_NAME === 'risk_level');
      const hasRiskScore = tableInfo.some(col => col.COLUMN_NAME === 'risk_score');
      const hasIsSuspicious = tableInfo.some(col => col.COLUMN_NAME === 'is_suspicious');
      
      if (!hasRiskLevel && !hasIsSuspicious) {
        // Table doesn't have risk columns, skip silently
        return;
      }
      
      let query = `SELECT ${idColumn} as id, address_hash`;
      if (tableInfo.some(col => col.COLUMN_NAME === 'voter_count')) query += ', voter_count';
      if (hasRiskLevel) query += ', risk_level';
      if (hasRiskScore) query += ', risk_score';
      if (tableInfo.some(col => col.COLUMN_NAME === 'district')) query += ', district';
      if (tableInfo.some(col => col.COLUMN_NAME === 'state')) query += ', state';
      query += ` FROM address_cluster_flags WHERE `;
      
      if (hasRiskLevel) {
        query += `risk_level IN ('critical', 'high')`;
      } else if (hasIsSuspicious) {
        query += `is_suspicious = TRUE`;
      } else {
        return;
      }
      
      if (tableInfo.some(col => col.COLUMN_NAME === 'status')) query += ` AND status = 'open'`;
      if (tableInfo.some(col => col.COLUMN_NAME === 'flagged_at')) query += ` AND flagged_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)`;
      if (tableInfo.some(col => col.COLUMN_NAME === 'created_at')) query += ` AND created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)`;
      
      if (hasRiskScore) {
        query += ` ORDER BY risk_score DESC`;
      }
      query += ` LIMIT 10`;
      
      // Get critical flags
      let criticalFlags = [];
      try {
        const [flags] = await connection.query(query);
        criticalFlags = flags || [];
      } catch (queryError) {
        // Silently skip if query fails (table structure mismatch)
        console.debug('Skipping address flags check:', queryError.message);
      }

      // Get urgent review tasks created in last 5 minutes
      let urgentTasks = [];
      try {
        const [tasks] = await connection.query(`
          SELECT task_id, voter_id, task_type, priority, created_at
          FROM review_tasks
          WHERE priority = 'urgent'
            AND status = 'open'
            AND created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
          ORDER BY created_at DESC
          LIMIT 10
        `);
        urgentTasks = tasks || [];
      } catch (taskError) {
        // Silently skip if review_tasks table doesn't exist or has issues
        console.debug('Skipping review tasks check:', taskError.message);
      }
      
      // Emit notifications for critical flags
      for (const flag of criticalFlags) {
        const notificationId = `flag_${flag.id}`;
        this.emit('high-risk-flag', {
          id: notificationId,
          type: 'address_cluster',
          severity: flag.risk_level,
          title: `High-Risk Address Cluster Detected`,
          message: `${flag.voter_count} voters registered at flagged address in ${flag.district}, ${flag.state}. Risk score: ${(flag.risk_score * 100).toFixed(0)}%`,
          data: flag,
          timestamp: new Date()
        });
      }

      // Emit notifications for urgent tasks
      for (const task of urgentTasks) {
        const notificationId = `task_${task.task_id}`;
        this.emit('urgent-task', {
          id: notificationId,
          type: 'review_task',
          severity: 'urgent',
          title: `Urgent Review Task Created`,
          message: `Urgent ${task.task_type.replace('_', ' ')} task requires immediate attention`,
          data: task,
          timestamp: new Date()
        });
      }

      return {
        criticalFlags: criticalFlags.length,
        urgentTasks: urgentTasks.length
      };
    } catch (error) {
      console.error('Error checking high-risk flags:', error);
      return { criticalFlags: 0, urgentTasks: 0 };
    } finally {
      connection.release();
    }
  }

  /**
   * Get notifications for a user (based on their role/permissions)
   */
  async getUserNotifications(userId, userRole) {
    const connection = await pool.getConnection();
    try {
      const notifications = [];

      // Get high-risk flags user can see
      if (['ero', 'deo', 'ceo', 'superadmin', 'eci'].includes(userRole?.toLowerCase())) {
        const [flags] = await connection.query(`
          SELECT id, address_hash, voter_count, risk_level, risk_score, district, state, created_at
          FROM address_cluster_flags
          WHERE risk_level IN ('critical', 'high')
            AND status = 'open'
            AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
          ORDER BY risk_score DESC
          LIMIT 20
        `);

        for (const flag of flags) {
          notifications.push({
            id: `flag_${flag.id}`,
            type: 'address_cluster',
            severity: flag.risk_level,
            title: `High-Risk Address Cluster`,
            message: `${flag.voter_count} voters at flagged address`,
            data: flag,
            timestamp: flag.created_at
          });
        }
      }

      // Get urgent tasks assigned to user or unassigned
      if (['blo', 'ero', 'deo', 'ceo', 'superadmin', 'eci'].includes(userRole?.toLowerCase())) {
        const [tasks] = await connection.query(`
          SELECT task_id, voter_id, task_type, priority, created_at
          FROM review_tasks
          WHERE priority = 'urgent'
            AND status = 'open'
            AND (assigned_to = ? OR assigned_to IS NULL)
            AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
          ORDER BY created_at DESC
          LIMIT 20
        `, [userId]);

        for (const task of tasks) {
          notifications.push({
            id: `task_${task.task_id}`,
            type: 'review_task',
            severity: 'urgent',
            title: `Urgent Review Task`,
            message: `${task.task_type.replace('_', ' ')} requires immediate attention`,
            data: task,
            timestamp: task.created_at
          });
        }
      }

      return notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    } finally {
      connection.release();
    }
  }
}

// Singleton instance
const notificationService = new NotificationService();

// Auto-start polling if not in test environment
if (process.env.NODE_ENV !== 'test' && require.main !== module) {
  // Start polling when imported (will be started by server.js)
  // notificationService.startPolling(30); // Check every 30 seconds
}

module.exports = notificationService;
