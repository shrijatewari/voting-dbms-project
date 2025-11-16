const express = require('express');
const router = express.Router();
const voterController = require('../controllers/voterController');
const { validateVoterRegistration } = require('../middleware/voterValidation');
const { validate, biometricVerificationSchema } = require('../utils/validation');
const { requireMinimumRole, requirePermission } = require('../middleware/rbac');

// POST /voters - Register new voter (public - anyone can register)
router.post('/', validateVoterRegistration, voterController.createVoter);

// GET /voters/:id - Read voter (requires voters.view permission)
router.get('/:id', requirePermission('voters.view'), voterController.getVoterById);

// GET /voters - List voters (requires voters.view permission)
router.get('/', requirePermission('voters.view'), voterController.getAllVoters);

// PUT /voters/:id - Update voter (requires voters.edit permission)
router.put('/:id', requirePermission('voters.edit'), voterController.updateVoter);

// DELETE /voters/:id - Delete voter (requires voters.delete permission)
router.delete('/:id', requirePermission('voters.delete'), voterController.deleteVoter);

// POST /voters/verify-biometric - Verify biometric (public for registration)
router.post('/verify-biometric', validate(biometricVerificationSchema), voterController.verifyBiometric);

module.exports = router;

