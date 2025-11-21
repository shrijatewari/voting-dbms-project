/**
 * Seed Superadmin User
 * Creates a superadmin account with full system access
 */

const pool = require('../config/database');
const crypto = require('crypto');

async function seedSuperadmin() {
  const connection = await pool.getConnection();
  try {
    console.log('🔐 Creating Superadmin user...\n');

    // First, ensure the users table supports 'superadmin' role
    try {
      await connection.query(`
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('citizen', 'blo', 'ero', 'deo', 'ceo', 'eci', 'admin', 'superadmin') DEFAULT 'citizen'
      `);
      console.log('✅ Updated users table to support superadmin role');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' || err.message.includes('Duplicate')) {
        console.log('✅ Users table already supports superadmin role');
      } else {
        console.warn('⚠️  Could not update role enum:', err.message);
      }
    }

    // Create superadmin user
    const superadminEmail = 'superadmin@election.gov.in';
    const superadminPassword = 'superadmin123';
    const passwordHash = crypto.createHash('sha256').update(superadminPassword).digest('hex');

    // Try to insert or update
    await connection.query(
      `INSERT INTO users (username, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         username = VALUES(username),
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         is_active = VALUES(is_active)`,
      ['Superadmin', superadminEmail, passwordHash, 'superadmin', true]
    );

    console.log('✅ Superadmin user created/updated successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 SUPERADMIN LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email:    ${superadminEmail}`);
    console.log(`   Password: ${superadminPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 This account has FULL SYSTEM ACCESS:');
    console.log('   • All voter management operations');
    console.log('   • All duplicate detection & resolution');
    console.log('   • All AI service management');
    console.log('   • All security & audit logs');
    console.log('   • All system settings & role management');
    console.log('   • All permissions enabled\n');

    // Also create/update ECI admin (backup high-level admin)
    const eciEmail = 'admin1@election.gov.in';
    const eciPassword = 'admin1';
    const eciPasswordHash = crypto.createHash('sha256').update(eciPassword).digest('hex');

    await connection.query(
      `INSERT INTO users (username, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         username = VALUES(username),
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         is_active = VALUES(is_active)`,
      ['ECI Admin', eciEmail, eciPasswordHash, 'eci', true]
    );

    console.log('✅ ECI Admin also available:');
    console.log(`   Email: ${eciEmail}`);
    console.log(`   Password: ${eciPassword}\n`);

  } catch (error) {
    console.error('❌ Error creating superadmin:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedSuperadmin()
    .then(() => {
      console.log('🎉 Superadmin seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedSuperadmin;

