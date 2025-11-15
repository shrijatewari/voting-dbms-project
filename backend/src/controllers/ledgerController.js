const ledgerService = require('../services/ledgerService');

class LedgerController {
  async createVoteBlock(req, res, next) {
    try {
      const { previous_hash } = req.body;
      const result = await ledgerService.createVoteBlock(req.body.vote_data, previous_hash);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async verifyLedgerIntegrity(req, res, next) {
    try {
      const result = await ledgerService.verifyLedgerIntegrity();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getBlockByVoteId(req, res, next) {
    try {
      const block = await ledgerService.getBlockByVoteId(req.params.vote_id);
      if (!block) {
        return res.status(404).json({ error: 'Block not found' });
      }
      res.json({ success: true, data: block });
    } catch (error) {
      next(error);
    }
  }

  async getLedgerChain(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const result = await ledgerService.getLedgerChain(page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LedgerController();

