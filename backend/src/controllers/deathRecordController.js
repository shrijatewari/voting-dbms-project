const deathSyncService = require('../services/deathSyncService');

class DeathRecordController {
  async createDeathRecord(req, res, next) {
    try {
      const record = await deathSyncService.createDeathRecord(req.body);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  async getAllDeathRecords(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await deathSyncService.getAllDeathRecords(page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async batchUploadDeathRecords(req, res, next) {
    try {
      const { records } = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ error: 'records must be an array' });
      }
      const result = await deathSyncService.batchUploadDeathRecords(records);
      res.status(201).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async runDeathSync(req, res, next) {
    try {
      const { mode = 'dry-run', threshold = 0.9 } = req.body;
      const result = await deathSyncService.runDeathSync({ mode, threshold: parseFloat(threshold) });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getDeathSyncFlags(req, res, next) {
    try {
      const status = req.query.status || null;
      const flags = await deathSyncService.getDeathSyncFlags(status);
      res.json({ success: true, data: { flags: Array.isArray(flags) ? flags : [] } });
    } catch (error) {
      next(error);
    }
  }

  async markVoterDeceased(req, res, next) {
    try {
      const voterId = req.params.id;
      const deathData = {
        ...req.body,
        verified_by: req.body.verified_by || req.user?.voter_id || null
      };
      const result = await deathSyncService.markVoterDeceased(voterId, deathData);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DeathRecordController();

