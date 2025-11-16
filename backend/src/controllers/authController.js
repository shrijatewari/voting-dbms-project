const { generateToken } = require('../middleware/auth');
const authService = require('../services/authService');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      const user = await authService.loginWithEmail(email, password);
      const token = generateToken({
        id: user.id,
        user_id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      });
      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions || []
        }
      });
    } catch (error) {
      if (error.message === 'Email not registered' || error.message === 'Invalid credentials') {
        return res.status(401).json({ error: error.message });
      }
      next(error);
    }
  }

  async me(req, res) {
    return res.json({ success: true, user: req.user });
  }
}

module.exports = new AuthController();


