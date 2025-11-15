const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');
const { authenticateToken } = require('../middleware/auth');

// POST /ledger/vote-block
router.post('/vote-block', authenticateToken, ledgerController.createVoteBlock);

// GET /ledger/verify
router.get('/verify', authenticateToken, ledgerController.verifyLedgerIntegrity);

// GET /ledger/vote/:vote_id
router.get('/vote/:vote_id', authenticateToken, ledgerController.getBlockByVoteId);

// GET /ledger/chain
router.get('/chain', authenticateToken, ledgerController.getLedgerChain);

module.exports = router;

