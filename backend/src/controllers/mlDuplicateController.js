const mlDuplicateService = require('../services/mlDuplicateService');

class MLDuplicateController {
  async detectDuplicatesML(req, res, next) {
    try {
      const result = await mlDuplicateService.detectDuplicatesML(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async detectAnomalies(req, res, next) {
    try {
      const result = await mlDuplicateService.detectAnomalies();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MLDuplicateController();

