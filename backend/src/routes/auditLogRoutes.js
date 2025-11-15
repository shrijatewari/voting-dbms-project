const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');

// GET /audit-logs
router.get('/', auditLogController.getAuditLogs);

// GET /audit-logs/verify-chain
router.get('/verify-chain', auditLogController.verifyAuditHashChain);

module.exports = router;

