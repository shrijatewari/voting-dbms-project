const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voting_system'
};

async function migrateBiometricComplete() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🔄 Creating complete biometric storage system...\n');

    // Create biometrics table for storing face embeddings and fingerprint templates
    console.log('📊 Creating biometrics table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS biometrics (
        biometric_id INT PRIMARY KEY AUTO_INCREMENT,
        voter_id INT NOT NULL,
        face_hash VARCHAR(255) NOT NULL,
        fingerprint_hash VARCHAR(255) NOT NULL,
        face_embedding JSON DEFAULT NULL,
        fingerprint_template JSON DEFAULT NULL,
        face_embedding_encrypted TEXT DEFAULT NULL,
        fingerprint_template_encrypted TEXT DEFAULT NULL,
        is_face_verified BOOLEAN DEFAULT FALSE,
        is_fingerprint_verified BOOLEAN DEFAULT FALSE,
        liveness_check_passed BOOLEAN DEFAULT FALSE,
        liveness_check_type VARCHAR(50) DEFAULT NULL,
        quality_score DECIMAL(5, 2) DEFAULT NULL,
        verified_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
        UNIQUE KEY unique_voter_biometric (voter_id),
        INDEX idx_face_hash (face_hash),
        INDEX idx_fingerprint_hash (fingerprint_hash),
        INDEX idx_verified (is_face_verified, is_fingerprint_verified)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created biometrics table');

    // Create biometric_verification_logs table for audit
    console.log('📝 Creating biometric_verification_logs table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS biometric_verification_logs (
        log_id INT PRIMARY KEY AUTO_INCREMENT,
        voter_id INT NOT NULL,
        verification_type ENUM('face', 'fingerprint', 'both') NOT NULL,
        verification_result ENUM('success', 'failed', 'duplicate_detected') NOT NULL,
        match_score DECIMAL(5, 2) DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        device_fingerprint VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
        INDEX idx_voter (voter_id),
        INDEX idx_result (verification_result),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created biometric_verification_logs table');

    // Add biometric fields to voters table if not exists
    console.log('🔧 Adding biometric fields to voters table...');
    const biometricVoterFields = [
      { name: 'face_embedding_hash', type: 'VARCHAR(255) NULL DEFAULT NULL' },
      { name: 'fingerprint_hash', type: 'VARCHAR(255) NULL DEFAULT NULL' },
      { name: 'biometric_verified_at', type: 'TIMESTAMP NULL DEFAULT NULL' },
    ];

    for (const field of biometricVoterFields) {
      try {
        const [existing] = await connection.query(
          `SELECT COLUMN_NAME 
           FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = ? 
           AND TABLE_NAME = 'voters' 
           AND COLUMN_NAME = ?`,
          [dbConfig.database, field.name]
        );

        if (existing.length === 0) {
          await connection.query(
            `ALTER TABLE voters ADD COLUMN ${field.name} ${field.type}`
          );
          console.log(`✅ Added column: ${field.name}`);
        } else {
          console.log(`⏭️  Column already exists: ${field.name}`);
        }
      } catch (error) {
        console.error(`❌ Error adding ${field.name}:`, error.message);
      }
    }

    console.log('\n🎉 Biometric migration completed!');
    await connection.end();
  } catch (error) {
    console.error('❌ Migration error:', error);
    await connection.end();
    throw error;
  }
}

migrateBiometricComplete()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

