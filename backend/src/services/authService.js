const pool = require('../config/database');
const crypto = require('crypto');

class AuthService {
  async loginWithEmail(email, password) {
    const connection = await pool.getConnection();
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // 1) Try admin/users table first
      try {
        const [users] = await connection.query(
          `SELECT user_id, username, email, role, password_hash 
           FROM users 
           WHERE email = ? LIMIT 1`,
          [normalizedEmail]
        );
        if (users.length > 0) {
          const user = users[0];
          // For demo, accept any password if password_hash is empty; otherwise verify hash
          if (!user.password_hash || user.password_hash.length === 0) {
            return {
              id: user.user_id,
              name: user.username,
              email: user.email,
              role: (user.role || 'citizen').toLowerCase()
            };
          }
          const providedHash = crypto.createHash('sha256').update(password).digest('hex');
          if (providedHash === user.password_hash) {
            return {
              id: user.user_id,
              name: user.username,
              email: user.email,
              role: (user.role || 'citizen').toLowerCase()
            };
          }
          throw new Error('Invalid credentials');
        }
      } catch (_) {
        // users table might not exist, ignore
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
        role: 'citizen'
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = new AuthService();


