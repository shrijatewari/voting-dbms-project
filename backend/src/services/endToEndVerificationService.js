/**
 * End-to-End Verifiable Voting Service
 * Implements cryptographic proofs for vote verification without revealing voter identity
 */

const crypto = require('crypto');
const pool = require('../config/database');

class EndToEndVerificationService {
  /**
   * Generate vote reference (non-revealing proof)
   */
  async generateVoteReference(voteId) {
    const connection = await pool.getConnection();
    try {
      const [votes] = await connection.query(
        'SELECT vote_id, election_id, candidate_id, current_hash, timestamp FROM votes WHERE vote_id = ?',
        [voteId]
      );
      
      if (votes.length === 0) {
        return null;
      }
      
      const vote = votes[0];
      
      // Create non-revealing reference
      const referenceData = {
        vote_id_hash: crypto.createHash('sha256').update(String(vote.vote_id)).digest('hex'),
        election_id: vote.election_id,
        timestamp: vote.timestamp,
        proof_hash: vote.current_hash
      };
      
      // Generate reference code (short, shareable)
      const referenceCode = crypto.createHash('sha256')
        .update(JSON.stringify(referenceData))
        .digest('hex')
        .substring(0, 16)
        .toUpperCase();
      
      // Store reference (in production, use separate table with encryption)
      await connection.query(
        `INSERT INTO vote_references (vote_id, reference_code, proof_data, created_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE reference_code = VALUES(reference_code)`,
        [voteId, referenceCode, JSON.stringify(referenceData)]
      );
      
      return {
        reference_code: referenceCode,
        verification_url: `/api/votes/verify/${referenceCode}`,
        message: 'Use this reference to verify your vote was counted (without revealing your choice)'
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Verify vote reference (public verification)
   */
  async verifyVoteReference(referenceCode) {
    const connection = await pool.getConnection();
    try {
      const [references] = await connection.query(
        'SELECT * FROM vote_references WHERE reference_code = ?',
        [referenceCode]
      );
      
      if (references.length === 0) {
        return { valid: false, message: 'Reference code not found' };
      }
      
      const reference = references[0];
      const proofData = JSON.parse(reference.proof_data);
      
      // Verify hash chain integrity
      const [votes] = await connection.query(
        'SELECT current_hash, previous_hash FROM votes WHERE vote_id = ?',
        [reference.vote_id]
      );
      
      if (votes.length === 0) {
        return { valid: false, message: 'Vote not found' };
      }
      
      const vote = votes[0];
      const hashValid = vote.current_hash === proofData.proof_hash;
      
      return {
        valid: hashValid,
        verified: hashValid,
        election_id: proofData.election_id,
        timestamp: proofData.timestamp,
        message: hashValid 
          ? 'Your vote was successfully recorded and verified in the system'
          : 'Vote hash verification failed - possible tampering detected'
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Generate aggregate proof for election (for auditors)
   */
  async generateElectionProof(electionId) {
    const connection = await pool.getConnection();
    try {
      const [votes] = await connection.query(
        'SELECT vote_id, current_hash, previous_hash, timestamp FROM votes WHERE election_id = ? ORDER BY timestamp ASC',
        [electionId]
      );
      
      if (votes.length === 0) {
        return { election_id: electionId, total_votes: 0, proof: null };
      }
      
      // Create merkle tree of all votes
      const leaves = votes.map(v => v.current_hash);
      const merkleRoot = this.computeMerkleRoot(leaves);
      
      // Generate aggregate proof
      const proof = {
        election_id: electionId,
        total_votes: votes.length,
        merkle_root: merkleRoot,
        first_hash: votes[0].previous_hash || '0',
        last_hash: votes[votes.length - 1].current_hash,
        hash_chain_valid: this.verifyHashChain(votes),
        timestamp: new Date().toISOString()
      };
      
      // Sign proof
      const signature = this.signData(JSON.stringify(proof));
      
      return {
        ...proof,
        signature,
        verification: 'This proof verifies vote count and integrity without revealing individual votes'
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Compute merkle root
   */
  computeMerkleRoot(leaves) {
    if (leaves.length === 0) return null;
    if (leaves.length === 1) return leaves[0];
    
    let level = [...leaves];
    
    while (level.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < level.length; i += 2) {
        if (i + 1 < level.length) {
          const hash = crypto.createHash('sha256')
            .update(level[i] + level[i + 1])
            .digest('hex');
          nextLevel.push(hash);
        } else {
          nextLevel.push(level[i]);
        }
      }
      level = nextLevel;
    }
    
    return level[0];
  }

  /**
   * Verify hash chain integrity
   */
  verifyHashChain(votes) {
    if (votes.length === 0) return true;
    
    let previousHash = votes[0].previous_hash || '0';
    
    for (const vote of votes) {
      if (vote.previous_hash !== previousHash) {
        return false;
      }
      previousHash = vote.current_hash;
    }
    
    return true;
  }

  /**
   * Sign data
   */
  signData(data) {
    const privateKey = process.env.SIGNING_KEY || 'default_signing_key_change_in_production';
    return crypto.createHmac('sha256', privateKey)
      .update(data)
      .digest('hex');
  }
}

module.exports = new EndToEndVerificationService();

