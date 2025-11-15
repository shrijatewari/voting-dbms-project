/**
 * Migration: AI Services Tables
 * Creates tables for storing AI scores and results
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'voting_dbms',
    multipleStatements: true
  });

  try {
    console.log('Creating AI services tables...');

    // AI Scores table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ai_scores (
        ai_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        voter_id_1 BIGINT NULL,
        voter_id_2 BIGINT NULL,
        type ENUM('duplicate', 'deceased', 'address', 'document', 'forgery', 'biometric') NOT NULL,
        score DECIMAL(5,4) NOT NULL,
        confidence DECIMAL(5,4) NOT NULL,
        features_json JSON,
        algorithm_flags JSON,
        recommendation VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_voter1 (voter_id_1),
        INDEX idx_voter2 (voter_id_2),
        INDEX idx_type (type),
        INDEX idx_score (score)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // OCR Results table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ocr_results (
        ocr_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        voter_id BIGINT NULL,
        document_type VARCHAR(50) NOT NULL,
        document_hash VARCHAR(64),
        extracted_data_json JSON,
        is_fake BOOLEAN DEFAULT FALSE,
        confidence DECIMAL(5,4),
        validation_errors JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_voter (voter_id),
        INDEX idx_type (document_type),
        INDEX idx_fake (is_fake)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Address Cluster Flags table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS address_cluster_flags (
        cluster_id VARCHAR(64) PRIMARY KEY,
        address_hash VARCHAR(64) NOT NULL,
        normalized_address JSON,
        voter_count INT DEFAULT 0,
        risk_score DECIMAL(5,4) NOT NULL,
        is_suspicious BOOLEAN DEFAULT FALSE,
        flagged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME NULL,
        reviewed_by BIGINT NULL,
        INDEX idx_risk (risk_score),
        INDEX idx_suspicious (is_suspicious)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Biometric Scores table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS biometric_scores (
        score_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        voter_id_1 BIGINT NOT NULL,
        voter_id_2 BIGINT NOT NULL,
        face_score DECIMAL(5,4) NULL,
        fingerprint_score DECIMAL(5,4) NULL,
        combined_confidence DECIMAL(5,4) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_voter1 (voter_id_1),
        INDEX idx_voter2 (voter_id_2),
        INDEX idx_combined (combined_confidence)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ AI services tables created successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = migrate;
