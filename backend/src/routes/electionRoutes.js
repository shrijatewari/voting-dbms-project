const express = require('express');
const router = express.Router();
const electionController = require('../controllers/electionController');
const { validate, electionSchema } = require('../utils/validation');

// POST /elections
router.post('/', validate(electionSchema), electionController.createElection);

// GET /elections
router.get('/', electionController.getAllElections);

// GET /elections/active
router.get('/active', electionController.getActiveElections);

// GET /elections/completed
router.get('/completed', electionController.getCompletedElections);

// GET /elections/:id
router.get('/:id', electionController.getElectionById);

// PUT /elections/:id
router.put('/:id', electionController.updateElection);

// DELETE /elections/:id
router.delete('/:id', electionController.deleteElection);

module.exports = router;

