const crypto = require('crypto');
const pool = require('../config/database');

/**
 * Biometric Service
 * Handles facial recognition and fingerprint biometric data
 * 
 * Note: In production, this would integrate with actual biometric SDKs
 * For now, we'll use hash-based storage and matching
 */
class BiometricService {
  /**
   * Generate hash from facial features
   * In production, this would use face recognition algorithms (FaceNet, etc.)
   */
  generateFaceHash(faceData) {
    // faceData could be:
    // - Base64 encoded image
    // - Facial feature vector (128/512 dimensions)
    // - Face descriptor from face-api.js or similar
    
    // For now, we'll hash the input data
    // In production, use actual face recognition to extract features first
    const dataString = typeof faceData === 'string' ? faceData : JSON.stringify(faceData);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Generate hash from fingerprint data
   * In production, this would use fingerprint minutiae extraction
   */
  generateFingerprintHash(fingerprintData) {
    // fingerprintData could be:
    // - Base64 encoded fingerprint image
    // - Minutiae points array
    // - Fingerprint template
    
    const dataString = typeof fingerprintData === 'string' ? fingerprintData : JSON.stringify(fingerprintData);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Combine facial and fingerprint hashes into a single biometric hash
   * Stores as: faceHash(64) + fingerprintHash(64) = 128 chars total
   * This allows us to check for duplicate faces or fingerprints separately
   */
  combineBiometricHash(faceHash, fingerprintHash) {
    // Concatenate directly (not hash again) so we can extract face/fingerprint separately
    // Each SHA256 hash is 64 hex characters
    return faceHash + fingerprintHash; // Total: 128 characters
  }

  /**
   * Get or create encryption key (must be consistent)
   * AES-256 requires a 32-byte (256-bit) key
   */
  getEncryptionKey() {
    // Use a fixed key from env, or generate a consistent one
    if (process.env.ENCRYPTION_KEY) {
      // Convert hex string to buffer (64 hex chars = 32 bytes)
      const keyHex = process.env.ENCRYPTION_KEY.replace(/[^0-9a-fA-F]/g, '').slice(0, 64);
      if (keyHex.length >= 64) {
        return Buffer.from(keyHex, 'hex');
      }
      // If key is too short, pad it or use scrypt to derive 32 bytes
      return crypto.scryptSync(process.env.ENCRYPTION_KEY, 'biometric-salt', 32);
    }
    // Fallback: use a fixed key (in production, this MUST be set in .env)
    // This is a demo key - MUST be changed in production
    const defaultKey = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
    return Buffer.from(defaultKey.slice(0, 64), 'hex');
  }

  /**
   * Encrypt data with AES-256-CBC
   */
  encryptData(data) {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Check for similar face embeddings (cosine similarity)
   */
  async checkSimilarFace(connection, faceEmbedding, voterId) {
    const [allBiometrics] = await connection.query(
      'SELECT b.face_embedding, v.voter_id, v.name, v.aadhaar_number FROM biometrics b JOIN voters v ON b.voter_id = v.voter_id WHERE b.face_embedding IS NOT NULL AND b.voter_id != ?',
      [voterId]
    );

    for (const bio of allBiometrics) {
      try {
        const storedEmbedding = JSON.parse(bio.face_embedding || '[]');
        if (storedEmbedding.length === faceEmbedding.length) {
          const similarity = this.cosineSimilarity(faceEmbedding, storedEmbedding);
          // Threshold: 0.6 (60% similarity) - very strict
          if (similarity >= 0.6) {
            throw new Error(`DUPLICATE FACE DETECTED! Similarity: ${(similarity * 100).toFixed(2)}%. This face is too similar to Voter ID: ${bio.voter_id}, Name: ${bio.name}, Aadhaar: ${bio.aadhaar_number}`);
          }
        }
      } catch (err) {
        if (err.message.includes('DUPLICATE FACE')) throw err;
        // Continue if parsing fails
      }
    }
  }

  /**
   * Check for similar fingerprint templates
   */
  async checkSimilarFingerprint(connection, fingerprintTemplate, voterId) {
    const [allBiometrics] = await connection.query(
      'SELECT b.fingerprint_template, v.voter_id, v.name, v.aadhaar_number FROM biometrics b JOIN voters v ON b.voter_id = v.voter_id WHERE b.fingerprint_template IS NOT NULL AND b.voter_id != ?',
      [voterId]
    );

    for (const bio of allBiometrics) {
      try {
        const storedTemplate = JSON.parse(bio.fingerprint_template || '[]');
        if (storedTemplate.length === fingerprintTemplate.length) {
          const similarity = this.cosineSimilarity(fingerprintTemplate, storedTemplate);
          // Threshold: 0.7 (70% similarity) - very strict for fingerprints
          if (similarity >= 0.7) {
            throw new Error(`DUPLICATE FINGERPRINT DETECTED! Similarity: ${(similarity * 100).toFixed(2)}%. This fingerprint is too similar to Voter ID: ${bio.voter_id}, Name: ${bio.name}, Aadhaar: ${bio.aadhaar_number}`);
          }
        }
      } catch (err) {
        if (err.message.includes('DUPLICATE FINGERPRINT')) throw err;
        // Continue if parsing fails
      }
    }
  }

  /**
   * Register face biometric with embedding
   */
  async registerFace(voterId, faceEmbedding, faceHash, livenessPassed = false) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      console.log(`[BIOMETRIC] Registering face for voter ${voterId}, hash: ${faceHash.substring(0, 16)}...`);

      // Check for exact hash match
      const [existing] = await connection.query(
        'SELECT b.*, v.name, v.aadhaar_number FROM biometrics b JOIN voters v ON b.voter_id = v.voter_id WHERE b.face_hash = ? AND b.voter_id != ?',
        [faceHash, voterId]
      );

      if (existing.length > 0) {
        throw new Error(`DUPLICATE FACE DETECTED! Exact hash match. This face already belongs to Voter ID: ${existing[0].voter_id}, Name: ${existing[0].name}, Aadhaar: ${existing[0].aadhaar_number}`);
      }

      // Check for similar embeddings (cosine similarity)
      await this.checkSimilarFace(connection, faceEmbedding, voterId);

      // Encrypt embedding
      const encryptedData = this.encryptData(faceEmbedding);

      // Insert or update biometric record
      await connection.query(
        `INSERT INTO biometrics (voter_id, face_hash, face_embedding, face_embedding_encrypted, is_face_verified, liveness_check_passed, verified_at)
         VALUES (?, ?, ?, ?, TRUE, ?, NOW())
         ON DUPLICATE KEY UPDATE
         face_hash = VALUES(face_hash),
         face_embedding = VALUES(face_embedding),
         face_embedding_encrypted = VALUES(face_embedding_encrypted),
         is_face_verified = TRUE,
         liveness_check_passed = VALUES(liveness_check_passed),
         verified_at = NOW()`,
        [voterId, faceHash, JSON.stringify(faceEmbedding), encryptedData, livenessPassed]
      );

      // Update voter table
      await connection.query(
        'UPDATE voters SET face_embedding_hash = ?, biometric_verified_at = NOW() WHERE voter_id = ?',
        [faceHash, voterId]
      );

      await connection.commit();
      return { success: true, face_hash: faceHash, message: 'Face biometric registered successfully' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Register fingerprint biometric with template
   */
  async registerFingerprint(voterId, fingerprintTemplate, fingerprintHash) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      console.log(`[BIOMETRIC] Registering fingerprint for voter ${voterId}, hash: ${fingerprintHash.substring(0, 16)}...`);

      // Check for exact hash match
      const [existing] = await connection.query(
        'SELECT b.*, v.name, v.aadhaar_number FROM biometrics b JOIN voters v ON b.voter_id = v.voter_id WHERE b.fingerprint_hash = ? AND b.voter_id != ?',
        [fingerprintHash, voterId]
      );

      if (existing.length > 0) {
        throw new Error(`DUPLICATE FINGERPRINT DETECTED! Exact hash match. This fingerprint already belongs to Voter ID: ${existing[0].voter_id}, Name: ${existing[0].name}, Aadhaar: ${existing[0].aadhaar_number}`);
      }

      // Check for similar templates (cosine similarity)
      await this.checkSimilarFingerprint(connection, fingerprintTemplate, voterId);

      // Encrypt template
      const encryptedData = this.encryptData(fingerprintTemplate);

      // Insert or update biometric record
      await connection.query(
        `INSERT INTO biometrics (voter_id, fingerprint_hash, fingerprint_template, fingerprint_template_encrypted, is_fingerprint_verified, verified_at)
         VALUES (?, ?, ?, ?, TRUE, NOW())
         ON DUPLICATE KEY UPDATE
         fingerprint_hash = VALUES(fingerprint_hash),
         fingerprint_template = VALUES(fingerprint_template),
         fingerprint_template_encrypted = VALUES(fingerprint_template_encrypted),
         is_fingerprint_verified = TRUE,
         verified_at = NOW()`,
        [voterId, fingerprintHash, JSON.stringify(fingerprintTemplate), encryptedData]
      );

      // Update voter table
      await connection.query(
        'UPDATE voters SET fingerprint_hash = ?, biometric_verified_at = NOW() WHERE voter_id = ?',
        [fingerprintHash, voterId]
      );

      await connection.commit();
      return { success: true, fingerprint_hash: fingerprintHash, message: 'Fingerprint biometric registered successfully' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Register biometric data for a voter (combined - for backward compatibility)
   * Checks for duplicates before registering
   */
  async registerBiometric(voterId, faceData, fingerprintData) {
    const connection = await pool.getConnection();
    try {
      const faceHash = this.generateFaceHash(faceData);
      const fingerprintHash = this.generateFingerprintHash(fingerprintData);
      const biometricHash = this.combineBiometricHash(faceHash, fingerprintHash);

      // Check for duplicate face or fingerprint - compare against all existing voters
      const [allVoters] = await connection.query(
        'SELECT voter_id, name, aadhaar_number, biometric_hash FROM voters WHERE voter_id != ? AND biometric_hash IS NOT NULL',
        [voterId]
      );

      for (const voter of allVoters) {
        if (voter.biometric_hash && voter.biometric_hash.length >= 128) {
          // Extract face and fingerprint parts from stored hash
          // The combined hash is: faceHash(64) + fingerprintHash(64) = 128 chars total
          const storedFaceHash = voter.biometric_hash.substring(0, 64);
          const storedFingerprintHash = voter.biometric_hash.substring(64, 128);
          
          // Compare face hashes (exact match)
          if (faceHash === storedFaceHash) {
            throw new Error(`DUPLICATE FACE DETECTED! This face already belongs to Voter ID: ${voter.voter_id}, Name: ${voter.name}, Aadhaar: ${voter.aadhaar_number}. Each person must have unique facial features.`);
          }
          
          // Compare fingerprint hashes (exact match)
          if (fingerprintHash === storedFingerprintHash) {
            throw new Error(`DUPLICATE FINGERPRINT DETECTED! This fingerprint already belongs to Voter ID: ${voter.voter_id}, Name: ${voter.name}, Aadhaar: ${voter.aadhaar_number}. Each person must have unique fingerprints.`);
          }
        } else if (voter.biometric_hash) {
          // For older hashes that might be in different format, do a simple comparison
          if (biometricHash === voter.biometric_hash) {
            throw new Error(`DUPLICATE BIOMETRIC DATA! This combination already belongs to Voter ID: ${voter.voter_id}, Name: ${voter.name}, Aadhaar: ${voter.aadhaar_number}.`);
          }
        }
      }

      // Update voter with combined biometric hash
      await connection.query(
        'UPDATE voters SET biometric_hash = ? WHERE voter_id = ?',
        [biometricHash, voterId]
      );
      
      return {
        success: true,
        biometric_hash: biometricHash,
        face_hash: faceHash,
        fingerprint_hash: fingerprintHash,
        message: 'Biometric data registered successfully - no duplicates found'
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Verify biometric against stored data
   * Returns similarity score (0-100)
   */
  async verifyBiometric(voterId, faceData, fingerprintData) {
    const connection = await pool.getConnection();
    try {
      // Get stored voter data
      const [voters] = await connection.query(
        'SELECT biometric_hash FROM voters WHERE voter_id = ?',
        [voterId]
      );

      if (voters.length === 0) {
        return { verified: false, message: 'Voter not found', similarity: 0 };
      }

      const storedHash = voters[0].biometric_hash;

      // Generate hashes from input
      const faceHash = this.generateFaceHash(faceData);
      const fingerprintHash = this.generateFingerprintHash(fingerprintData);
      const inputHash = this.combineBiometricHash(faceHash, fingerprintHash);

      // Exact match (in production, use similarity matching)
      if (inputHash === storedHash) {
        return { verified: true, similarity: 100, message: 'Biometric verified' };
      }

      // In production, implement similarity matching:
      // - For faces: Compare feature vectors using cosine similarity
      // - For fingerprints: Compare minutiae points
      // - Return similarity score (0-100)

      return { verified: false, similarity: 0, message: 'Biometric mismatch' };
    } finally {
      connection.release();
    }
  }

  /**
   * Match biometric against all voters (for duplicate detection)
   * Returns list of potential matches with similarity scores
   */
  async findBiometricMatches(faceData, fingerprintData, threshold = 80) {
    const connection = await pool.getConnection();
    try {
      const faceHash = this.generateFaceHash(faceData);
      const fingerprintHash = this.generateFingerprintHash(fingerprintData);
      const inputHash = this.combineBiometricHash(faceHash, fingerprintHash);

      // Get all voters
      const [voters] = await connection.query(
        'SELECT voter_id, name, aadhaar_number, biometric_hash FROM voters'
      );

      const matches = [];

      for (const voter of voters) {
        // In production, use actual similarity matching
        // For now, we'll do exact hash comparison
        if (voter.biometric_hash === inputHash) {
          matches.push({
            voter_id: voter.voter_id,
            name: voter.name,
            aadhaar_number: voter.aadhaar_number,
            similarity: 100
          });
        }
      }

      return {
        matches: matches.filter(m => m.similarity >= threshold),
        total_checked: voters.length
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Extract facial features from image (placeholder for production SDK)
   * In production, use: face-api.js, OpenCV, or cloud services (AWS Rekognition, Azure Face API)
   */
  async extractFaceFeatures(imageBase64) {
    // Placeholder - in production:
    // 1. Load image
    // 2. Detect face
    // 3. Extract 128/512-dimensional feature vector
    // 4. Return feature vector
    
    return {
      features: 'placeholder_features',
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      landmarks: []
    };
  }

  /**
   * Verify face against stored embedding using cosine similarity
   */
  async verifyFace(voterId, faceEmbedding) {
    const connection = await pool.getConnection();
    try {
      const [biometrics] = await connection.query(
        'SELECT face_embedding, face_embedding_encrypted FROM biometrics WHERE voter_id = ? AND is_face_verified = TRUE',
        [voterId]
      );

      if (biometrics.length === 0) {
        return { verified: false, message: 'Face biometric not registered', similarity: 0 };
      }

      // Decrypt stored embedding
      const storedEmbedding = JSON.parse(biometrics[0].face_embedding || '[]');
      
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(faceEmbedding, storedEmbedding);
      const threshold = 0.6; // Standard threshold for face recognition
      const verified = similarity >= threshold;

      // Log verification attempt
      await connection.query(
        `INSERT INTO biometric_verification_logs (voter_id, verification_type, verification_result, match_score)
         VALUES (?, 'face', ?, ?)`,
        [voterId, verified ? 'success' : 'failed', similarity * 100]
      );

      return {
        verified,
        similarity: similarity * 100,
        message: verified ? 'Face verified successfully' : 'Face verification failed'
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Verify fingerprint against stored template
   */
  async verifyFingerprint(voterId, fingerprintTemplate) {
    const connection = await pool.getConnection();
    try {
      const [biometrics] = await connection.query(
        'SELECT fingerprint_template FROM biometrics WHERE voter_id = ? AND is_fingerprint_verified = TRUE',
        [voterId]
      );

      if (biometrics.length === 0) {
        return { verified: false, message: 'Fingerprint biometric not registered', similarity: 0 };
      }

      const storedTemplate = JSON.parse(biometrics[0].fingerprint_template || '[]');
      
      // Calculate similarity (simplified - in production use minutiae matching)
      const similarity = this.cosineSimilarity(fingerprintTemplate, storedTemplate);
      const threshold = 0.7; // Higher threshold for fingerprints
      const verified = similarity >= threshold;

      // Log verification attempt
      await connection.query(
        `INSERT INTO biometric_verification_logs (voter_id, verification_type, verification_result, match_score)
         VALUES (?, 'fingerprint', ?, ?)`,
        [voterId, verified ? 'success' : 'failed', similarity * 100]
      );

      return {
        verified,
        similarity: similarity * 100,
        message: verified ? 'Fingerprint verified successfully' : 'Fingerprint verification failed'
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || !Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length || vecA.length === 0) {
      return 0;
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      const a = typeof vecA[i] === 'number' ? vecA[i] : parseFloat(vecA[i]) || 0;
      const b = typeof vecB[i] === 'number' ? vecB[i] : parseFloat(vecB[i]) || 0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;
    
    return dotProduct / denominator;
  }

  /**
   * Extract fingerprint minutiae (placeholder for production SDK)
   * In production, use: Neurotechnology, Innovatrics, or cloud services
   */
  async extractFingerprintMinutiae(fingerprintBase64) {
    // Placeholder - in production:
    // 1. Load fingerprint image
    // 2. Enhance image
    // 3. Extract minutiae points (ridge endings, bifurcations)
    // 4. Return minutiae template
    
    // For now, generate a mock template from the image hash
    const hash = this.generateFingerprintHash(fingerprintBase64);
    // Convert hash to a numeric array (simplified template)
    const template = [];
    for (let i = 0; i < 128; i += 2) {
      template.push(parseInt(hash.substr(i, 2), 16) / 255);
    }
    
    return {
      template,
      quality: 0.85,
      minutiae_count: template.length
    };
  }
}

module.exports = new BiometricService();

