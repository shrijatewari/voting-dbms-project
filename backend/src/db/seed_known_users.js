const mysql = require('mysql2/promise');
require('dotenv').config();
const crypto = require('crypto');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voting_system'
};

async function ensureTables(connection) {
  // users table (if not present)
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('citizen', 'blo', 'ero', 'deo', 'ceo', 'eci', 'admin') DEFAULT 'citizen',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (e) {
    // ignore
  }
}

async function seedKnown() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    await ensureTables(connection);

    console.log('🔐 Seeding known admin user (role=eci)...');
    const adminEmail = 'admin1@election.gov.in';
    const adminHash = crypto.createHash('sha256').update('admin1').digest('hex');
    await connection.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES (?, ?, ?, 'eci')
       ON DUPLICATE KEY UPDATE username=VALUES(username), role='eci'`,
      ['Admin User', adminEmail, adminHash]
    );
    console.log('✅ Admin seeded:', adminEmail, '/ admin1');

    console.log('👤 Seeding known voter...');
    const voterEmail = 'citizen1@example.com';
    // Ensure voters table exists minimally (it should), otherwise create a minimal schema
    await connection.query(`
      CREATE TABLE IF NOT EXISTS voters (
        voter_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        dob DATE,
        aadhaar_number VARCHAR(12) UNIQUE,
        biometric_hash VARCHAR(255),
        is_verified BOOLEAN DEFAULT 0,
        email VARCHAR(255),
        mobile_number VARCHAR(20),
        father_name VARCHAR(255),
        gender VARCHAR(20),
        house_number VARCHAR(50),
        street VARCHAR(255),
        village_city VARCHAR(255),
        district VARCHAR(255),
        state VARCHAR(255),
        pin_code VARCHAR(10),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await connection.query(
      `INSERT INTO voters (name,dob,aadhaar_number,biometric_hash,is_verified,email,mobile_number,gender,house_number,street,village_city,district,state,pin_code)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE email=VALUES(email)`,
      [
        'Rajesh Kumar',
        '1990-05-15',
        '999999999999',
        'a'.repeat(64),
        voterEmail,
        '9876543210',
        'Male',
        '12',
        'Main Street',
        'Delhi',
        'New Delhi',
        'Delhi',
        '110001'
      ]
    );
    console.log('✅ Voter seeded:', voterEmail, '/ any-password');

    console.log('\n🎉 Known users seeded successfully.');
    await connection.end();
  } catch (err) {
    console.error('❌ Seed error:', err);
    await connection.end();
    process.exit(1);
  }
}

seedKnown().then(() => process.exit(0));


