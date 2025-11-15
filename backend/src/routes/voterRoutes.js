const express = require('express');
const router = express.Router();
const voterController = require('../controllers/voterController');
const { validateVoterRegistration } = require('../middleware/voterValidation');
const { validate, biometricVerificationSchema } = require('../utils/validation');
// const { authenticateToken } = require('../middleware/auth');

// POST /voters - Register new voter (with enhanced validation)
router.post('/', validateVoterRegistration, voterController.createVoter);

// GET /voters/:id
router.get('/:id', voterController.getVoterById);

// GET /voters
router.get('/', voterController.getAllVoters);

// PUT /voters/:id
router.put('/:id', voterController.updateVoter);

// DELETE /voters/:id
router.delete('/:id', voterController.deleteVoter);

// POST /voters/verify-biometric
router.post('/verify-biometric', validate(biometricVerificationSchema), voterController.verifyBiometric);

module.exports = router;

