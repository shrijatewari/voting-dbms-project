const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');
const { authenticateToken } = require('../middleware/auth');

// POST /communications/notice (admin)
router.post('/notice', authenticateToken, communicationController.createCommunication);

// GET /communications/verify/:id (public)
router.get('/verify/:id', communicationController.verifyCommunication);

// GET /communications/type/:type (public)
router.get('/type/:type', communicationController.getCommunicationsByType);

// GET /communications/:id
router.get('/:id', communicationController.getCommunicationById);

// POST /rumour/flag (citizen)
router.post('/rumour/flag', authenticateToken, communicationController.flagRumor);

// PUT /rumour/:id/review (admin)
router.put('/rumour/:id/review', authenticateToken, communicationController.reviewRumorFlag);

// GET /rumour/status/:status (admin)
router.get('/rumour/status/:status', authenticateToken, communicationController.getRumorFlagsByStatus);

module.exports = router;

