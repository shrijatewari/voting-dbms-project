/**
 * RBAC Service
 * Loads roles and permissions from database
 */

const pool = require('../config/database');

class RBACService {
  /**
   * Get user role and permissions
   */
  async getUserRoleAndPermissions(userId) {
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.query(
        `SELECT u.*, r.name as role_name, r.level as role_level
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.role_id
         WHERE u.user_id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return { role: 'citizen', permissions: [] };
      }

      const user = users[0];
      const roleName = user.role_name || user.role || 'citizen';

      // Get permissions for this role
      const [permissions] = await connection.query(
        `SELECT p.key_name
         FROM permissions p
         JOIN role_permissions rp ON p.permission_id = rp.permission_id
         JOIN roles r ON rp.role_id = r.role_id
         WHERE r.name = ?`,
        [roleName]
      );

      return {
        role: roleName,
        roleLevel: user.role_level || 1,
        permissions: permissions.map(p => p.key_name)
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Check if user has permission
   */
  async checkPermission(userId, permission) {
    const { permissions } = await this.getUserRoleAndPermissions(userId);
    
    // Check exact match
    if (permissions.includes(permission)) {
      return true;
    }
    
    // Check wildcard permissions (e.g., 'voters.*' matches 'voters.view')
    const permissionParts = permission.split('.');
    for (const perm of permissions) {
      if (perm.endsWith('.*')) {
        const prefix = perm.replace('.*', '');
        if (permission.startsWith(prefix + '.')) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Get all roles
   */
  async getAllRoles() {
    const connection = await pool.getConnection();
    try {
      const [roles] = await connection.query(
        'SELECT * FROM roles ORDER BY level DESC'
      );
      return roles;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all permissions
   */
  async getAllPermissions() {
    const connection = await pool.getConnection();
    try {
      const [permissions] = await connection.query(
        'SELECT * FROM permissions ORDER BY module, key_name'
      );
      return permissions;
    } finally {
      connection.release();
    }
  }
}

module.exports = new RBACService();

