const express = require('express');
const router = express.Router();
const anomalyController = require('../controllers/anomalyController');

// POST /anomalies/run-full
router.post('/run-full', anomalyController.runFullDetection);

// GET /anomalies/duplicates
router.get('/duplicates', anomalyController.detectDuplicates);

// GET /anomalies/voting-patterns
router.get('/voting-patterns', anomalyController.detectVotingPatterns);

// GET /anomalies/integrity
router.get('/integrity', anomalyController.detectIntegrityIssues);

// GET /anomalies/temporal
router.get('/temporal', anomalyController.detectTemporalAnomalies);

// GET /anomalies/stats
router.get('/stats', anomalyController.getStats);

module.exports = router;

