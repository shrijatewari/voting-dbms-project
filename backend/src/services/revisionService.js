/**
 * Revision Announcement Service
 * Handles voter roll revision announcements, notifications, and tracking
 */

const pool = require('../config/database');
const notificationService = require('./notificationService');

class RevisionService {
  /**
   * Create revision announcement
   */
  async createAnnouncement(announcementData) {
    const connection = await pool.getConnection();
    try {
      const { region_type, region_value, start_date, end_date, docs_required, created_by } = announcementData;
      
      const [result] = await connection.query(
        `INSERT INTO revision_announcements 
         (region_type, region_value, start_date, end_date, docs_required, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          region_type,
          region_value,
          start_date,
          end_date,
          JSON.stringify(docs_required || []),
          created_by
        ]
      );
      
      // Send notifications to affected voters
      await this.sendRevisionNotifications(result.insertId, connection);
      
      return await this.getAnnouncementById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Send notifications to voters in the revision region
   */
  async sendRevisionNotifications(announcementId, connection) {
    const announcement = await this.getAnnouncementById(announcementId);
    if (!announcement) return;
    
    try {
      // Build query to find affected voters
      let query = 'SELECT voter_id, name, mobile_number, email FROM voters WHERE 1=1';
      const params = [];
      
      if (announcement.region_type === 'district' && announcement.region_value) {
        query += ' AND district = ?';
        params.push(announcement.region_value);
      } else if (announcement.region_type === 'state' && announcement.region_value) {
        query += ' AND state = ?';
        params.push(announcement.region_value);
      }
      
      const [voters] = await connection.query(query, params);
      
      // Send SMS and Email notifications
      for (const voter of voters) {
        if (voter.mobile_number) {
          await notificationService.sendSMS(voter.mobile_number, {
            message: `Voter Roll Revision: ${announcement.start_date} to ${announcement.end_date}. Please verify your details.`
          }).catch(() => {}); // Ignore errors
        }
        
        if (voter.email) {
          await notificationService.sendEmail(voter.email, {
            subject: 'Voter Roll Revision Notice',
            body: `Dear ${voter.name},\n\nA voter roll revision is scheduled from ${announcement.start_date} to ${announcement.end_date}.\n\nPlease verify your details on the portal.`
          }).catch(() => {}); // Ignore errors
        }
      }
      
      // Mark as notified
      await connection.query(
        'UPDATE revision_announcements SET notification_sent = TRUE WHERE announcement_id = ?',
        [announcementId]
      );
      
      return { voters_notified: voters.length };
    } catch (error) {
      console.error('Error sending revision notifications:', error);
      return { voters_notified: 0, error: error.message };
    }
  }

  /**
   * Get announcement by ID
   */
  async getAnnouncementById(announcementId) {
    const connection = await pool.getConnection();
    try {
      const [announcements] = await connection.query(
        'SELECT * FROM revision_announcements WHERE announcement_id = ?',
        [announcementId]
      );
      if (announcements[0]) {
        announcements[0].docs_required = JSON.parse(announcements[0].docs_required || '[]');
      }
      return announcements[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get active announcements
   */
  async getActiveAnnouncements(region = null) {
    const connection = await pool.getConnection();
    try {
      const today = new Date().toISOString().split('T')[0];
      let query = `
        SELECT * FROM revision_announcements
        WHERE start_date <= ? AND end_date >= ?
      `;
      const params = [today, today];
      
      if (region) {
        if (region.district) {
          query += ' AND region_type = "district" AND region_value = ?';
          params.push(region.district);
        } else if (region.state) {
          query += ' AND (region_type = "state" AND region_value = ? OR region_type = "national")';
          params.push(region.state);
        }
      }
      
      query += ' ORDER BY start_date DESC';
      
      const [announcements] = await connection.query(query, params);
      
      return announcements.map(a => ({
        ...a,
        docs_required: JSON.parse(a.docs_required || '[]')
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Get all announcements
   */
  async getAllAnnouncements(page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      const [announcements] = await connection.query(
        'SELECT * FROM revision_announcements ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      const [count] = await connection.query('SELECT COUNT(*) as total FROM revision_announcements');
      
      return {
        announcements: announcements.map(a => ({
          ...a,
          docs_required: JSON.parse(a.docs_required || '[]')
        })),
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

module.exports = new RevisionService();

