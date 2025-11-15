const express = require('express');
const router = express.Router();
const bloTaskController = require('../controllers/bloTaskController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// POST /tasks/assign
router.post('/assign', bloTaskController.assignTask);

// GET /tasks/blo/:blo_id
router.get('/blo/:blo_id', bloTaskController.getBLOTasks);

// GET /tasks/status/:status
router.get('/status/:status', bloTaskController.getTasksByStatus);

// GET /tasks/:id
router.get('/:id', bloTaskController.getTaskById);

// POST /tasks/:task_id/submit
router.post('/:task_id/submit', bloTaskController.submitTask);

module.exports = router;

