const express = require('express');
const router = express.Router();
const deathRecordController = require('../controllers/deathRecordController');
const { validate, deathRecordSchema } = require('../utils/validation');

// POST /death-records
router.post('/', validate(deathRecordSchema), deathRecordController.createDeathRecord);

// POST /death-records/batch
router.post('/batch', deathRecordController.batchUploadDeathRecords);

// POST /death-records/sync/run
router.post('/sync/run', deathRecordController.runDeathSync);

// GET /death-records/sync/flags
router.get('/sync/flags', deathRecordController.getDeathSyncFlags);

// PUT /death-records/voters/:id/mark-deceased
router.put('/voters/:id/mark-deceased', deathRecordController.markVoterDeceased);

// GET /death-records
router.get('/', deathRecordController.getAllDeathRecords);

module.exports = router;

