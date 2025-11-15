/**
 * Enhanced Features Migration
 * Adds tables for: BLO tasks, appeals, transparency/merkle roots, revision announcements, communications
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voting_system'
};

async function runMigrations() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // 1. Enhance duplicate_checks table
    console.log('📋 Enhancing duplicate_checks table...');
    await connection.query(`
      ALTER TABLE duplicate_checks 
      ADD COLUMN IF NOT EXISTS confidence ENUM('low', 'medium', 'high') DEFAULT 'medium',
      ADD COLUMN IF NOT EXISTS flags JSON DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS algorithm_details JSON DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS scope VARCHAR(50) DEFAULT 'all',
      ADD COLUMN IF NOT EXISTS action ENUM('merge', 'reject', 'mark-as-ghost', 'pending') DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS approved_by INT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS appeal_window_end DATE DEFAULT NULL
    `).catch(() => {
      // Columns might already exist
      console.log('   (Some columns may already exist)');
    });

    // 2. Create BLO tasks table
    console.log('📋 Creating blo_tasks table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blo_tasks (
        task_id INT PRIMARY KEY AUTO_INCREMENT,
        task_type ENUM('field-verification', 'address-verification', 'document-verification', 'other') NOT NULL,
        voter_id INT,
        blo_id INT,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        due_date DATE,
        status ENUM('pending', 'in-progress', 'completed', 'rejected') DEFAULT 'pending',
        geo_latitude DECIMAL(10, 8),
        geo_longitude DECIMAL(11, 8),
        photos JSON DEFAULT NULL,
        notes TEXT,
        submitted_at DATETIME DEFAULT NULL,
        verified_by INT DEFAULT NULL,
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
        INDEX idx_blo_id (blo_id),
        INDEX idx_status (status),
        INDEX idx_due_date (due_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 3. Create appeals table
    console.log('📋 Creating appeals table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS appeals (
        appeal_id INT PRIMARY KEY AUTO_INCREMENT,
        voter_id INT,
        appeal_type ENUM('removal', 'duplicate-flag', 'verification-rejection', 'other') NOT NULL,
        reason TEXT NOT NULL,
        attachments JSON DEFAULT NULL,
        status ENUM('submitted', 'under-review', 'approved', 'rejected', 'escalated') DEFAULT 'submitted',
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_by INT DEFAULT NULL,
        reviewed_at DATETIME DEFAULT NULL,
        review_notes TEXT,
        sla_deadline DATE,
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
        INDEX idx_status (status),
        INDEX idx_sla_deadline (sla_deadline)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 4. Create transparency/merkle roots table
    console.log('📋 Creating transparency_merkle_roots table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transparency_merkle_roots (
        root_id INT PRIMARY KEY AUTO_INCREMENT,
        date DATE NOT NULL UNIQUE,
        merkle_root VARCHAR(255) NOT NULL,
        total_records INT NOT NULL,
        signature TEXT,
        published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 5. Create revision_announcements table
    console.log('📋 Creating revision_announcements table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS revision_announcements (
        announcement_id INT PRIMARY KEY AUTO_INCREMENT,
        region_type ENUM('district', 'state', 'national') NOT NULL,
        region_value VARCHAR(255),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        docs_required JSON DEFAULT NULL,
        notification_sent BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INT,
        INDEX idx_region (region_type, region_value),
        INDEX idx_dates (start_date, end_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 6. Create communications/notices table
    console.log('📋 Creating communications table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS communications (
        communication_id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        type ENUM('notice', 'manifesto', 'rumor-clarification', 'election-update') NOT NULL,
        attachments JSON DEFAULT NULL,
        signature TEXT,
        signature_valid BOOLEAN DEFAULT FALSE,
        published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        published_by INT,
        is_verified BOOLEAN DEFAULT FALSE,
        version INT DEFAULT 1,
        INDEX idx_type (type),
        INDEX idx_published (published_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 7. Create rumor_flags table
    console.log('📋 Creating rumor_flags table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rumor_flags (
        flag_id INT PRIMARY KEY AUTO_INCREMENT,
        url VARCHAR(500),
        description TEXT,
        reported_by INT,
        status ENUM('pending', 'under-review', 'verified-false', 'verified-true', 'resolved') DEFAULT 'pending',
        reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_by INT DEFAULT NULL,
        reviewed_at DATETIME DEFAULT NULL,
        response TEXT,
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 8. Create data_imports table (for bulk import tracking)
    console.log('📋 Creating data_imports table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS data_imports (
        import_id INT PRIMARY KEY AUTO_INCREMENT,
        filename VARCHAR(255),
        mapping JSON,
        total_records INT,
        imported_records INT,
        duplicate_records INT,
        error_records INT,
        status ENUM('uploaded', 'preview', 'processing', 'completed', 'failed', 'rolled-back') DEFAULT 'uploaded',
        preview_data JSON DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        committed_at DATETIME DEFAULT NULL,
        created_by INT,
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 9. Enhance death_records table with flags
    console.log('📋 Enhancing death_records table...');
    await connection.query(`
      ALTER TABLE death_records 
      ADD COLUMN IF NOT EXISTS source_id VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS match_confidence DECIMAL(5,2) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS flagged_for_verification BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verified_by INT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS verified_at DATETIME DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS voter_marked_deceased BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS appeal_window_end DATE DEFAULT NULL
    `).catch(() => {
      console.log('   (Some columns may already exist)');
    });

    // 10. Create death_sync_flags table
    console.log('📋 Creating death_sync_flags table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS death_sync_flags (
        flag_id INT PRIMARY KEY AUTO_INCREMENT,
        aadhaar_number VARCHAR(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        voter_id INT,
        match_score DECIMAL(5,2),
        status ENUM('pending', 'verified', 'rejected', 'appealed') DEFAULT 'pending',
        flagged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        verified_by INT DEFAULT NULL,
        verified_at DATETIME DEFAULT NULL,
        FOREIGN KEY (aadhaar_number) REFERENCES death_records(aadhaar_number) ON DELETE CASCADE,
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
        INDEX idx_status (status),
        INDEX idx_aadhaar (aadhaar_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 11. Create security_events table (SIEM)
    console.log('📋 Creating security_events table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        event_id INT PRIMARY KEY AUTO_INCREMENT,
        event_type VARCHAR(100) NOT NULL,
        severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        source_ip VARCHAR(45),
        user_id INT,
        action VARCHAR(255),
        details JSON DEFAULT NULL,
        risk_score INT DEFAULT 50,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_event_type (event_type),
        INDEX idx_severity (severity),
        INDEX idx_timestamp (timestamp),
        INDEX idx_source_ip (source_ip)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 12. Create vote_ledger table (Permissioned blockchain)
    console.log('📋 Creating vote_ledger table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vote_ledger (
        ledger_id INT PRIMARY KEY AUTO_INCREMENT,
        vote_id INT NOT NULL UNIQUE,
        block_hash VARCHAR(255) NOT NULL UNIQUE,
        previous_hash VARCHAR(255),
        block_data JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vote_id) REFERENCES votes(vote_id) ON DELETE CASCADE,
        INDEX idx_block_hash (block_hash),
        INDEX idx_previous_hash (previous_hash),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 13. Create vote_references table (End-to-end verification)
    console.log('📋 Creating vote_references table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vote_references (
        reference_id INT PRIMARY KEY AUTO_INCREMENT,
        vote_id INT NOT NULL UNIQUE,
        reference_code VARCHAR(16) NOT NULL UNIQUE,
        proof_data JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vote_id) REFERENCES votes(vote_id) ON DELETE CASCADE,
        INDEX idx_reference_code (reference_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ All enhanced feature migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migrations
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };

