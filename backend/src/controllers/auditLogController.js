const auditLogService = require('../services/auditLogService');

class AuditLogController {
  async getAuditLogs(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const filters = {
        entity_type: req.query.entity_type,
        action_type: req.query.action_type,
        voter_id: req.query.voter_id ? parseInt(req.query.voter_id) : null,
        election_id: req.query.election_id ? parseInt(req.query.election_id) : null,
        start_date: req.query.start_date,
        end_date: req.query.end_date
      };

      // Remove null/undefined filters
      Object.keys(filters).forEach(key => 
        filters[key] === null || filters[key] === undefined ? delete filters[key] : {}
      );

      const result = await auditLogService.getAuditLogs(filters, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async verifyAuditHashChain(req, res, next) {
    try {
      const isValid = await auditLogService.verifyAuditHashChain();
      res.json({ success: true, hash_chain_valid: isValid });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditLogController();

