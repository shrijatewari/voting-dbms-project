const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voting_system'
};

async function migrateProfileComplete() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🔄 Adding COMPLETE government-grade profile fields...\n');

    // 1. PERSONAL INFORMATION - Additional fields
    const personalFields = [
      { name: 'signature_url', type: 'TEXT DEFAULT NULL' },
      { name: 'preferred_language', type: 'VARCHAR(50) DEFAULT "en"' },
    ];

    // 2. CONTACT INFORMATION - Additional fields
    const contactFields = [
      { name: 'emergency_contact_number', type: 'VARCHAR(10) DEFAULT NULL' },
    ];

    // 3. ADDRESS DETAILS - Permanent address fields
    const addressFields = [
      { name: 'permanent_house_number', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'permanent_street', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'permanent_village_city', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'permanent_district', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'permanent_taluka', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'permanent_state', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'permanent_pin_code', type: 'VARCHAR(10) DEFAULT NULL' },
      { name: 'taluka', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'gis_latitude', type: 'DECIMAL(10, 8) DEFAULT NULL' },
      { name: 'gis_longitude', type: 'DECIMAL(11, 8) DEFAULT NULL' },
      { name: 'same_as_aadhaar_address', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'same_as_permanent_address', type: 'BOOLEAN DEFAULT FALSE' },
    ];

    // 4. IDENTIFICATION - Additional fields
    const identificationFields = [
      { name: 'aadhaar_qr_url', type: 'TEXT DEFAULT NULL' },
    ];

    // 5. DEMOGRAPHIC INFORMATION - Additional fields
    const demographicFields = [
      { name: 'disability_type', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'caste_community', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'minority_status', type: 'VARCHAR(50) DEFAULT NULL' },
    ];

    // 6. FAMILY & HOUSEHOLD - Additional fields
    const householdFields = [
      { name: 'head_of_family', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'household_size', type: 'INT DEFAULT NULL' },
      { name: 'household_type', type: 'ENUM("Owned", "Rented", "Other") DEFAULT NULL' },
    ];

    // 7. VOTER-SPECIFIC INFORMATION
    const voterFields = [
      { name: 'is_first_time_voter', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'is_migrant_worker', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'is_nri', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'preferred_polling_station_id', type: 'INT DEFAULT NULL' },
      { name: 'needs_disability_assistance', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'needs_braille_ballot', type: 'BOOLEAN DEFAULT FALSE' },
    ];

    // 8. DOCUMENTS - Additional document URLs
    const documentFields = [
      { name: 'aadhaar_copy_url', type: 'TEXT DEFAULT NULL' },
      { name: 'birth_certificate_url', type: 'TEXT DEFAULT NULL' },
      { name: 'marriage_certificate_url', type: 'TEXT DEFAULT NULL' },
      { name: 'affidavit_url', type: 'TEXT DEFAULT NULL' },
    ];

    // 9. BIOMETRIC INFORMATION - Additional fields
    const biometricFields = [
      { name: 'face_embedding_hash', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'biometric_reverification_date', type: 'DATE DEFAULT NULL' },
      { name: 'liveness_check_passed', type: 'BOOLEAN DEFAULT FALSE' },
    ];

    // 10. NRI-SPECIFIC DETAILS
    const nriFields = [
      { name: 'country_of_residence', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'foreign_address', type: 'TEXT DEFAULT NULL' },
      { name: 'embassy_jurisdiction', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'visa_type', type: 'VARCHAR(50) DEFAULT NULL' },
      { name: 'oci_pio_status', type: 'VARCHAR(50) DEFAULT NULL' },
    ];

    // 11. SECURITY & AUTHENTICATION
    const securityFields = [
      { name: 'two_factor_enabled', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'security_question_1', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'security_answer_1', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'security_question_2', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'security_answer_2', type: 'VARCHAR(255) DEFAULT NULL' },
    ];

    // 12. COMMUNICATION & NOTIFICATIONS
    const notificationFields = [
      { name: 'receive_sms_updates', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'receive_email_updates', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'receive_election_reminders', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'receive_booth_change_alerts', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'receive_grievance_alerts', type: 'BOOLEAN DEFAULT TRUE' },
    ];

    // 13. DIGITAL CONSENT & DECLARATIONS
    const consentFields = [
      { name: 'consent_indian_citizen', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'consent_details_correct', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'consent_biometric_verification', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'consent_residency_confirmed', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'consent_eci_matching', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'consent_date', type: 'TIMESTAMP NULL DEFAULT NULL' },
    ];

    // Combine all fields
    const allFields = [
      ...personalFields,
      ...contactFields,
      ...addressFields,
      ...identificationFields,
      ...demographicFields,
      ...householdFields,
      ...voterFields,
      ...documentFields,
      ...biometricFields,
      ...nriFields,
      ...securityFields,
      ...notificationFields,
      ...consentFields
    ];

    // Check and add fields
    for (const field of allFields) {
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

    // Create trusted_devices table
    console.log('\n📱 Creating trusted_devices table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS trusted_devices (
        device_id INT PRIMARY KEY AUTO_INCREMENT,
        voter_id INT NOT NULL,
        device_name VARCHAR(255) NOT NULL,
        device_fingerprint VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
        INDEX idx_voter (voter_id),
        INDEX idx_fingerprint (device_fingerprint)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created trusted_devices table');

    // Create session_history table
    console.log('\n🔐 Creating session_history table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS session_history (
        session_id INT PRIMARY KEY AUTO_INCREMENT,
        voter_id INT NOT NULL,
        device_fingerprint VARCHAR(255) DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        logout_at TIMESTAMP NULL DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
        INDEX idx_voter (voter_id),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created session_history table');

    // Create document_versions table
    console.log('\n📄 Creating document_versions table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS document_versions (
        version_id INT PRIMARY KEY AUTO_INCREMENT,
        voter_id INT NOT NULL,
        document_type ENUM('aadhaar', 'address_proof', 'photo', 'signature', 'disability_cert', 'birth_cert', 'marriage_cert', 'affidavit') NOT NULL,
        document_url TEXT NOT NULL,
        status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP NULL DEFAULT NULL,
        verified_by INT DEFAULT NULL,
        remarks TEXT DEFAULT NULL,
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
        INDEX idx_voter (voter_id),
        INDEX idx_type (document_type),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created document_versions table');

    // Create application_tracking table (for submission workflow)
    console.log('\n📋 Creating application_tracking table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS application_tracking (
        tracking_id INT PRIMARY KEY AUTO_INCREMENT,
        voter_id INT NOT NULL,
        application_type ENUM('registration', 'profile_update', 'epic_generation') NOT NULL,
        status ENUM('submitted', 'under_verification', 'blo_visit', 'ero_approval', 'approved', 'rejected', 'appealed') DEFAULT 'submitted',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP NULL DEFAULT NULL,
        approved_at TIMESTAMP NULL DEFAULT NULL,
        rejected_at TIMESTAMP NULL DEFAULT NULL,
        verified_by INT DEFAULT NULL,
        approved_by INT DEFAULT NULL,
        remarks TEXT DEFAULT NULL,
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
        INDEX idx_voter (voter_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created application_tracking table');

    // Create application_timeline table
    console.log('\n⏱️  Creating application_timeline table...');
    try {
      // Check if table exists
      const [tables] = await connection.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'application_timeline'`,
        [dbConfig.database]
      );
      
      if (tables.length === 0) {
        await connection.query(`
          CREATE TABLE application_timeline (
            timeline_id INT PRIMARY KEY AUTO_INCREMENT,
            tracking_id INT NOT NULL,
            event_type VARCHAR(100) NOT NULL,
            event_description TEXT DEFAULT NULL,
            officer_name VARCHAR(255) DEFAULT NULL,
            officer_id INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_tracking (tracking_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Add foreign key separately
        await connection.query(`
          ALTER TABLE application_timeline
          ADD CONSTRAINT fk_tracking
          FOREIGN KEY (tracking_id) REFERENCES application_tracking(tracking_id) ON DELETE CASCADE
        `);
        console.log('✅ Created application_timeline table');
      } else {
        console.log('⏭️  application_timeline table already exists');
      }
    } catch (error) {
      console.log('⚠️  Note: Could not create application_timeline (may already exist):', error.message);
    }

    console.log('\n🎉 COMPLETE profile migration finished!');
    await connection.end();
  } catch (error) {
    console.error('❌ Migration error:', error);
    await connection.end();
    throw error;
  }
}

migrateProfileComplete()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

