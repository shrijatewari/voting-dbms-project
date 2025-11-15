const express = require('express');
const router = express.Router();
const endToEndVerificationController = require('../controllers/endToEndVerificationController');
const { authenticateToken } = require('../middleware/auth');

// POST /votes/:vote_id/reference (generate reference for voter)
router.post('/votes/:vote_id/reference', authenticateToken, endToEndVerificationController.generateVoteReference);

// GET /votes/verify/:reference_code (public verification)
router.get('/votes/verify/:reference_code', endToEndVerificationController.verifyVoteReference);

// GET /votes/election/:election_id/proof (auditor access)
router.get('/votes/election/:election_id/proof', authenticateToken, endToEndVerificationController.generateElectionProof);

module.exports = router;

