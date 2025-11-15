const anomalyDetectionService = require('../services/anomalyDetectionService');

class AnomalyController {
  async runFullDetection(req, res, next) {
    try {
      const results = await anomalyDetectionService.runFullAnomalyDetection();
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  async detectDuplicates(req, res, next) {
    try {
      const results = await anomalyDetectionService.detectDuplicateVoters();
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  async detectVotingPatterns(req, res, next) {
    try {
      const results = await anomalyDetectionService.detectSuspiciousVotingPatterns();
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  async detectIntegrityIssues(req, res, next) {
    try {
      const results = await anomalyDetectionService.detectDataIntegrityIssues();
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  async detectTemporalAnomalies(req, res, next) {
    try {
      const results = await anomalyDetectionService.detectTemporalAnomalies();
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await anomalyDetectionService.getAnomalyStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnomalyController();

