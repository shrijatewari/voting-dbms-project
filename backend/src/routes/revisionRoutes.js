const express = require('express');
const router = express.Router();
const revisionController = require('../controllers/revisionController');
const revisionBatchController = require('../controllers/revisionBatchController');
const { authenticateToken } = require('../middleware/auth');
const { requireMinimumRole, requirePermission } = require('../middleware/rbac');

// Revision Announcements
// POST /revision/announce (admin)
router.post('/announce', authenticateToken, revisionController.createAnnouncement);

// GET /revision/announcements (public - active)
router.get('/announcements', revisionController.getActiveAnnouncements);

// GET /revision/announcements/all (admin)
router.get('/announcements/all', authenticateToken, revisionController.getAllAnnouncements);

// GET /revision/announcements/:id
router.get('/announcements/:id', revisionController.getAnnouncementById);

// Revision Batches (Dry-run & Commit)
// GET /revision/batches - Get all batches
router.get('/batches', ...requirePermission('revision.view_flags'), revisionBatchController.getAllBatches);

// POST /revision/dry-run - Run dry-run revision
router.post('/dry-run', ...requirePermission('revision.dry_run'), revisionBatchController.runDryRun);

// POST /revision/batches/:batchId/commit - Commit batch
router.post('/batches/:batchId/commit', ...requirePermission('revision.commit'), revisionBatchController.commitBatch);

// GET /revision/batches/:batchId/flags - Get batch flags
router.get('/batches/:batchId/flags', ...requirePermission('revision.view_flags'), revisionBatchController.getBatchFlags);

module.exports = router;

