const pool = require('../config/database');
const crypto = require('crypto');

// Helper function to generate hash
function generateHash(previousHash, data, timestamp) {
  const dataString = JSON.stringify(data);
  const combined = (previousHash || '0') + dataString + timestamp;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

// Generate random Aadhaar number
function generateAadhaar() {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

// Generate biometric hash
function generateBiometricHash() {
  return crypto.randomBytes(32).toString('hex');
}

async function seedDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log('🌱 Starting database seeding...\n');

    // Clear existing data
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE votes');
    await connection.query('TRUNCATE TABLE candidate_manifestos');
    await connection.query('TRUNCATE TABLE candidates');
    await connection.query('TRUNCATE TABLE duplicate_checks');
    await connection.query('TRUNCATE TABLE audit_logs');
    await connection.query('TRUNCATE TABLE death_records');
    await connection.query('TRUNCATE TABLE voters');
    await connection.query('TRUNCATE TABLE elections');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Seed Voters (20 voters)
    const voters = [];
    const voterNames = [
      'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh',
      'Anjali Mehta', 'Rahul Gupta', 'Kavita Nair', 'Suresh Iyer', 'Meera Joshi',
      'Arjun Desai', 'Divya Rao', 'Karan Malhotra', 'Pooja Shah', 'Nikhil Agarwal',
      'Riya Kapoor', 'Aditya Verma', 'Shreya Menon', 'Rohan Bhatia', 'Neha Chawla'
    ];

    for (let i = 0; i < 20; i++) {
      const dob = new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const aadhaar = generateAadhaar();
      const biometricHash = generateBiometricHash();
      
      const [result] = await connection.query(
        'INSERT INTO voters (name, dob, aadhaar_number, biometric_hash, is_verified) VALUES (?, ?, ?, ?, ?)',
        [voterNames[i], dob.toISOString().split('T')[0], aadhaar, biometricHash, Math.random() > 0.3]
      );
      voters.push({ voter_id: result.insertId, aadhaar_number: aadhaar });
    }
    console.log('✅ Seeded 20 voters');

    // Seed Elections (2 elections)
    const elections = [];
    const electionTitles = ['2024 General Election', '2024 State Assembly Election'];
    
    for (let i = 0; i < 2; i++) {
      const startDate = new Date(2024, 5 + i, 1);
      const endDate = new Date(2024, 5 + i, 2);
      const status = i === 0 ? 'completed' : 'active';
      
      const [result] = await connection.query(
        'INSERT INTO elections (title, start_date, end_date, status) VALUES (?, ?, ?, ?)',
        [electionTitles[i], startDate, endDate, status]
      );
      elections.push({ election_id: result.insertId, status });
    }
    console.log('✅ Seeded 2 elections');

    // Seed Candidates (5 per election)
    const candidates = [];
    const candidateNames = [
      ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown'],
      ['David Lee', 'Emma Wilson', 'Frank Miller', 'Grace Davis', 'Henry Taylor']
    ];

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 5; j++) {
        const manifesto = `I promise to work for the betterment of our constituency. My focus areas include education, healthcare, infrastructure, and employment generation.`;
        
        const [result] = await connection.query(
          'INSERT INTO candidates (election_id, name, manifesto) VALUES (?, ?, ?)',
          [elections[i].election_id, candidateNames[i][j], manifesto]
        );
        candidates.push({ candidate_id: result.insertId, election_id: elections[i].election_id });
        
        // Add manifesto version
        await connection.query(
          'INSERT INTO candidate_manifestos (candidate_id, manifesto_text, version) VALUES (?, ?, ?)',
          [result.insertId, manifesto, 1]
        );
      }
    }
    console.log('✅ Seeded 10 candidates (5 per election)');

    // Seed Votes (50 votes with hash-chain)
    let previousVoteHash = null;
    const electionCandidates = {};
    candidates.forEach(c => {
      if (!electionCandidates[c.election_id]) {
        electionCandidates[c.election_id] = [];
      }
      electionCandidates[c.election_id].push(c.candidate_id);
    });

    for (let i = 0; i < 50; i++) {
      const voter = voters[Math.floor(Math.random() * voters.length)];
      const election = elections[Math.floor(Math.random() * elections.length)];
      const candidateIds = electionCandidates[election.election_id];
      const candidate = candidateIds[Math.floor(Math.random() * candidateIds.length)];
      
      // Check if voter already voted in this election
      const [existing] = await connection.query(
        'SELECT vote_id FROM votes WHERE voter_id = ? AND election_id = ?',
        [voter.voter_id, election.election_id]
      );

      if (existing.length === 0) {
        const timestamp = new Date();
        const voteData = {
          voter_id: voter.voter_id,
          candidate_id: candidate,
          election_id: election.election_id,
          timestamp: timestamp.toISOString()
        };
        const currentHash = generateHash(previousVoteHash, voteData, timestamp.toISOString());
        
        await connection.query(
          'INSERT INTO votes (voter_id, candidate_id, election_id, timestamp, previous_hash, current_hash) VALUES (?, ?, ?, ?, ?, ?)',
          [voter.voter_id, candidate, election.election_id, timestamp, previousVoteHash, currentHash]
        );
        
        previousVoteHash = currentHash;
      }
    }
    console.log('✅ Seeded 50 votes with hash-chain');

    // Seed Death Records (5 records)
    const deadAadhaars = [];
    for (let i = 0; i < 5; i++) {
      const aadhaar = generateAadhaar();
      const deathDate = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      
      await connection.query(
        'INSERT INTO death_records (aadhaar_number, death_date) VALUES (?, ?)',
        [aadhaar, deathDate.toISOString().split('T')[0]]
      );
      deadAadhaars.push(aadhaar);
    }
    console.log('✅ Seeded 5 death records');

    // Seed Duplicate Checks (3 flags)
    for (let i = 0; i < 3; i++) {
      const voter1 = voters[Math.floor(Math.random() * voters.length)];
      let voter2 = voters[Math.floor(Math.random() * voters.length)];
      while (voter2.voter_id === voter1.voter_id) {
        voter2 = voters[Math.floor(Math.random() * voters.length)];
      }
      const similarity = 85 + Math.random() * 10;
      const resolved = Math.random() > 0.5;
      
      await connection.query(
        'INSERT INTO duplicate_checks (voter_id_1, voter_id_2, similarity_score, resolved, resolved_at) VALUES (?, ?, ?, ?, ?)',
        [
          voter1.voter_id,
          voter2.voter_id,
          similarity.toFixed(2),
          resolved,
          resolved ? new Date() : null
        ]
      );
    }
    console.log('✅ Seeded 3 duplicate checks');

    // Seed Audit Logs (with hash-chain)
    let previousAuditHash = null;
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'VERIFY', 'VOTE'];
    const entities = ['voter', 'election', 'candidate', 'vote'];

    for (let i = 0; i < 30; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const entity = entities[Math.floor(Math.random() * entities.length)];
      const timestamp = new Date();
      
      const logData = {
        action_type: action,
        entity_type: entity,
        timestamp: timestamp.toISOString()
      };
      const currentHash = generateHash(previousAuditHash, logData, timestamp.toISOString());
      
      await connection.query(
        'INSERT INTO audit_logs (action_type, entity_type, timestamp, previous_hash, current_hash, details) VALUES (?, ?, ?, ?, ?, ?)',
        [
          action,
          entity,
          timestamp,
          previousAuditHash,
          currentHash,
          JSON.stringify({ message: `Sample audit log entry ${i + 1}` })
        ]
      );
      
      previousAuditHash = currentHash;
    }
    console.log('✅ Seeded 30 audit logs with hash-chain');

    await connection.commit();
    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

seedDatabase()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });

