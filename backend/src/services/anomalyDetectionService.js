const pool = require('../config/database');

/**
 * Enhanced Anomaly Detection Service
 * Detects various anomalies in the voting system:
 * - Duplicate voters
 * - Suspicious voting patterns
 * - Data integrity issues
 * - Temporal anomalies
 */
class AnomalyDetectionService {
  /**
   * Detect duplicate voters based on multiple criteria
   */
  async detectDuplicateVoters() {
    const connection = await pool.getConnection();
    try {
      // Check for duplicate Aadhaar numbers (should be impossible due to UNIQUE constraint, but check anyway)
      const [aadhaarDups] = await connection.query(
        `SELECT aadhaar_number, COUNT(*) as count 
         FROM voters 
         GROUP BY aadhaar_number 
         HAVING count > 1`
      );

      // Check for similar names and DOB
      const [nameDobDups] = await connection.query(
        `SELECT v1.voter_id as id1, v2.voter_id as id2, v1.name, v1.dob
         FROM voters v1
         JOIN voters v2 ON v1.voter_id < v2.voter_id
         WHERE LOWER(v1.name) = LOWER(v2.name) 
         AND v1.dob = v2.dob`
      );

      // Check for identical biometric hashes
      const [biometricDups] = await connection.query(
        `SELECT biometric_hash, COUNT(*) as count, GROUP_CONCAT(voter_id) as voter_ids
         FROM voters 
         GROUP BY biometric_hash 
         HAVING count > 1`
      );

      return {
        aadhaar_duplicates: aadhaarDups.length,
        name_dob_duplicates: nameDobDups.length,
        biometric_duplicates: biometricDups.length,
        details: {
          aadhaar: aadhaarDups,
          name_dob: nameDobDups,
          biometric: biometricDups
        }
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Detect suspicious voting patterns
   */
  async detectSuspiciousVotingPatterns() {
    const connection = await pool.getConnection();
    try {
      // Votes cast in rapid succession (potential bot/automation)
      const [rapidVotes] = await connection.query(
        `SELECT v1.vote_id, v1.voter_id, v1.timestamp, v2.vote_id as next_vote_id, v2.timestamp as next_timestamp,
         TIMESTAMPDIFF(SECOND, v1.timestamp, v2.timestamp) as seconds_diff
         FROM votes v1
         JOIN votes v2 ON v1.vote_id < v2.vote_id
         WHERE v1.election_id = v2.election_id
         AND TIMESTAMPDIFF(SECOND, v1.timestamp, v2.timestamp) < 5
         ORDER BY v1.timestamp DESC
         LIMIT 10`
      );

      // Votes from unverified voters
      const [unverifiedVotes] = await connection.query(
        `SELECT v.vote_id, v.voter_id, vo.name, vo.is_verified, v.timestamp
         FROM votes v
         JOIN voters vo ON v.voter_id = vo.voter_id
         WHERE vo.is_verified = FALSE
         ORDER BY v.timestamp DESC`
      );

      // Votes cast outside election time window
      const [outOfWindowVotes] = await connection.query(
        `SELECT v.vote_id, v.election_id, v.timestamp, e.start_date, e.end_date
         FROM votes v
         JOIN elections e ON v.election_id = e.election_id
         WHERE v.timestamp < e.start_date OR v.timestamp > e.end_date`
      );

      return {
        rapid_votes: rapidVotes.length,
        unverified_votes: unverifiedVotes.length,
        out_of_window_votes: outOfWindowVotes.length,
        details: {
          rapid: rapidVotes,
          unverified: unverifiedVotes,
          out_of_window: outOfWindowVotes
        }
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Detect data integrity anomalies
   */
  async detectDataIntegrityIssues() {
    const connection = await pool.getConnection();
    try {
      // Votes with broken hash chain
      const [brokenChain] = await connection.query(
        `SELECT v1.vote_id, v1.current_hash, v2.previous_hash, v2.vote_id as next_vote_id
         FROM votes v1
         JOIN votes v2 ON v1.vote_id + 1 = v2.vote_id
         WHERE v2.previous_hash != v1.current_hash`
      );

      // Audit logs with broken hash chain
      const [brokenAuditChain] = await connection.query(
        `SELECT a1.log_id, a1.current_hash, a2.previous_hash, a2.log_id as next_log_id
         FROM audit_logs a1
         JOIN audit_logs a2 ON a1.log_id + 1 = a2.log_id
         WHERE a2.previous_hash != a1.current_hash`
      );

      // Orphaned records (votes without valid voter/election/candidate)
      const [orphanedVotes] = await connection.query(
        `SELECT v.vote_id, v.voter_id, v.election_id, v.candidate_id
         FROM votes v
         LEFT JOIN voters vo ON v.voter_id = vo.voter_id
         LEFT JOIN elections e ON v.election_id = e.election_id
         LEFT JOIN candidates c ON v.candidate_id = c.candidate_id
         WHERE vo.voter_id IS NULL OR e.election_id IS NULL OR c.candidate_id IS NULL`
      );

      // Voters who voted but are marked as deceased
      const [deceasedVotes] = await connection.query(
        `SELECT v.vote_id, v.voter_id, vo.aadhaar_number, dr.death_date, v.timestamp
         FROM votes v
         JOIN voters vo ON v.voter_id = vo.voter_id
         JOIN death_records dr ON vo.aadhaar_number = dr.aadhaar_number
         WHERE v.timestamp > dr.death_date`
      );

      return {
        broken_vote_chain: brokenChain.length,
        broken_audit_chain: brokenAuditChain.length,
        orphaned_votes: orphanedVotes.length,
        deceased_votes: deceasedVotes.length,
        details: {
          vote_chain: brokenChain,
          audit_chain: brokenAuditChain,
          orphaned: orphanedVotes,
          deceased: deceasedVotes
        }
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Detect temporal anomalies (unusual timing patterns)
   */
  async detectTemporalAnomalies() {
    const connection = await pool.getConnection();
    try {
      // Votes cast at unusual hours (outside 6 AM - 10 PM)
      const [unusualHours] = await connection.query(
        `SELECT vote_id, voter_id, election_id, HOUR(timestamp) as vote_hour, timestamp
         FROM votes
         WHERE HOUR(timestamp) < 6 OR HOUR(timestamp) > 22
         ORDER BY timestamp DESC`
      );

      // Elections with no votes (potential issue)
      const [noVoteElections] = await connection.query(
        `SELECT e.election_id, e.title, e.start_date, e.end_date, COUNT(v.vote_id) as vote_count
         FROM elections e
         LEFT JOIN votes v ON e.election_id = v.election_id
         GROUP BY e.election_id
         HAVING vote_count = 0`
      );

      // Candidates with no votes
      const [noVoteCandidates] = await connection.query(
        `SELECT c.candidate_id, c.name, c.election_id, COUNT(v.vote_id) as vote_count
         FROM candidates c
         LEFT JOIN votes v ON c.candidate_id = v.candidate_id
         GROUP BY c.candidate_id
         HAVING vote_count = 0`
      );

      return {
        unusual_hour_votes: unusualHours.length,
        elections_with_no_votes: noVoteElections.length,
        candidates_with_no_votes: noVoteCandidates.length,
        details: {
          unusual_hours: unusualHours,
          no_vote_elections: noVoteElections,
          no_vote_candidates: noVoteCandidates
        }
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Comprehensive anomaly detection - runs all checks
   */
  async runFullAnomalyDetection() {
    try {
      const [duplicates, votingPatterns, integrityIssues, temporalAnomalies] = await Promise.all([
        this.detectDuplicateVoters(),
        this.detectSuspiciousVotingPatterns(),
        this.detectDataIntegrityIssues(),
        this.detectTemporalAnomalies()
      ]);

      const totalAnomalies = 
        duplicates.aadhaar_duplicates +
        duplicates.name_dob_duplicates +
        duplicates.biometric_duplicates +
        votingPatterns.rapid_votes +
        votingPatterns.unverified_votes +
        votingPatterns.out_of_window_votes +
        integrityIssues.broken_vote_chain +
        integrityIssues.broken_audit_chain +
        integrityIssues.orphaned_votes +
        integrityIssues.deceased_votes +
        temporalAnomalies.unusual_hour_votes +
        temporalAnomalies.elections_with_no_votes +
        temporalAnomalies.candidates_with_no_votes;

      return {
        summary: {
          total_anomalies: totalAnomalies,
          severity: totalAnomalies === 0 ? 'none' : 
                   totalAnomalies < 5 ? 'low' :
                   totalAnomalies < 20 ? 'medium' : 'high'
        },
        duplicates,
        voting_patterns: votingPatterns,
        integrity_issues: integrityIssues,
        temporal_anomalies: temporalAnomalies,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Anomaly detection failed: ' + error.message);
    }
  }

  /**
   * Get anomaly statistics
   */
  async getAnomalyStats() {
    const connection = await pool.getConnection();
    try {
      const [stats] = await connection.query(
        `SELECT 
          (SELECT COUNT(*) FROM duplicate_checks WHERE resolved = FALSE) as unresolved_duplicates,
          (SELECT COUNT(*) FROM votes v JOIN voters vo ON v.voter_id = vo.voter_id WHERE vo.is_verified = FALSE) as unverified_votes,
          (SELECT COUNT(*) FROM votes v JOIN voters vo ON v.voter_id = vo.voter_id JOIN death_records dr ON vo.aadhaar_number = dr.aadhaar_number WHERE v.timestamp > dr.death_date) as deceased_votes,
          (SELECT COUNT(*) FROM votes WHERE timestamp < DATE_SUB(NOW(), INTERVAL 1 DAY)) as old_votes`
      );

      return stats[0];
    } finally {
      connection.release();
    }
  }
}

module.exports = new AnomalyDetectionService();

