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
      // Count active services
      const activeServices = Object.values(health).filter((s) => s.status === 'ok').length;
      res.json({ 
        success: true, 
        data: {
          ...health,
          activeServices,
          totalServices: Object.keys(health).length
        }
      });
    } catch (err) {
      // If AI services are down, still respond gracefully
      console.warn('AI health check failed:', err);
      res.json({ 
        success: false, 
        data: { 
          error: 'AI services not reachable',
          activeServices: 0,
          totalServices: 6
        } 
      });
    }
  }
}

module.exports = new AdminDashboardController();



