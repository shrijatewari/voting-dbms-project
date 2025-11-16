/**
 * Migration: Update biometric_scores table for admin operations
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voting_system'
};

async function migrate() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('🔄 Updating biometric_scores table...');
    
    // Check if table exists, if not create it
    await connection.query(`
      CREATE TABLE IF NOT EXISTS biometric_scores (
        score_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        voter_id_1 BIGINT NOT NULL,
        voter_id_2 BIGINT NOT NULL,
        type ENUM('face', 'fingerprint', 'combined') DEFAULT 'combined',
        similarity_score DECIMAL(5,4) DEFAULT 0.0,
        face_match_score DECIMAL(5,4) NULL,
        fingerprint_match_score DECIMAL(5,4) NULL,
        combined_confidence DECIMAL(5,4) NULL,
        confidence ENUM('low', 'medium', 'high') DEFAULT 'medium',
        risk_level ENUM('low', 'medium', 'high') DEFAULT 'low',
        status ENUM('match', 'mismatch', 'pending') DEFAULT 'pending',
        ai_response JSON DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_voter1 (voter_id_1),
        INDEX idx_voter2 (voter_id_2),
        INDEX idx_type (type),
        INDEX idx_risk (risk_level),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Add missing columns if they don't exist
    try {
      await connection.query(`ALTER TABLE biometric_scores ADD COLUMN type ENUM('face', 'fingerprint', 'combined') DEFAULT 'combined'`);
    } catch (e) {
      // Column might already exist
    }
    
    try {
      await connection.query(`ALTER TABLE biometric_scores ADD COLUMN similarity_score DECIMAL(5,4) DEFAULT 0.0`);
    } catch (e) {}
    
    try {
      await connection.query(`ALTER TABLE biometric_scores ADD COLUMN confidence ENUM('low', 'medium', 'high') DEFAULT 'medium'`);
    } catch (e) {}
    
    try {
      await connection.query(`ALTER TABLE biometric_scores ADD COLUMN risk_level ENUM('low', 'medium', 'high') DEFAULT 'low'`);
    } catch (e) {}
    
    try {
      await connection.query(`ALTER TABLE biometric_scores ADD COLUMN status ENUM('match', 'mismatch', 'pending') DEFAULT 'pending'`);
    } catch (e) {}
    
    try {
      await connection.query(`ALTER TABLE biometric_scores ADD COLUMN ai_response JSON DEFAULT NULL`);
    } catch (e) {}
    
    console.log('✅ Biometric scores table updated successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = migrate;

