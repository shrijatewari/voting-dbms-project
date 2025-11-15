const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Profile CRUD
router.get('/:id?', profileController.getProfile);
router.put('/:id?', profileController.updateProfile);
router.get('/:id?/completion', profileController.getCompletionStatus);

// Contact verification
router.post('/:id?/verify-contact', profileController.verifyContact);

// Family relations
router.post('/:id?/family', profileController.addFamilyRelation);
router.get('/:id?/family', profileController.getFamilyRelations);
router.delete('/family/:relationId', profileController.removeFamilyRelation);

// DigiLocker import
router.post('/:id?/import-digilocker', profileController.importFromDigiLocker);

module.exports = router;

