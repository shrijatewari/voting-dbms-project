const express = require('express');
const router = express.Router();
const dataImportController = require('../controllers/dataImportController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// POST /data/import
router.post('/import', dataImportController.createImport);

// GET /data/imports
router.get('/imports', dataImportController.getAllImports);

// GET /data/import/:id
router.get('/import/:id', dataImportController.getImportById);

// POST /data/dedupe/run/:id
router.post('/dedupe/run/:id', dataImportController.runDedupeOnImport);

// POST /data/migrate/commit/:id
router.post('/migrate/commit/:id', dataImportController.commitImport);

// POST /data/migrate/rollback/:id
router.post('/migrate/rollback/:id', dataImportController.rollbackImport);

module.exports = router;

