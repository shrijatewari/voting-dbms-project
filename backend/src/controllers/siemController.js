const siemService = require('../services/siemService');

class SIEMController {
  async logSecurityEvent(req, res, next) {
    try {
      const result = await siemService.logSecurityEvent({
        ...req.body,
        source_ip: req.ip || req.connection.remoteAddress,
        user_id: req.user?.voter_id || null
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async detectSuspiciousLogins(req, res, next) {
    try {
      const result = await siemService.detectSuspiciousLogins();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getSecurityStats(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 7;
      const result = await siemService.getSecurityStats(days);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SIEMController();

