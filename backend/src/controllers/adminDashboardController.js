const adminDashboardService = require('../services/adminDashboardService');
const aiClient = require('../services/aiClient');

class AdminDashboardController {
  async getStats(req, res, next) {
    try {
      const stats = await adminDashboardService.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  async getGraphs(req, res, next) {
    try {
      const graphs = await adminDashboardService.getGraphs();
      res.json({ success: true, data: graphs });
    } catch (err) {
      next(err);
    }
  }

  async getAIStatus(req, res, next) {
    try {
      const health = await aiClient.healthCheck();
      res.json({ success: true, data: health });
    } catch (err) {
      // If AI services are down, still respond gracefully
      res.json({ success: false, data: { error: 'AI services not reachable' } });
    }
  }
}

module.exports = new AdminDashboardController();



