const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voting_system'
};

async function migrateProfileExtended() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🔄 Extending voter profile with government-grade fields...\n');

    // Add personal details fields
    const personalFields = [
      { name: 'marital_status', type: 'ENUM("Single", "Married", "Divorced", "Widowed") DEFAULT NULL' },
      { name: 'spouse_name', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'profile_photo_url', type: 'TEXT DEFAULT NULL' },
    ];

    // Add identification fields
    const identificationFields = [
      { name: 'pan_number', type: 'VARCHAR(10) DEFAULT NULL' },
      { name: 'ration_card_number', type: 'VARCHAR(50) DEFAULT NULL' },
      { name: 'driving_license_number', type: 'VARCHAR(50) DEFAULT NULL' },
      { name: 'passport_number', type: 'VARCHAR(50) DEFAULT NULL' },
    ];

    // Add demographic fields
    const demographicFields = [
      { name: 'education_level', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'occupation', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'disability_status', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'disability_certificate_url', type: 'TEXT DEFAULT NULL' },
      { name: 'income_range', type: 'VARCHAR(50) DEFAULT NULL' },
      { name: 'special_category', type: 'VARCHAR(100) DEFAULT NULL' },
    ];

    // Add contact verification fields
    const contactFields = [
      { name: 'mobile_verified', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'email_verified', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'alternate_mobile', type: 'VARCHAR(10) DEFAULT NULL' },
      { name: 'device_fingerprint', type: 'VARCHAR(255) DEFAULT NULL' },
    ];

    // Add profile completion fields
    const completionFields = [
      { name: 'profile_completion_percentage', type: 'INT DEFAULT 0' },
      { name: 'profile_last_updated', type: 'TIMESTAMP NULL DEFAULT NULL' },
      { name: 'kyc_status', type: 'ENUM("pending", "in_progress", "verified", "rejected") DEFAULT "pending"' },
      { name: 'kyc_verified_at', type: 'TIMESTAMP NULL DEFAULT NULL' },
      { name: 'kyc_verified_by', type: 'INT DEFAULT NULL' },
    ];

    // Add address verification fields
    const addressFields = [
      { name: 'address_verified', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'address_proof_url', type: 'TEXT DEFAULT NULL' },
      { name: 'address_standardized', type: 'BOOLEAN DEFAULT FALSE' },
    ];

    // Combine all fields
    const allFields = [
      ...personalFields,
      ...identificationFields,
      ...demographicFields,
      ...contactFields,
      ...completionFields,
      ...addressFields
    ];

    // Check and add fields
    for (const field of allFields) {
      try {
        // Check if column exists
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

    // Create profile_verification_checkpoints table
    console.log('\n📋 Creating profile_verification_checkpoints table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS profile_verification_checkpoints (
        checkpoint_id INT PRIMARY KEY AUTO_INCREMENT,
        voter_id INT NOT NULL,
        checkpoint_type ENUM('aadhaar_otp', 'email_otp', 'mobile_otp', 'address_doc', 'personal_info', 'biometrics', 'family_linking') NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP NULL DEFAULT NULL,
        remarks TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
        UNIQUE KEY unique_checkpoint (voter_id, checkpoint_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created profile_verification_checkpoints table');

    // Create family_relations table
    console.log('\n👨‍👩‍👧‍👦 Creating family_relations table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS family_relations (
        relation_id INT PRIMARY KEY AUTO_INCREMENT,
        voter_id INT NOT NULL,
        related_voter_id INT DEFAULT NULL,
        relation_type ENUM('father', 'mother', 'spouse', 'son', 'daughter', 'brother', 'sister', 'other') NOT NULL,
        related_aadhaar VARCHAR(12) DEFAULT NULL,
        related_name VARCHAR(255) DEFAULT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
        FOREIGN KEY (related_voter_id) REFERENCES voters(voter_id) ON DELETE SET NULL,
        INDEX idx_voter (voter_id),
        INDEX idx_related (related_voter_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created family_relations table');

    // Create profile_update_history table
    console.log('\n📝 Creating profile_update_history table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS profile_update_history (
        history_id INT PRIMARY KEY AUTO_INCREMENT,
        voter_id INT NOT NULL,
        field_name VARCHAR(100) NOT NULL,
        old_value TEXT DEFAULT NULL,
        new_value TEXT DEFAULT NULL,
        updated_by INT DEFAULT NULL,
        update_reason VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
        INDEX idx_voter (voter_id),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created profile_update_history table');

    console.log('\n🎉 Profile extension migration completed!');
    await connection.end();
  } catch (error) {
    console.error('❌ Migration error:', error);
    await connection.end();
    throw error;
  }
}

migrateProfileExtended()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

