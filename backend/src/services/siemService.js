/**
 * SIEM (Security Information and Event Management) Service
 * Monitors security events, anomalies, and generates alerts
 */

const pool = require('../config/database');

class SIEMService {
  /**
   * Log security event
   */
  async logSecurityEvent(eventData) {
    const connection = await pool.getConnection();
    try {
      const {
        event_type,
        severity,
        source_ip,
        user_id,
        action,
        details,
        risk_score
      } = eventData;
      
      // In production, send to SIEM system (ELK, Splunk, etc.)
      // For now, log to database
      await connection.query(
        `INSERT INTO security_events 
         (event_type, severity, source_ip, user_id, action, details, risk_score, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          event_type,
          severity || 'medium',
          source_ip,
          user_id,
          action,
          JSON.stringify(details || {}),
          risk_score || 50
        ]
      );
      
      // Check if alert threshold exceeded
      if (risk_score >= 80) {
        await this.triggerAlert(eventData);
      }
      
      return { success: true };
    } finally {
      connection.release();
    }
  }

  /**
   * Trigger security alert
   */
  async triggerAlert(eventData) {
    // In production, send to SOC team, email, SMS, etc.
    console.warn(`[SIEM ALERT] High-risk security event:`, eventData);
    
    // Could integrate with:
    // - Email notifications
    // - SMS alerts
    // - Slack/Discord webhooks
    // - PagerDuty
    // - SIEM dashboard
    
    return { alerted: true, timestamp: new Date().toISOString() };
  }

  /**
   * Detect suspicious login patterns
   */
  async detectSuspiciousLogins() {
    const connection = await pool.getConnection();
    try {
      // Multiple failed logins from same IP
      const [failedLogins] = await connection.query(
        `SELECT source_ip, COUNT(*) as attempts, MAX(timestamp) as last_attempt
         FROM security_events
         WHERE event_type = 'failed_login'
         AND timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)
         GROUP BY source_ip
         HAVING attempts >= 5
         ORDER BY attempts DESC`
      );
      
      // Login from unusual location
      const [unusualLocations] = await connection.query(
        `SELECT user_id, source_ip, COUNT(*) as logins, MAX(timestamp) as last_login
         FROM security_events
         WHERE event_type = 'login'
         AND timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)
         GROUP BY user_id, source_ip
         HAVING logins = 1
         ORDER BY last_login DESC
         LIMIT 50`
      );
      
      return {
        failed_login_attacks: failedLogins.length,
        unusual_location_logins: unusualLocations.length,
        details: {
          failed_logins: failedLogins,
          unusual_locations: unusualLocations
        }
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Get security dashboard stats
   */
  async getSecurityStats(days = 7) {
    const connection = await pool.getConnection();
    try {
      const [stats] = await connection.query(
        `SELECT 
           COUNT(*) as total_events,
           COUNT(DISTINCT source_ip) as unique_ips,
           COUNT(DISTINCT user_id) as affected_users,
           AVG(risk_score) as avg_risk_score,
           MAX(risk_score) as max_risk_score
         FROM security_events
         WHERE timestamp > DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [days]
      );
      
      const [eventsByType] = await connection.query(
        `SELECT event_type, COUNT(*) as count, AVG(risk_score) as avg_risk
         FROM security_events
         WHERE timestamp > DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY event_type
         ORDER BY count DESC`,
        [days]
      );
      
      const [eventsBySeverity] = await connection.query(
        `SELECT severity, COUNT(*) as count
         FROM security_events
         WHERE timestamp > DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY severity
         ORDER BY count DESC`,
        [days]
      );
      
      return {
        period_days: days,
        summary: stats[0],
        by_type: eventsByType,
        by_severity: eventsBySeverity
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = new SIEMService();

