const duplicateDetectionService = require('../services/duplicateDetectionService');

class DuplicateController {
  async runDuplicateDetection(req, res, next) {
    try {
      const {
        scope = 'all',
        threshold = 0.85,
        algorithms = ['name_phonetic', 'name_fuzzy', 'dob', 'address', 'face'],
        dry_run = false,
        district,
        state
      } = req.body;
      
      const result = await duplicateDetectionService.runDuplicateDetection({
        scope,
        threshold: parseFloat(threshold),
        algorithms: Array.isArray(algorithms) ? algorithms : algorithms.split(','),
        dryRun: dry_run === true || dry_run === 'true',
        district,
        state
      });
      
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getAllDuplicates(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const resolved = req.query.resolved !== undefined ? req.query.resolved === 'true' : null;
      const result = await duplicateDetectionService.getAllDuplicates(page, limit, resolved);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async resolveDuplicate(req, res, next) {
    try {
      const duplicate = await duplicateDetectionService.resolveDuplicate(req.params.id, req.body);
      if (!duplicate) {
        return res.status(404).json({ error: 'Duplicate check not found' });
      }
      res.json({ success: true, data: duplicate });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DuplicateController();

