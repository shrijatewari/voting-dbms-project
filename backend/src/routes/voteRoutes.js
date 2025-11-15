const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const { validate, voteSchema } = require('../utils/validation');

// POST /votes
router.post('/', validate(voteSchema), voteController.createVote);

// GET /votes/:id
router.get('/:id', voteController.getVoteById);

// GET /votes/election/:election_id
router.get('/election/:election_id', voteController.getVotesByElection);

// GET /votes/election/:election_id/results
router.get('/election/:election_id/results', voteController.getElectionResults);

// GET /votes/verify-chain
router.get('/verify-chain', voteController.verifyHashChain);

module.exports = router;

