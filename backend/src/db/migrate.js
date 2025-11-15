const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

async function createDatabase() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'voting_system'}`);
    console.log('✅ Database created/verified');
    await connection.end();
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    await connection.end();
    throw error;
  }
}

async function runMigrations() {
  const connection = await mysql.createConnection({
    ...dbConfig,
    database: process.env.DB_NAME || 'voting_system'
  });

  try {
    // Drop tables if reset flag is set
    if (process.argv.includes('--reset')) {
      console.log('🔄 Resetting database...');
      await connection.query(`
        SET FOREIGN_KEY_CHECKS = 0;
        DROP TABLE IF EXISTS votes;
        DROP TABLE IF EXISTS candidate_manifestos;
        DROP TABLE IF EXISTS candidates;
        DROP TABLE IF EXISTS duplicate_checks;
        DROP TABLE IF EXISTS audit_logs;
        DROP TABLE IF EXISTS death_records;
        DROP TABLE IF EXISTS voters;
        DROP TABLE IF EXISTS elections;
        SET FOREIGN_KEY_CHECKS = 1;
      `);
      console.log('✅ Tables dropped');
    }

    // Create voters table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS voters (
        voter_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        dob DATE NOT NULL,
        aadhaar_number VARCHAR(12) NOT NULL UNIQUE,
        biometric_hash VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_aadhaar (aadhaar_number),
        INDEX idx_voter_id (voter_id),
        INDEX idx_biometric (biometric_hash)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table: voters created');

    // Create elections table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS elections (
        election_id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        status ENUM('upcoming', 'active', 'completed', 'cancelled') DEFAULT 'upcoming',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_election_id (election_id),
        INDEX idx_status (status),
        INDEX idx_dates (start_date, end_date),
        CHECK (end_date > start_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table: elections created');

    // Create candidates table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        candidate_id INT AUTO_INCREMENT PRIMARY KEY,
        election_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        manifesto TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_candidate_id (candidate_id),
        INDEX idx_election_id (election_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table: candidates created');

    // Create candidate_manifestos table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS candidate_manifestos (
        manifesto_id INT AUTO_INCREMENT PRIMARY KEY,
        candidate_id INT NOT NULL,
        manifesto_text TEXT NOT NULL,
        version INT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_candidate_id (candidate_id),
        INDEX idx_version (version)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table: candidate_manifestos created');

    // Create votes table (with hash-chain)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS votes (
        vote_id INT AUTO_INCREMENT PRIMARY KEY,
        voter_id INT NOT NULL,
        candidate_id INT NOT NULL,
        election_id INT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        previous_hash VARCHAR(255),
        current_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE RESTRICT ON UPDATE CASCADE,
        INDEX idx_vote_id (vote_id),
        INDEX idx_voter_id (voter_id),
        INDEX idx_election_id (election_id),
        INDEX idx_current_hash (current_hash),
        INDEX idx_previous_hash (previous_hash),
        UNIQUE KEY unique_voter_election (voter_id, election_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table: votes created');

    // Create death_records table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS death_records (
        aadhaar_number VARCHAR(12) PRIMARY KEY,
        death_date DATE NOT NULL,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_aadhaar (aadhaar_number),
        INDEX idx_death_date (death_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table: death_records created');

    // Create duplicate_checks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS duplicate_checks (
        check_id INT AUTO_INCREMENT PRIMARY KEY,
        voter_id_1 INT NOT NULL,
        voter_id_2 INT NOT NULL,
        similarity_score DECIMAL(5,2) NOT NULL,
        flagged_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at DATETIME NULL,
        note TEXT,
        FOREIGN KEY (voter_id_1) REFERENCES voters(voter_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (voter_id_2) REFERENCES voters(voter_id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_check_id (check_id),
        INDEX idx_resolved (resolved),
        INDEX idx_similarity (similarity_score),
        CHECK (similarity_score >= 0 AND similarity_score <= 100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table: duplicate_checks created');

    // Create audit_logs table (with hash-chain)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        action_type VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT,
        voter_id INT,
        election_id INT,
        candidate_id INT,
        vote_id INT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        previous_hash VARCHAR(255),
        current_hash VARCHAR(255) NOT NULL,
        details JSON,
        FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY (vote_id) REFERENCES votes(vote_id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_log_id (log_id),
        INDEX idx_action_type (action_type),
        INDEX idx_entity_type (entity_type),
        INDEX idx_timestamp (timestamp),
        INDEX idx_current_hash (current_hash),
        INDEX idx_previous_hash (previous_hash)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table: audit_logs created');

    console.log('\n🎉 All migrations completed successfully!');
    await connection.end();
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    await connection.end();
    throw error;
  }
}

async function main() {
  try {
    await createDatabase();
    await runMigrations();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();

