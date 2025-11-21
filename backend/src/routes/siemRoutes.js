const express = require('express');
const router = express.Router();
const siemController = require('../controllers/siemController');
const siemControllerExtended = require('../controllers/siemControllerExtended');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// ===== COMPREHENSIVE SIEM DASHBOARD ROUTES =====
// Helper function to get permission middleware
const getSecurityView = () => requirePermission('security.view');
const getSecurityManage = () => requirePermission('security.manage');

// 1. Security Overview Stats
router.get('/overview', ...getSecurityView(), siemControllerExtended.getSecurityOverview);

// 2. Event Timeline
router.get('/events/timeline', ...getSecurityView(), siemControllerExtended.getEventTimeline);

// 3. Threat Heatmap
router.get('/threats/heatmap', ...getSecurityView(), siemControllerExtended.getThreatHeatmap);

// 4. Anomaly Detection Center
router.get('/anomalies', ...getSecurityView(), siemControllerExtended.getAnomalies);
router.post('/anomalies/:anomalyId/resolve', ...getSecurityManage(), siemControllerExtended.resolveAnomaly);

// 5. Admin Activity Monitoring
router.get('/admin-activity', ...getSecurityView(), siemControllerExtended.getAdminActivity);

// 6. Hash Chain Verification
router.get('/hash-chain/status', ...getSecurityView(), siemControllerExtended.getHashChainStatus);
router.post('/hash-chain/verify', ...getSecurityManage(), siemControllerExtended.verifyHashChain);

// 7. IP Blocking & Rate Limiting
router.get('/ip-blocks', ...getSecurityView(), siemControllerExtended.getIPBlocks);
router.post('/ip-blocks/block', ...getSecurityManage(), siemControllerExtended.blockIP);
router.post('/ip-blocks/unblock', ...getSecurityManage(), siemControllerExtended.unblockIP);
router.get('/rate-limits', ...getSecurityView(), siemControllerExtended.getRateLimitLogs);

// 8. Security Alerts
router.get('/alerts', ...getSecurityView(), siemControllerExtended.getSecurityAlerts);
router.post('/alerts/:alertId/acknowledge', ...getSecurityManage(), siemControllerExtended.acknowledgeAlert);
router.post('/alerts/:alertId/resolve', ...getSecurityManage(), siemControllerExtended.resolveAlert);

// 9. Security Risk Score & Recommendations
router.get('/risk-score', ...getSecurityView(), siemControllerExtended.getSecurityRiskScore);

// 10. BLO Device Monitoring
router.get('/blo-devices', ...getSecurityView(), siemControllerExtended.getBLODeviceMonitoring);

// ===== LEGACY ROUTES (for backward compatibility) =====
// Legacy routes also require authentication
router.post('/incident', authenticateToken, siemController.logSecurityEvent);
router.get('/suspicious-logins', authenticateToken, siemController.detectSuspiciousLogins);
router.get('/stats', authenticateToken, siemController.getSecurityStats);

module.exports = router;

