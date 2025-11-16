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
        user_id: user.id,
        email: user.email,
        role: user.role
      });
      return res.json({
        success: true,
        token,
        user
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


