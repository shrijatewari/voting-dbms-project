const express = require('express');
const router = express.Router();
const mlDuplicateController = require('../controllers/mlDuplicateController');
const { authenticateToken } = require('../middleware/auth');

// POST /ml/duplicate
router.post('/duplicate', authenticateToken, mlDuplicateController.detectDuplicatesML);

// GET /ml/anomalies
router.get('/anomalies', authenticateToken, mlDuplicateController.detectAnomalies);

module.exports = router;

