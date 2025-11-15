const candidateService = require('../services/candidateService');

class CandidateController {
  async createCandidate(req, res, next) {
    try {
      const candidate = await candidateService.createCandidate(req.body);
      res.status(201).json({ success: true, data: candidate });
    } catch (error) {
      next(error);
    }
  }

  async getCandidateById(req, res, next) {
    try {
      const candidate = await candidateService.getCandidateById(req.params.id);
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
      res.json({ success: true, data: candidate });
    } catch (error) {
      next(error);
    }
  }

  async getCandidatesByElection(req, res, next) {
    try {
      const electionId = req.query.election_id || req.params.election_id;
      if (!electionId) {
        return res.status(400).json({ error: 'election_id is required' });
      }
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await candidateService.getCandidatesByElection(electionId, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getAllCandidates(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await candidateService.getAllCandidates(page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async updateCandidate(req, res, next) {
    try {
      const candidate = await candidateService.updateCandidate(req.params.id, req.body);
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
      res.json({ success: true, data: candidate });
    } catch (error) {
      next(error);
    }
  }

  async deleteCandidate(req, res, next) {
    try {
      await candidateService.deleteCandidate(req.params.id);
      res.json({ success: true, message: 'Candidate deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CandidateController();

