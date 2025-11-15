const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { validate, candidateSchema } = require('../utils/validation');

// POST /candidates
router.post('/', validate(candidateSchema), candidateController.createCandidate);

// GET /candidates (with optional election_id query param)
router.get('/', candidateController.getAllCandidates);

// GET /candidates?election_id=:id (handled in getAllCandidates)
// GET /candidates/:id
router.get('/:id', candidateController.getCandidateById);

// PUT /candidates/:id
router.put('/:id', candidateController.updateCandidate);

// DELETE /candidates/:id
router.delete('/:id', candidateController.deleteCandidate);

module.exports = router;

