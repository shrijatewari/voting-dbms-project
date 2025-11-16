/**
 * Database Migration: Biometric Optimizations
 * Adds quality_score, indexes, and caching tables for production-grade biometric system
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

async function migrateBiometricOptimizations() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('🔧 Applying biometric optimizations...\n');

    // 1. Add quality_score column to biometrics table if not exists
    console.log('1. Adding quality_score column...');
    try {
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'biometrics' AND COLUMN_NAME = 'quality_score'`,
        [dbConfig.database]
      );
      
      if (columns.length === 0) {
        await connection.query(
          `ALTER TABLE biometrics 
           ADD COLUMN quality_score DECIMAL(5, 2) DEFAULT 0.8 
           COMMENT 'Face/fingerprint quality score (0-1) for adaptive threshold matching'`
        );
        console.log('✅ Added quality_score column');
      } else {
        console.log('⏭️  quality_score column already exists');
      }
    } catch (error) {
      console.error('❌ Error adding quality_score:', error.message);
    }

    // 2. Add indexes for faster similarity searches
    console.log('\n2. Adding indexes for performance...');
    const indexes = [
      { name: 'idx_face_hash', sql: 'CREATE INDEX IF NOT EXISTS idx_face_hash ON biometrics(face_hash)' },
      { name: 'idx_fingerprint_hash', sql: 'CREATE INDEX IF NOT EXISTS idx_fingerprint_hash ON biometrics(fingerprint_hash)' },
      { name: 'idx_quality_score', sql: 'CREATE INDEX IF NOT EXISTS idx_quality_score ON biometrics(quality_score)' },
      { name: 'idx_voter_biometric', sql: 'CREATE INDEX IF NOT EXISTS idx_voter_biometric ON biometrics(voter_id, is_face_verified, is_fingerprint_verified)' }
    ];

    for (const idx of indexes) {
      try {
        await connection.query(idx.sql.replace('IF NOT EXISTS', ''));
        console.log(`✅ Index ${idx.name} created`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⏭️  Index ${idx.name} already exists`);
        } else {
          console.error(`❌ Error creating ${idx.name}:`, error.message);
        }
      }
    }

    // 3. Create biometric_similarity_cache table for caching comparison results
    console.log('\n3. Creating similarity cache table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS biometric_similarity_cache (
        cache_id INT PRIMARY KEY AUTO_INCREMENT,
        voter_id_1 INT NOT NULL,
        voter_id_2 INT NOT NULL,
        comparison_type ENUM('face', 'fingerprint', 'both') NOT NULL,
        similarity_score DECIMAL(5, 4) NOT NULL,
        confidence DECIMAL(5, 4) NOT NULL,
        quality_score_1 DECIMAL(5, 2) DEFAULT NULL,
        quality_score_2 DECIMAL(5, 2) DEFAULT NULL,
        cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_voters (voter_id_1, voter_id_2),
        INDEX idx_type (comparison_type),
        INDEX idx_similarity (similarity_score),
        INDEX idx_expires (expires_at),
        UNIQUE KEY unique_comparison (voter_id_1, voter_id_2, comparison_type),
        FOREIGN KEY (voter_id_1) REFERENCES voters(voter_id) ON DELETE CASCADE,
        FOREIGN KEY (voter_id_2) REFERENCES voters(voter_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created biometric_similarity_cache table');

    // 4. Create biometric_embeddings_index table for ANN (Approximate Nearest Neighbors)
    console.log('\n4. Creating embeddings index table for fast similarity search...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS biometric_embeddings_index (
        index_id INT PRIMARY KEY AUTO_INCREMENT,
        voter_id INT NOT NULL,
        embedding_type ENUM('face', 'fingerprint') NOT NULL,
        embedding_hash VARCHAR(64) NOT NULL,
        embedding_vector JSON NOT NULL COMMENT 'Normalized embedding vector for fast comparison',
        quality_score DECIMAL(5, 2) DEFAULT 0.8,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_hash (embedding_hash),
        INDEX idx_type (embedding_type),
        INDEX idx_voter (voter_id),
        UNIQUE KEY unique_voter_type (voter_id, embedding_type),
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created biometric_embeddings_index table');

    // 5. Update existing biometrics with default quality scores
    console.log('\n5. Updating existing biometrics with quality scores...');
    await connection.query(
      `UPDATE biometrics 
       SET quality_score = 0.8 
       WHERE quality_score IS NULL OR quality_score = 0`
    );
    const [updateResult] = await connection.query(
      `SELECT ROW_COUNT() as updated FROM biometrics WHERE quality_score = 0.8`
    );
    console.log(`✅ Updated ${updateResult[0]?.updated || 0} biometric records`);

    console.log('\n🎉 Biometric optimizations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  migrateBiometricOptimizations()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = migrateBiometricOptimizations;

