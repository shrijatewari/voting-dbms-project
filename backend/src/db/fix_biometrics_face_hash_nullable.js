/**
 * Fix biometrics table - make face_hash nullable
 * This allows registering fingerprint without face, or face without fingerprint
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

async function fixBiometricsFaceHash() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('🔧 Fixing biometrics table - making face_hash nullable...\n');

    // Check if biometrics table exists
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'biometrics'`
    );

    if (tables.length === 0) {
      console.log('⏭️  Biometrics table does not exist. Skipping fix.');
      return;
    }

    // Check if face_hash column exists
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'biometrics' AND COLUMN_NAME = 'face_hash'`,
      [dbConfig.database]
    );

    if (columns.length > 0) {
      const columnInfo = columns[0];
      if (columnInfo.IS_NULLABLE === 'NO') {
        console.log('🔧 Making face_hash nullable...');
        await connection.query(
          `ALTER TABLE biometrics MODIFY COLUMN face_hash VARCHAR(255) NULL DEFAULT NULL`
        );
        console.log('✅ face_hash is now nullable');
      } else {
        console.log('⏭️  face_hash is already nullable. No changes needed.');
      }
    } else {
      console.log('⏭️  face_hash column does not exist. No changes needed.');
    }

    // Also ensure fingerprint_hash is nullable
    const [fingerprintColumns] = await connection.query(
      `SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'biometrics' AND COLUMN_NAME = 'fingerprint_hash'`,
      [dbConfig.database]
    );

    if (fingerprintColumns.length > 0) {
      const columnInfo = fingerprintColumns[0];
      if (columnInfo.IS_NULLABLE === 'NO') {
        console.log('🔧 Making fingerprint_hash nullable...');
        await connection.query(
          `ALTER TABLE biometrics MODIFY COLUMN fingerprint_hash VARCHAR(255) NULL DEFAULT NULL`
        );
        console.log('✅ fingerprint_hash is now nullable');
      } else {
        console.log('⏭️  fingerprint_hash is already nullable. No changes needed.');
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
  fixBiometricsFaceHash()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = fixBiometricsFaceHash;

