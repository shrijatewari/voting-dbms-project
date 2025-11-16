const pool = require('../config/database');
const crypto = require('crypto');
const rbacService = require('./rbacService');

class AuthService {
  async loginWithEmail(email, password) {
    const connection = await pool.getConnection();
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // 1) Try admin/users table first
      try {
        const [users] = await connection.query(
          `SELECT u.user_id, u.username, u.email, u.role, u.password_hash, u.role_id,
                  r.name as role_name, r.level as role_level
           FROM users u
           LEFT JOIN roles r ON u.role_id = r.role_id
           WHERE u.email = ? LIMIT 1`,
          [normalizedEmail]
        );
        if (users.length > 0) {
          const user = users[0];
          // For demo, accept any password if password_hash is empty; otherwise verify hash
          if (!user.password_hash || user.password_hash.length === 0) {
            const roleInfo = await rbacService.getUserRoleAndPermissions(user.user_id);
            return {
              id: user.user_id,
              name: user.username,
              email: user.email,
              role: roleInfo.role.toUpperCase(),
              permissions: roleInfo.permissions
            };
          }
          const providedHash = crypto.createHash('sha256').update(password).digest('hex');
          if (providedHash === user.password_hash) {
            const roleInfo = await rbacService.getUserRoleAndPermissions(user.user_id);
            return {
              id: user.user_id,
              name: user.username,
              email: user.email,
              role: roleInfo.role.toUpperCase(),
              permissions: roleInfo.permissions
            };
          }
          throw new Error('Invalid credentials');
        }
      } catch (err) {
        // If error is not "Invalid credentials", it might be table doesn't exist
        if (err.message === 'Invalid credentials') {
          throw err;
        }
      }

      // 2) Fall back to voters - allow login only if email exists in voters
      const [voters] = await connection.query(
        `SELECT voter_id, name, email 
         FROM voters 
         WHERE email = ? AND email IS NOT NULL AND email != '' 
         LIMIT 1`,
        [normalizedEmail]
      );
      if (voters.length === 0) {
        throw new Error('Email not registered');
      }
      const voter = voters[0];
      // Accept any password for demo; real system should store password/OTP
      return {
        id: voter.voter_id,
        name: voter.name,
        email: voter.email,
        role: 'CITIZEN',
        permissions: []
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = new AuthService();


