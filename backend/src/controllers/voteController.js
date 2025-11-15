const voteService = require('../services/voteService');

class VoteController {
  async createVote(req, res, next) {
    try {
      const vote = await voteService.createVote(req.body);
      res.status(201).json({ success: true, data: vote });
    } catch (error) {
      next(error);
    }
  }

  async getVoteById(req, res, next) {
    try {
      const vote = await voteService.getVoteById(req.params.id);
      if (!vote) {
        return res.status(404).json({ error: 'Vote not found' });
      }
      res.json({ success: true, data: vote });
    } catch (error) {
      next(error);
    }
  }

  async getVotesByElection(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await voteService.getVotesByElection(req.params.election_id, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getElectionResults(req, res, next) {
    try {
      const results = await voteService.getElectionResults(req.params.election_id);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  async verifyHashChain(req, res, next) {
    try {
      const isValid = await voteService.verifyHashChain();
      res.json({ success: true, hash_chain_valid: isValid });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VoteController();

