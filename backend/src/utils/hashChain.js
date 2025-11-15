const crypto = require('crypto');

/**
 * Generate hash for hash-chain implementation
 * @param {string} previousHash - Previous hash in the chain
 * @param {object} data - Data to hash
 * @param {string} timestamp - ISO timestamp
 * @returns {string} SHA-256 hash
 */
function generateHash(previousHash, data, timestamp) {
  const dataString = JSON.stringify(data);
  const combined = (previousHash || '0') + dataString + timestamp;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Get the last hash from votes table
 * @param {object} connection - Database connection
 * @returns {Promise<string|null>} Last hash or null
 */
async function getLastVoteHash(connection) {
  const [rows] = await connection.query(
    'SELECT current_hash FROM votes ORDER BY vote_id DESC LIMIT 1'
  );
  return rows.length > 0 ? rows[0].current_hash : null;
}

/**
 * Get the last hash from audit_logs table
 * @param {object} connection - Database connection
 * @returns {Promise<string|null>} Last hash or null
 */
async function getLastAuditHash(connection) {
  const [rows] = await connection.query(
    'SELECT current_hash FROM audit_logs ORDER BY log_id DESC LIMIT 1'
  );
  return rows.length > 0 ? rows[0].current_hash : null;
}

/**
 * Verify hash chain integrity
 * @param {object} connection - Database connection
 * @param {string} table - Table name ('votes' or 'audit_logs')
 * @returns {Promise<boolean>} True if chain is valid
 */
async function verifyHashChain(connection, table = 'votes') {
  const [rows] = await connection.query(
    `SELECT ${table === 'votes' ? 'vote_id' : 'log_id'}, previous_hash, current_hash, timestamp, 
     ${table === 'votes' ? 'voter_id, candidate_id, election_id' : 'action_type, entity_type'} 
     FROM ${table} ORDER BY ${table === 'votes' ? 'vote_id' : 'log_id'} ASC`
  );

  if (rows.length === 0) return true;

  let previousHash = null;
  for (const row of rows) {
    const data = table === 'votes' 
      ? { voter_id: row.voter_id, candidate_id: row.candidate_id, election_id: row.election_id }
      : { action_type: row.action_type, entity_type: row.entity_type };
    
    const expectedHash = generateHash(previousHash, data, row.timestamp);
    
    if (expectedHash !== row.current_hash) {
      return false;
    }
    
    if (row.previous_hash !== previousHash) {
      return false;
    }
    
    previousHash = row.current_hash;
  }

  return true;
}

module.exports = {
  generateHash,
  getLastVoteHash,
  getLastAuditHash,
  verifyHashChain
};

