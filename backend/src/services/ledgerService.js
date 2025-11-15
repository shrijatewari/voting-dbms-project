/**
 * Permissioned Ledger Service
 * Implements blockchain-style append-only ledger for vote storage
 */

const crypto = require('crypto');
const pool = require('../config/database');

class LedgerService {
  /**
   * Create ledger block for vote
   */
  async createVoteBlock(voteData, previousHash) {
    const connection = await pool.getConnection();
    try {
      const {
        vote_id,
        voter_id,
        election_id,
        candidate_id,
        timestamp
      } = voteData;
      
      // Create block data (without revealing voter identity)
      const blockData = {
        vote_id,
        election_id,
        candidate_id,
        timestamp,
        // Hash voter_id instead of storing it
        voter_hash: crypto.createHash('sha256').update(String(voter_id)).digest('hex')
      };
      
      // Calculate block hash
      const blockHash = this.calculateBlockHash(blockData, previousHash);
      
      // Store in ledger
      await connection.query(
        `INSERT INTO vote_ledger 
         (vote_id, block_hash, previous_hash, block_data, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [
          vote_id,
          blockHash,
          previousHash,
          JSON.stringify(blockData)
        ]
      );
      
      return {
        block_hash: blockHash,
        previous_hash: previousHash,
        vote_id
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Calculate block hash
   */
  calculateBlockHash(blockData, previousHash) {
    const dataString = JSON.stringify(blockData) + previousHash;
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Verify ledger integrity
   */
  async verifyLedgerIntegrity() {
    const connection = await pool.getConnection();
    try {
      const [blocks] = await connection.query(
        'SELECT * FROM vote_ledger ORDER BY created_at ASC'
      );
      
      if (blocks.length === 0) {
        return { valid: true, message: 'Ledger is empty' };
      }
      
      const issues = [];
      let previousHash = '0'; // Genesis block
      
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const blockData = JSON.parse(block.block_data);
        
        // Verify previous hash chain
        if (block.previous_hash !== previousHash && i > 0) {
          issues.push({
            block_index: i,
            vote_id: block.vote_id,
            issue: 'Previous hash mismatch',
            expected: previousHash,
            actual: block.previous_hash
          });
        }
        
        // Verify block hash
        const expectedHash = this.calculateBlockHash(blockData, block.previous_hash);
        if (block.block_hash !== expectedHash) {
          issues.push({
            block_index: i,
            vote_id: block.vote_id,
            issue: 'Block hash mismatch',
            expected: expectedHash,
            actual: block.block_hash
          });
        }
        
        previousHash = block.block_hash;
      }
      
      return {
        valid: issues.length === 0,
        total_blocks: blocks.length,
        issues: issues.length,
        issue_details: issues
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Get ledger block by vote ID
   */
  async getBlockByVoteId(voteId) {
    const connection = await pool.getConnection();
    try {
      const [blocks] = await connection.query(
        'SELECT * FROM vote_ledger WHERE vote_id = ?',
        [voteId]
      );
      
      if (blocks[0]) {
        blocks[0].block_data = JSON.parse(blocks[0].block_data);
      }
      
      return blocks[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get full ledger chain
   */
  async getLedgerChain(page = 1, limit = 100) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      const [blocks] = await connection.query(
        'SELECT * FROM vote_ledger ORDER BY created_at ASC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      const [count] = await connection.query('SELECT COUNT(*) as total FROM vote_ledger');
      
      return {
        blocks: blocks.map(b => ({
          ...b,
          block_data: JSON.parse(b.block_data)
        })),
        pagination: {
          page,
          limit,
          total: count[0].total,
          totalPages: Math.ceil(count[0].total / limit)
        }
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = new LedgerService();

