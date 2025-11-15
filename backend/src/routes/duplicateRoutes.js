const express = require('express');
const router = express.Router();
const duplicateController = require('../controllers/duplicateController');
const { validate, duplicateResolutionSchema } = require('../utils/validation');

// POST /duplicates/run
router.post('/run', duplicateController.runDuplicateDetection);

// GET /duplicates
router.get('/', duplicateController.getAllDuplicates);

// PUT /duplicates/:id/resolve
router.put('/:id/resolve', validate(duplicateResolutionSchema), duplicateController.resolveDuplicate);

module.exports = router;

