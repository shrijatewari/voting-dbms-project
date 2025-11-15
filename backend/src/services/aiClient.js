/**
 * AI Services Client
 * HTTP client for calling AI microservices
 */

const axios = require('axios');

// AI Service URLs (in production, use environment variables)
const AI_SERVICES = {
  duplicate: process.env.AI_DUPLICATE_SERVICE_URL || 'http://localhost:8001',
  address: process.env.AI_ADDRESS_SERVICE_URL || 'http://localhost:8002',
  deceased: process.env.AI_DECEASED_SERVICE_URL || 'http://localhost:8003',
  document: process.env.AI_DOCUMENT_SERVICE_URL || 'http://localhost:8004',
  forgery: process.env.AI_FORGERY_SERVICE_URL || 'http://localhost:8005',
  biometric: process.env.AI_BIOMETRIC_SERVICE_URL || 'http://localhost:8006',
};

class AIClient {
  /**
   * Predict if two records are duplicates
   */
  async predictDuplicate(record1, record2) {
    try {
      const response = await axios.post(
        `${AI_SERVICES.duplicate}/predict-duplicate`,
        { record1, record2 },
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error('Duplicate prediction error:', error.message);
      throw new Error(`Duplicate detection failed: ${error.message}`);
    }
  }

  /**
   * Run batch duplicate detection
   */
  async batchDetectDuplicates(records, threshold = 0.7) {
    try {
      const response = await axios.post(
        `${AI_SERVICES.duplicate}/batch-run`,
        { records, threshold },
        { timeout: 30000 }
      );
      return response.data;
    } catch (error) {
      console.error('Batch duplicate detection error:', error.message);
      throw new Error(`Batch detection failed: ${error.message}`);
    }
  }

  /**
   * Normalize address
   */
  async normalizeAddress(address) {
    try {
      const response = await axios.post(
        `${AI_SERVICES.address}/normalize`,
        { address },
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      console.error('Address normalization error:', error.message);
      throw new Error(`Address normalization failed: ${error.message}`);
    }
  }

  /**
   * Detect fraudulent addresses
   */
  async detectAddressFraud(address) {
    try {
      const response = await axios.post(
        `${AI_SERVICES.address}/fraud-detect`,
        { address },
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      console.error('Address fraud detection error:', error.message);
      throw new Error(`Fraud detection failed: ${error.message}`);
    }
  }

  /**
   * Analyze address clusters
   */
  async analyzeAddressClusters(addresses) {
    try {
      const response = await axios.post(
        `${AI_SERVICES.address}/cluster-analysis`,
        addresses,
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error('Cluster analysis error:', error.message);
      throw new Error(`Cluster analysis failed: ${error.message}`);
    }
  }

  /**
   * Match deceased records
   */
  async matchDeceased(voterRecord, deathRecord) {
    try {
      const response = await axios.post(
        `${AI_SERVICES.deceased}/match-deceased`,
        { voter_record: voterRecord, death_record: deathRecord },
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      console.error('Deceased matching error:', error.message);
      throw new Error(`Deceased matching failed: ${error.message}`);
    }
  }

  /**
   * Verify document (OCR + fake detection)
   */
  async verifyDocument(documentBase64, documentType) {
    try {
      const response = await axios.post(
        `${AI_SERVICES.document}/verify-document`,
        { document_base64: documentBase64, document_type: documentType },
        { timeout: 15000 }
      );
      return response.data;
    } catch (error) {
      console.error('Document verification error:', error.message);
      throw new Error(`Document verification failed: ${error.message}`);
    }
  }

  /**
   * Verify notice/communication for forgery
   */
  async verifyNotice(documentBase64, originalHash) {
    try {
      const response = await axios.post(
        `${AI_SERVICES.forgery}/verify-notice`,
        { document_base64: documentBase64, original_hash: originalHash },
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error('Forgery detection error:', error.message);
      throw new Error(`Forgery detection failed: ${error.message}`);
    }
  }

  /**
   * Match face embeddings
   */
  async matchFace(embedding1, embedding2) {
    try {
      const response = await axios.post(
        `${AI_SERVICES.biometric}/match-face`,
        { embedding1, embedding2 },
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      console.error('Face matching error:', error.message);
      throw new Error(`Face matching failed: ${error.message}`);
    }
  }

  /**
   * Match fingerprint templates
   */
  async matchFingerprint(template1, template2) {
    try {
      const response = await axios.post(
        `${AI_SERVICES.biometric}/match-fingerprint`,
        { template1, template2 },
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      console.error('Fingerprint matching error:', error.message);
      throw new Error(`Fingerprint matching failed: ${error.message}`);
    }
  }

  /**
   * Health check for all AI services
   */
  async healthCheck() {
    const health = {};
    for (const [service, url] of Object.entries(AI_SERVICES)) {
      try {
        const response = await axios.get(`${url}/health`, { timeout: 2000 });
        health[service] = { status: 'ok', ...response.data };
      } catch (error) {
        health[service] = { status: 'error', error: error.message };
      }
    }
    return health;
  }
}

module.exports = new AIClient();


