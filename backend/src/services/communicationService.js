/**
 * Communication Service
 * Handles official notices, manifestos, rumor clarifications with digital signatures
 */

const crypto = require('crypto');
const pool = require('../config/database');

class CommunicationService {
  /**
   * Create official communication/notice
   */
  async createCommunication(communicationData) {
    const connection = await pool.getConnection();
    try {
      const { title, body, type, attachments, published_by } = communicationData;
      
      // Generate digital signature
      const signature = this.signContent(title + body);
      
      const [result] = await connection.query(
        `INSERT INTO communications 
         (title, body, type, attachments, signature, signature_valid, published_by, is_verified)
         VALUES (?, ?, ?, ?, ?, TRUE, ?, TRUE)`,
        [
          title,
          body,
          type,
          JSON.stringify(attachments || []),
          signature,
          published_by
        ]
      );
      
      // Log audit event
      const auditService = require('./auditLogService');
      await auditService.logAction({
        action_type: 'communication_published',
        entity_type: 'communication',
        entity_id: result.insertId,
        actor_id: published_by,
        metadata: JSON.stringify({ type, title })
      });
      
      return await this.getCommunicationById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Sign content with server private key
   */
  signContent(content) {
    const privateKey = process.env.SIGNING_KEY || 'default_signing_key_change_in_production';
    return crypto.createHmac('sha256', privateKey)
      .update(content)
      .digest('hex');
  }

  /**
   * Verify communication signature
   */
  verifySignature(communication) {
    const expectedSignature = this.signContent(communication.title + communication.body);
    return {
      valid: communication.signature === expectedSignature,
      communication_id: communication.communication_id,
      verified_at: new Date().toISOString()
    };
  }

  /**
   * Get communication by ID
   */
  async getCommunicationById(communicationId) {
    const connection = await pool.getConnection();
    try {
      const [communications] = await connection.query(
        'SELECT * FROM communications WHERE communication_id = ?',
        [communicationId]
      );
      
      if (communications[0]) {
        communications[0].attachments = JSON.parse(communications[0].attachments || '[]');
      }
      
      return communications[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get communications by type
   */
  async getCommunicationsByType(type, page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      const [communications] = await connection.query(
        'SELECT * FROM communications WHERE type = ? AND is_verified = TRUE ORDER BY published_at DESC LIMIT ? OFFSET ?',
        [type, limit, offset]
      );
      
      const [count] = await connection.query(
        'SELECT COUNT(*) as total FROM communications WHERE type = ? AND is_verified = TRUE',
        [type]
      );
      
      return {
        communications: communications.map(c => ({
          ...c,
          attachments: JSON.parse(c.attachments || '[]')
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

  /**
   * Flag rumor for fact-checking
   */
  async flagRumor(rumorData) {
    const connection = await pool.getConnection();
    try {
      const { url, description, reported_by } = rumorData;
      
      const [result] = await connection.query(
        `INSERT INTO rumor_flags (url, description, reported_by, status)
         VALUES (?, ?, ?, 'pending')`,
        [url, description, reported_by]
      );
      
      // Auto-check against known false information (mock)
      const isKnownFalse = await this.checkAgainstKnownFalseInfo(url);
      if (isKnownFalse) {
        await connection.query(
          'UPDATE rumor_flags SET status = ?, reviewed_at = NOW() WHERE flag_id = ?',
          ['verified-false', result.insertId]
        );
      }
      
      return await this.getRumorFlagById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Check against known false information (mock - in production use fact-checking API)
   */
  async checkAgainstKnownFalseInfo(url) {
    // Mock implementation - in production, integrate with fact-checking services
    const knownFalsePatterns = [
      'fake-election-news',
      'misinformation',
      'disinformation'
    ];
    
    return knownFalsePatterns.some(pattern => url.toLowerCase().includes(pattern));
  }

  /**
   * Get rumor flag by ID
   */
  async getRumorFlagById(flagId) {
    const connection = await pool.getConnection();
    try {
      const [flags] = await connection.query(
        'SELECT * FROM rumor_flags WHERE flag_id = ?',
        [flagId]
      );
      return flags[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Review rumor flag (admin)
   */
  async reviewRumorFlag(flagId, reviewData) {
    const connection = await pool.getConnection();
    try {
      const { status, response, reviewed_by } = reviewData;
      
      await connection.query(
        `UPDATE rumor_flags 
         SET status = ?, response = ?, reviewed_by = ?, reviewed_at = NOW()
         WHERE flag_id = ?`,
        [status, response, reviewed_by, flagId]
      );
      
      return await this.getRumorFlagById(flagId);
    } finally {
      connection.release();
    }
  }

  /**
   * Get rumor flags by status
   */
  async getRumorFlagsByStatus(status, page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      const [flags] = await connection.query(
        'SELECT * FROM rumor_flags WHERE status = ? ORDER BY reported_at DESC LIMIT ? OFFSET ?',
        [status, limit, offset]
      );
      
      const [count] = await connection.query(
        'SELECT COUNT(*) as total FROM rumor_flags WHERE status = ?',
        [status]
      );
      
      return {
        flags,
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

module.exports = new CommunicationService();

