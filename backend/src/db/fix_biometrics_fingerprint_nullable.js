const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voting_system'
};

async function fixBiometricsFingerprintNullable() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('🔧 Fixing biometrics table - making fingerprint_hash nullable...\n');

    // Check if biometrics table exists
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'biometrics'`,
      [dbConfig.database]
    );

    if (tables.length === 0) {
      console.log('⚠️  biometrics table does not exist. Creating it with nullable fingerprint_hash...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS biometrics (
          biometric_id INT PRIMARY KEY AUTO_INCREMENT,
          voter_id INT NOT NULL,
          face_hash VARCHAR(255) NOT NULL,
          fingerprint_hash VARCHAR(255) NULL DEFAULT NULL,
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
      console.log('✅ Created biometrics table with nullable fingerprint_hash');
    } else {
      // Check current column definition
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'biometrics' AND COLUMN_NAME = 'fingerprint_hash'`,
        [dbConfig.database]
      );

      if (columns.length > 0) {
        const col = columns[0];
        if (col.IS_NULLABLE === 'NO') {
          console.log('🔧 Making fingerprint_hash nullable...');
          await connection.query(
            `ALTER TABLE biometrics 
             MODIFY COLUMN fingerprint_hash VARCHAR(255) NULL DEFAULT NULL`
          );
          console.log('✅ fingerprint_hash is now nullable');
        } else {
          console.log('✅ fingerprint_hash is already nullable');
        }
      } else {
        console.log('⚠️  fingerprint_hash column does not exist. Adding it as nullable...');
        await connection.query(
          `ALTER TABLE biometrics 
           ADD COLUMN fingerprint_hash VARCHAR(255) NULL DEFAULT NULL`
        );
        console.log('✅ Added fingerprint_hash column as nullable');
      }

      // Also check and fix fingerprint_template if needed
      const [templateCols] = await connection.query(
        `SELECT COLUMN_NAME, IS_NULLABLE 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'biometrics' AND COLUMN_NAME = 'fingerprint_template'`,
        [dbConfig.database]
      );

      if (templateCols.length > 0 && templateCols[0].IS_NULLABLE === 'NO') {
        console.log('🔧 Making fingerprint_template nullable...');
        await connection.query(
          `ALTER TABLE biometrics 
           MODIFY COLUMN fingerprint_template JSON NULL DEFAULT NULL`
        );
        console.log('✅ fingerprint_template is now nullable');
      }

      // Also check and fix fingerprint_template_encrypted if needed
      const [encryptedCols] = await connection.query(
        `SELECT COLUMN_NAME, IS_NULLABLE 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'biometrics' AND COLUMN_NAME = 'fingerprint_template_encrypted'`,
        [dbConfig.database]
      );

      if (encryptedCols.length > 0 && encryptedCols[0].IS_NULLABLE === 'NO') {
        console.log('🔧 Making fingerprint_template_encrypted nullable...');
        await connection.query(
          `ALTER TABLE biometrics 
           MODIFY COLUMN fingerprint_template_encrypted TEXT NULL DEFAULT NULL`
        );
        console.log('✅ fingerprint_template_encrypted is now nullable');
      }
    }

    console.log('\n🎉 Biometrics table fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing biometrics table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  fixBiometricsFingerprintNullable()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = fixBiometricsFingerprintNullable;

