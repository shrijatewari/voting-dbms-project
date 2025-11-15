/**
 * SIEM Middleware
 * Automatically logs security events for authentication and authorization
 */

const siemService = require('../services/siemService');

function siemMiddleware(req, res, next) {
  // Log after response is sent
  const originalSend = res.send;
  res.send = function(data) {
    // Log security events
    if (req.path.includes('/api/auth') || req.path.includes('/api/votes')) {
      const eventType = req.path.includes('/api/auth/login') ? 'login' :
                       req.path.includes('/api/auth') ? 'auth_attempt' :
                       'vote_cast';
      
      const severity = res.statusCode >= 400 ? 'high' : 'medium';
      const riskScore = res.statusCode >= 400 ? 70 : 30;
      
      siemService.logSecurityEvent({
        event_type: eventType,
        severity,
        source_ip: req.ip || req.connection.remoteAddress,
        user_id: req.user?.voter_id || null,
        action: `${req.method} ${req.path}`,
        details: {
          status_code: res.statusCode,
          user_agent: req.get('user-agent')
        },
        risk_score: riskScore
      }).catch(() => {
        // Don't block request if SIEM logging fails
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

module.exports = siemMiddleware;

