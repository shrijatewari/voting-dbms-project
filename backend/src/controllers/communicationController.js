const communicationService = require('../services/communicationService');

class CommunicationController {
  async createCommunication(req, res, next) {
    try {
      const communication = await communicationService.createCommunication({
        ...req.body,
        published_by: req.body.published_by || req.user?.voter_id || null
      });
      res.status(201).json({ success: true, data: communication });
    } catch (error) {
      next(error);
    }
  }

  async getCommunicationById(req, res, next) {
    try {
      const communication = await communicationService.getCommunicationById(req.params.id);
      if (!communication) {
        return res.status(404).json({ error: 'Communication not found' });
      }
      res.json({ success: true, data: communication });
    } catch (error) {
      next(error);
    }
  }

  async verifyCommunication(req, res, next) {
    try {
      const communication = await communicationService.getCommunicationById(req.params.id);
      if (!communication) {
        return res.status(404).json({ error: 'Communication not found' });
      }
      const verification = communicationService.verifySignature(communication);
      res.json({ success: true, data: verification });
    } catch (error) {
      next(error);
    }
  }

  async getCommunicationsByType(req, res, next) {
    try {
      const type = req.params.type;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await communicationService.getCommunicationsByType(type, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async flagRumor(req, res, next) {
    try {
      const rumor = await communicationService.flagRumor({
        ...req.body,
        reported_by: req.body.reported_by || req.user?.voter_id || null
      });
      res.status(201).json({ success: true, data: rumor });
    } catch (error) {
      next(error);
    }
  }

  async reviewRumorFlag(req, res, next) {
    try {
      const rumor = await communicationService.reviewRumorFlag(req.params.id, {
        ...req.body,
        reviewed_by: req.body.reviewed_by || req.user?.voter_id || null
      });
      res.json({ success: true, data: rumor });
    } catch (error) {
      next(error);
    }
  }

  async getRumorFlagsByStatus(req, res, next) {
    try {
      const status = req.params.status;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await communicationService.getRumorFlagsByStatus(status, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CommunicationController();

