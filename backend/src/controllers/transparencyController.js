const transparencyService = require('../services/transparencyService');

class TransparencyController {
  async generateMerkleRoot(req, res, next) {
    try {
      const date = req.query.date || null;
      const result = await transparencyService.generateMerkleRoot(date);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getMerkleRoot(req, res, next) {
    try {
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const root = await transparencyService.getMerkleRoot(date);
      if (!root) {
        return res.status(404).json({ error: 'Merkle root not found for this date' });
      }
      res.json({ success: true, data: root });
    } catch (error) {
      next(error);
    }
  }

  async getAllMerkleRoots(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 30;
      const result = await transparencyService.getAllMerkleRoots(page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async generateExport(req, res, next) {
    try {
      const region = req.query.district ? { district: req.query.district } :
                     req.query.state ? { state: req.query.state } : null;
      const result = await transparencyService.generateSanitizedExport(region);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async verifyVoterRecord(req, res, next) {
    try {
      const voterId = parseInt(req.params.voter_id);
      const proof = await transparencyService.verifyVoterRecord(voterId);
      if (!proof) {
        return res.status(404).json({ error: 'Voter record not found' });
      }
      res.json({ success: true, data: proof });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TransparencyController();

