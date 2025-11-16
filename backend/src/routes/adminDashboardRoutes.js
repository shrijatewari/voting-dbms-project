const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const adminDashboardController = require('../controllers/adminDashboardController');

// All admin routes require auth
router.use(authenticateToken);

// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', adminDashboardController.getStats.bind(adminDashboardController));

// GET /api/admin/dashboard/graphs
router.get('/dashboard/graphs', adminDashboardController.getGraphs.bind(adminDashboardController));

// GET /api/admin/dashboard/ai-status
router.get('/dashboard/ai-status', adminDashboardController.getAIStatus.bind(adminDashboardController));

module.exports = router;



