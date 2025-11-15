const express = require('express');
const router = express.Router();
const transparencyController = require('../controllers/transparencyController');

// Public transparency endpoints (read-only)
// GET /transparency/merkle-root
router.get('/merkle-root', transparencyController.getMerkleRoot);

// GET /transparency/merkle-roots (all)
router.get('/merkle-roots', transparencyController.getAllMerkleRoots);

// GET /transparency/export
router.get('/export', transparencyController.generateExport);

// GET /transparency/verify/:voter_id
router.get('/verify/:voter_id', transparencyController.verifyVoterRecord);

// Admin-only: Generate merkle root
const { authenticateToken } = require('../middleware/auth');
router.post('/merkle-root/generate', authenticateToken, transparencyController.generateMerkleRoot);

module.exports = router;

