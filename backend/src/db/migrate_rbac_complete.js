/**
 * Complete RBAC Migration
 * Creates roles, permissions, and role_permissions tables
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

async function migrate() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('🔄 Creating RBAC tables...');

    // 1. Create roles table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        role_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        level INT DEFAULT 1 COMMENT 'Hierarchy level: 1=lowest, 10=highest',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_level (level)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 2. Create permissions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        permission_id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        module VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_key (key_name),
        INDEX idx_module (module)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 3. Create role_permissions junction table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE,
        INDEX idx_role (role_id),
        INDEX idx_permission (permission_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 4. Add role_id to users table if not exists
    try {
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN role_id INT DEFAULT NULL,
        ADD FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE SET NULL
      `);
    } catch (e) {
      // Column might already exist
      console.log('   (role_id column may already exist)');
    }

    console.log('✅ RBAC tables created successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = migrate;

