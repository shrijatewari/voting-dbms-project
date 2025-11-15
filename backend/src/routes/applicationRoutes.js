const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');

router.get('/:applicationId', applicationController.getApplication);
router.get('/:applicationId/tracking', applicationController.getTrackingHistory);
router.put('/:applicationId/status', applicationController.updateStatus);

module.exports = router;

