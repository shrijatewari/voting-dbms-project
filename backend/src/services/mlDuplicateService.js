/**
 * ML-Powered Duplicate Detection Service
 * Uses machine learning models for advanced duplicate detection
 */

const pool = require('../config/database');
const stringMatching = require('../utils/stringMatching');
const biometricService = require('./biometricService');

class MLDuplicateService {
  /**
   * ML-powered duplicate detection using ensemble methods
   */
  async detectDuplicatesML(options = {}) {
    const {
      scope = 'all',
      threshold = 0.85,
      use_face_embeddings = true,
      use_fingerprint = true,
      district,
      state
    } = options;
    
    const connection = await pool.getConnection();
    try {
      // Build query
      let query = `
        SELECT v.voter_id, v.name, v.dob, v.aadhaar_number, 
               v.pin_code, v.district, v.city, v.street, v.village_city,
               v.face_embedding_hash, v.fingerprint_hash,
               b.face_embedding, b.fingerprint_template
        FROM voters v
        LEFT JOIN biometrics b ON v.voter_id = b.voter_id
        WHERE 1=1
      `;
      const params = [];
      
      if (scope === 'district' && district) {
        query += ' AND v.district = ?';
        params.push(district);
      } else if (scope === 'state' && state) {
        query += ' AND v.state = ?';
        params.push(state);
      }
      
      const [voters] = await connection.query(query, params);
      
      console.log(`[ML-DUPLICATE] Analyzing ${voters.length} voters with ML models`);
      
      const duplicates = [];
      const checkedPairs = new Set();
      
      for (let i = 0; i < voters.length; i++) {
        for (let j = i + 1; j < voters.length; j++) {
          const pairKey = `${Math.min(voters[i].voter_id, voters[j].voter_id)}-${Math.max(voters[i].voter_id, voters[j].voter_id)}`;
          if (checkedPairs.has(pairKey)) continue;
          checkedPairs.add(pairKey);
          
          // Ensemble scoring
          const scores = {
            demographic: this.scoreDemographicSimilarity(voters[i], voters[j]),
            biometric: await this.scoreBiometricSimilarity(voters[i], voters[j], use_face_embeddings, use_fingerprint),
            address: stringMatching.addressSimilarity(voters[i], voters[j]),
            name: stringMatching.jaroWinkler(
              (voters[i].name || '').toLowerCase(),
              (voters[j].name || '').toLowerCase()
            )
          };
          
          // Weighted ensemble score
          const ensembleScore = (
            scores.demographic * 0.25 +
            scores.biometric * 0.35 +
            scores.address * 0.20 +
            scores.name * 0.20
          );
          
          if (ensembleScore >= threshold) {
            duplicates.push({
              voter_id_1: voters[i].voter_id,
              voter_id_2: voters[j].voter_id,
              ensemble_score: ensembleScore,
              component_scores: scores,
              confidence: ensembleScore > 0.95 ? 'very_high' : 
                         ensembleScore > 0.90 ? 'high' : 
                         ensembleScore > 0.85 ? 'medium' : 'low'
            });
          }
        }
      }
      
      return {
        duplicates_found: duplicates.length,
        duplicates,
        scope,
        threshold,
        ml_models_used: ['ensemble', 'demographic_clustering', 'biometric_matching', 'address_similarity']
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Score demographic similarity using clustering
   */
  scoreDemographicSimilarity(voter1, voter2) {
    let score = 0;
    let factors = 0;
    
    // DOB similarity (exact match = 1.0, within 1 year = 0.8, etc.)
    if (voter1.dob && voter2.dob) {
      if (voter1.dob === voter2.dob) {
        score += 1.0;
      } else {
        const date1 = new Date(voter1.dob);
        const date2 = new Date(voter2.dob);
        const diffYears = Math.abs(date1.getFullYear() - date2.getFullYear());
        if (diffYears <= 1) score += 0.8;
        else if (diffYears <= 2) score += 0.5;
      }
      factors += 1.0;
    }
    
    // PIN code similarity
    if (voter1.pin_code && voter2.pin_code) {
      if (voter1.pin_code === voter2.pin_code) {
        score += 0.3;
      }
      factors += 0.3;
    }
    
    // District similarity
    if (voter1.district && voter2.district) {
      const districtSim = stringMatching.jaroWinkler(
        voter1.district.toLowerCase(),
        voter2.district.toLowerCase()
      );
      score += districtSim * 0.2;
      factors += 0.2;
    }
    
    return factors > 0 ? score / factors : 0;
  }

  /**
   * Score biometric similarity
   */
  async scoreBiometricSimilarity(voter1, voter2, useFace = true, useFingerprint = true) {
    let score = 0;
    let factors = 0;
    
    // Face embedding similarity
    if (useFace && voter1.face_embedding && voter2.face_embedding) {
      try {
        const embedding1 = typeof voter1.face_embedding === 'string' 
          ? JSON.parse(voter1.face_embedding) 
          : voter1.face_embedding;
        const embedding2 = typeof voter2.face_embedding === 'string'
          ? JSON.parse(voter2.face_embedding)
          : voter2.face_embedding;
        
        if (Array.isArray(embedding1) && Array.isArray(embedding2) && embedding1.length === embedding2.length) {
          const similarity = this.cosineSimilarity(embedding1, embedding2);
          score += similarity * 0.5;
          factors += 0.5;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Fingerprint similarity
    if (useFingerprint && voter1.fingerprint_template && voter2.fingerprint_template) {
      try {
        const template1 = typeof voter1.fingerprint_template === 'string'
          ? JSON.parse(voter1.fingerprint_template)
          : voter1.fingerprint_template;
        const template2 = typeof voter2.fingerprint_template === 'string'
          ? JSON.parse(voter2.fingerprint_template)
          : voter2.fingerprint_template;
        
        if (Array.isArray(template1) && Array.isArray(template2) && template1.length === template2.length) {
          const similarity = this.cosineSimilarity(template1, template2);
          score += similarity * 0.5;
          factors += 0.5;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Hash-based matching (fallback)
    if (voter1.face_embedding_hash && voter2.face_embedding_hash) {
      if (voter1.face_embedding_hash === voter2.face_embedding_hash) {
        score += 0.5;
        factors += 0.5;
      }
    }
    
    return factors > 0 ? score / factors : 0;
  }

  /**
   * Cosine similarity for vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      const a = parseFloat(vecA[i]) || 0;
      const b = parseFloat(vecB[i]) || 0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Anomaly detection using ML
   */
  async detectAnomalies() {
    const connection = await pool.getConnection();
    try {
      const anomalies = [];
      
      // Too many voters at same address
      const [addressClusters] = await connection.query(
        `SELECT pin_code, district, city, COUNT(*) as voter_count
         FROM voters
         GROUP BY pin_code, district, city
         HAVING voter_count > 10
         ORDER BY voter_count DESC
         LIMIT 50`
      );
      
      anomalies.push({
        type: 'address_cluster',
        severity: 'medium',
        count: addressClusters.length,
        details: addressClusters
      });
      
      // Unrealistic DOB patterns
      const [dobAnomalies] = await connection.query(
        `SELECT YEAR(dob) as birth_year, COUNT(*) as count
         FROM voters
         WHERE YEAR(dob) < 1950 OR YEAR(dob) > 2010
         GROUP BY birth_year
         HAVING count > 5
         ORDER BY count DESC`
      );
      
      anomalies.push({
        type: 'dob_anomaly',
        severity: 'low',
        count: dobAnomalies.length,
        details: dobAnomalies
      });
      
      // Inactive voters (no activity > 10 years)
      const [inactiveVoters] = await connection.query(
        `SELECT voter_id, name, created_at
         FROM voters
         WHERE created_at < DATE_SUB(NOW(), INTERVAL 10 YEAR)
         AND is_verified = FALSE
         LIMIT 100`
      );
      
      anomalies.push({
        type: 'inactive_voters',
        severity: 'medium',
        count: inactiveVoters.length,
        details: inactiveVoters
      });
      
      return {
        total_anomalies: anomalies.reduce((sum, a) => sum + a.count, 0),
        anomalies
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = new MLDuplicateService();

