const express = require('express');
const router = express.Router();
const siemController = require('../controllers/siemController');
const { authenticateToken } = require('../middleware/auth');

// POST /security/incident (internal)
router.post('/incident', authenticateToken, siemController.logSecurityEvent);

// GET /security/suspicious-logins
router.get('/suspicious-logins', authenticateToken, siemController.detectSuspiciousLogins);

// GET /security/stats
router.get('/stats', authenticateToken, siemController.getSecurityStats);

module.exports = router;

