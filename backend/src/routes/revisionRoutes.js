const express = require('express');
const router = express.Router();
const revisionController = require('../controllers/revisionController');
const { authenticateToken } = require('../middleware/auth');

// POST /revision/announce (admin)
router.post('/announce', authenticateToken, revisionController.createAnnouncement);

// GET /revision/announcements (public - active)
router.get('/announcements', revisionController.getActiveAnnouncements);

// GET /revision/announcements/all (admin)
router.get('/announcements/all', authenticateToken, revisionController.getAllAnnouncements);

// GET /revision/announcements/:id
router.get('/announcements/:id', revisionController.getAnnouncementById);

module.exports = router;

