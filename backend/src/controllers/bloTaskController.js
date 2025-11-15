const bloTaskService = require('../services/bloTaskService');

class BLOTaskController {
  async assignTask(req, res, next) {
    try {
      const task = await bloTaskService.assignTask(req.body);
      res.status(201).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  async getBLOTasks(req, res, next) {
    try {
      const bloId = req.params.blo_id;
      const status = req.query.status || null;
      const tasks = await bloTaskService.getBLOTasks(bloId, status);
      res.json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  }

  async submitTask(req, res, next) {
    try {
      const taskId = req.params.task_id;
      const task = await bloTaskService.submitTask(taskId, req.body);
      res.json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req, res, next) {
    try {
      const task = await bloTaskService.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  async getTasksByStatus(req, res, next) {
    try {
      const status = req.params.status;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await bloTaskService.getTasksByStatus(status, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BLOTaskController();

