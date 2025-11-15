const express = require('express');
const router = express.Router();
const appealController = require('../controllers/appealController');
const { authenticateToken } = require('../middleware/auth');

// POST /appeals (citizen can create)
router.post('/', authenticateToken, appealController.createAppeal);

// GET /appeals/voter/:voter_id
router.get('/voter/:voter_id', authenticateToken, appealController.getAppealsByVoter);

// GET /appeals/status/:status (admin)
router.get('/status/:status', authenticateToken, appealController.getAppealsByStatus);

// GET /appeals/:id
router.get('/:id', authenticateToken, appealController.getAppealById);

// PUT /appeals/:id/review (admin)
router.put('/:id/review', authenticateToken, appealController.reviewAppeal);

// POST /appeals/check-sla (admin cron job)
router.post('/check-sla', authenticateToken, appealController.checkSLAViolations);

module.exports = router;

