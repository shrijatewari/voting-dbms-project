const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

router.post('/upload', documentController.uploadDocument);
router.get('/voter/:voterId', documentController.getVoterDocuments);
router.get('/:id', documentController.getDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;

