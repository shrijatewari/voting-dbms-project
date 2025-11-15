/**
 * AI Services Controller
 * Handles AI service requests and stores results in database
 */

const aiClient = require('../services/aiClient');
const pool = require('../config/database').pool;

class AIController {
  /**
   * Predict duplicate and store result
   */
  async predictDuplicate(req, res) {
    try {
      const { record1, record2 } = req.body;
      
      // Call AI service
      const result = await aiClient.predictDuplicate(record1, record2);
      
      // Store in database
      if (record1.voter_id && record2.voter_id) {
        const connection = await pool.getConnection();
        try {
          await connection.query(
            `INSERT INTO ai_scores 
             (voter_id_1, voter_id_2, type, score, confidence, features_json, algorithm_flags, recommendation)
             VALUES (?, ?, 'duplicate', ?, ?, ?, ?, ?)`,
            [
              record1.voter_id,
              record2.voter_id,
              result.duplicate_probability,
              result.confidence,
              JSON.stringify(result.features),
              JSON.stringify(result.algorithm_flags),
              result.recommendation
            ]
          );
        } finally {
          connection.release();
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error('Duplicate prediction error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Batch duplicate detection
   */
  async batchDetectDuplicates(req, res) {
    try {
      const { records, threshold } = req.body;
      const result = await aiClient.batchDetectDuplicates(records, threshold || 0.7);
      res.json(result);
    } catch (error) {
      console.error('Batch detection error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Normalize address
   */
  async normalizeAddress(req, res) {
    try {
      const { address } = req.body;
      const result = await aiClient.normalizeAddress(address);
      res.json(result);
    } catch (error) {
      console.error('Address normalization error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Detect address fraud
   */
  async detectAddressFraud(req, res) {
    try {
      const { address } = req.body;
      const result = await aiClient.detectAddressFraud(address);
      
      // Store cluster flag if suspicious
      if (result.is_fraud && result.cluster_id) {
        const connection = await pool.getConnection();
        try {
          await connection.query(
            `INSERT INTO address_cluster_flags 
             (cluster_id, address_hash, risk_score, is_suspicious)
             VALUES (?, ?, ?, TRUE)
             ON DUPLICATE KEY UPDATE risk_score = ?, is_suspicious = TRUE`,
            [
              result.cluster_id,
              result.cluster_id, // Using cluster_id as hash for now
              result.risk_score,
              result.risk_score
            ]
          );
        } finally {
          connection.release();
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error('Address fraud detection error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Match deceased records
   */
  async matchDeceased(req, res) {
    try {
      const { voter_record, death_record } = req.body;
      const result = await aiClient.matchDeceased(voter_record, death_record);
      
      // Store result
      if (voter_record.voter_id) {
        const connection = await pool.getConnection();
        try {
          await connection.query(
            `INSERT INTO ai_scores 
             (voter_id_1, type, score, confidence, features_json)
             VALUES (?, 'deceased', ?, ?, ?)`,
            [
              voter_record.voter_id,
              result.match_probability,
              result.confidence,
              JSON.stringify({ reasons: result.reasons })
            ]
          );
        } finally {
          connection.release();
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error('Deceased matching error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Verify document
   */
  async verifyDocument(req, res) {
    try {
      const { document_base64, document_type } = req.body;
      const result = await aiClient.verifyDocument(document_base64, document_type);
      
      // Store OCR result
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.query(
          `INSERT INTO ocr_results 
           (document_type, extracted_data_json, is_fake, confidence, validation_errors)
           VALUES (?, ?, ?, ?, ?)`,
          [
            document_type,
            JSON.stringify(result.ocr_data),
            result.is_fake,
            result.confidence,
            JSON.stringify(result.validation_errors || [])
          ]
        );
        result.ocr_id = rows.insertId;
      } finally {
        connection.release();
      }
      
      res.json(result);
    } catch (error) {
      console.error('Document verification error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Verify notice for forgery
   */
  async verifyNotice(req, res) {
    try {
      const { document_base64, original_hash } = req.body;
      const result = await aiClient.verifyNotice(document_base64, original_hash);
      res.json(result);
    } catch (error) {
      console.error('Forgery detection error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Match face embeddings
   */
  async matchFace(req, res) {
    try {
      const { embedding1, embedding2 } = req.body;
      const result = await aiClient.matchFace(embedding1, embedding2);
      res.json(result);
    } catch (error) {
      console.error('Face matching error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Match fingerprint templates
   */
  async matchFingerprint(req, res) {
    try {
      const { template1, template2 } = req.body;
      const result = await aiClient.matchFingerprint(template1, template2);
      res.json(result);
    } catch (error) {
      console.error('Fingerprint matching error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Health check for all AI services
   */
  async healthCheck(req, res) {
    try {
      const health = await aiClient.healthCheck();
      res.json(health);
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AIController();

