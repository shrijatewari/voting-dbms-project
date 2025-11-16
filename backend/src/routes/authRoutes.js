const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public login route
router.post('/login', authController.login.bind(authController));

// Verify current session
router.get('/me', authenticateToken, authController.me.bind(authController));

module.exports = router;


