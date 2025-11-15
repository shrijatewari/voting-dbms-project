const appealService = require('../services/appealService');

class AppealController {
  async createAppeal(req, res, next) {
    try {
      const appeal = await appealService.createAppeal(req.body);
      res.status(201).json({ success: true, data: appeal });
    } catch (error) {
      next(error);
    }
  }

  async getAppealById(req, res, next) {
    try {
      const appeal = await appealService.getAppealById(req.params.id);
      if (!appeal) {
        return res.status(404).json({ error: 'Appeal not found' });
      }
      res.json({ success: true, data: appeal });
    } catch (error) {
      next(error);
    }
  }

  async getAppealsByVoter(req, res, next) {
    try {
      const voterId = parseInt(req.params.voter_id);
      const appeals = await appealService.getAppealsByVoter(voterId);
      res.json({ success: true, data: appeals });
    } catch (error) {
      next(error);
    }
  }

  async getAppealsByStatus(req, res, next) {
    try {
      const status = req.params.status;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await appealService.getAppealsByStatus(status, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async reviewAppeal(req, res, next) {
    try {
      const appealId = req.params.id;
      const reviewData = {
        ...req.body,
        reviewed_by: req.body.reviewed_by || req.user?.voter_id || null
      };
      const appeal = await appealService.reviewAppeal(appealId, reviewData);
      res.json({ success: true, data: appeal });
    } catch (error) {
      next(error);
    }
  }

  async checkSLAViolations(req, res, next) {
    try {
      const result = await appealService.checkSLAViolations();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AppealController();

