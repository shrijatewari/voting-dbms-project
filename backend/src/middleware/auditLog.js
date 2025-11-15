const pool = require('../config/database');
const { generateHash, getLastAuditHash } = require('../utils/hashChain');

/**
 * Audit Log Middleware
 * Automatically logs all API actions to audit_logs table with hash-chain
 */
async function auditLogMiddleware(req, res, next) {
  const originalSend = res.send;
  const startTime = Date.now();

  res.send = function (data) {
    res.send = originalSend;
    
    // Log asynchronously after response is sent
    setImmediate(async () => {
      try {
        const connection = await pool.getConnection();
        try {
          const actionType = getActionType(req.method);
          const entityType = getEntityType(req.path);
          // Only set entityId if it's a valid integer (not a string like 'verify-chain')
          let entityId = null;
          if (req.params.id && !isNaN(parseInt(req.params.id))) {
            entityId = parseInt(req.params.id);
          } else if (req.body.id && !isNaN(parseInt(req.body.id))) {
            entityId = parseInt(req.body.id);
          }
          
          const timestamp = new Date();
          const previousHash = await getLastAuditHash(connection);
          
          const logData = {
            action_type: actionType,
            entity_type: entityType,
            timestamp: timestamp.toISOString(),
            status_code: res.statusCode,
            method: req.method,
            path: req.path
          };
          
          const currentHash = generateHash(previousHash, logData, timestamp.toISOString());
          
          await connection.query(
            `INSERT INTO audit_logs 
             (action_type, entity_type, entity_id, timestamp, previous_hash, current_hash, details) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              actionType,
              entityType,
              entityId,
              timestamp,
              previousHash,
              currentHash,
              JSON.stringify({
                method: req.method,
                path: req.path,
                status_code: res.statusCode,
                response_time_ms: Date.now() - startTime,
                user_id: req.user?.id || null
              })
            ]
          );
          
          connection.release();
        } catch (error) {
          console.error('Audit log error:', error);
          connection.release();
        }
      } catch (error) {
        console.error('Failed to get connection for audit log:', error);
      }
    });
    
    return originalSend.call(this, data);
  };

  next();
}

function getActionType(method) {
  const map = {
    'GET': 'READ',
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE'
  };
  return map[method] || 'UNKNOWN';
}

function getEntityType(path) {
  if (path.includes('/voters')) return 'voter';
  if (path.includes('/elections')) return 'election';
  if (path.includes('/candidates')) return 'candidate';
  if (path.includes('/votes')) return 'vote';
  if (path.includes('/duplicates')) return 'duplicate_check';
  if (path.includes('/death-records')) return 'death_record';
  if (path.includes('/audit-logs')) return 'audit_log';
  return 'unknown';
}

module.exports = auditLogMiddleware;

