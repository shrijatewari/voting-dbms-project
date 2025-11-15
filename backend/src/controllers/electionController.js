const electionService = require('../services/electionService');

class ElectionController {
  async createElection(req, res, next) {
    try {
      const election = await electionService.createElection(req.body);
      res.status(201).json({ success: true, data: election });
    } catch (error) {
      next(error);
    }
  }

  async getElectionById(req, res, next) {
    try {
      const election = await electionService.getElectionById(req.params.id);
      if (!election) {
        return res.status(404).json({ error: 'Election not found' });
      }
      res.json({ success: true, data: election });
    } catch (error) {
      next(error);
    }
  }

  async getAllElections(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        status: req.query.status,
        start_date: req.query.start_date,
        end_date: req.query.end_date
      };
      const result = await electionService.getAllElections(page, limit, filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getActiveElections(req, res, next) {
    try {
      const elections = await electionService.getActiveElections();
      res.json({ success: true, data: elections });
    } catch (error) {
      next(error);
    }
  }

  async getCompletedElections(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await electionService.getCompletedElections(page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async updateElection(req, res, next) {
    try {
      const election = await electionService.updateElection(req.params.id, req.body);
      if (!election) {
        return res.status(404).json({ error: 'Election not found' });
      }
      res.json({ success: true, data: election });
    } catch (error) {
      next(error);
    }
  }

  async deleteElection(req, res, next) {
    try {
      await electionService.deleteElection(req.params.id);
      res.json({ success: true, message: 'Election deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ElectionController();

