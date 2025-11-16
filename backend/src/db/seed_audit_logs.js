const pool = require('../config/database');
const { generateHash, getLastAuditHash } = require('../utils/hashChain');

/**
 * Seed Audit Logs Data
 * Creates sample audit logs for various actions
 */

async function seedAuditLogs() {
  const connection = await pool.getConnection();
  
  try {
    console.log('📋 Starting to seed audit logs...\n');
    
    await connection.beginTransaction();
    
    // Get some voters and elections for references
    const [voters] = await connection.query('SELECT voter_id FROM voters LIMIT 20');
    const [elections] = await connection.query('SELECT election_id FROM elections LIMIT 5');
    const [users] = await connection.query('SELECT user_id FROM users WHERE role != "citizen" LIMIT 10');
    
    const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'READ', 'VERIFY', 'APPROVE', 'REJECT'];
    const entityTypes = ['voter', 'election', 'candidate', 'vote', 'grievance', 'application', 'document'];
    
    let previousHash = await getLastAuditHash(connection);
    let count = 0;
    const daysAgo = 30; // Generate logs for past 30 days
    
    for (let day = daysAgo; day >= 0; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      // Generate 5-15 logs per day
      const logsPerDay = Math.floor(Math.random() * 11) + 5;
      
      for (let i = 0; i < logsPerDay; i++) {
        const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
        const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
        
        let entityId = null;
        let voterId = null;
        
        if (entityType === 'voter' && voters.length > 0) {
          const voter = voters[Math.floor(Math.random() * voters.length)];
          entityId = voter.voter_id;
          voterId = voter.voter_id;
        } else if (entityType === 'election' && elections.length > 0) {
          const election = elections[Math.floor(Math.random() * elections.length)];
          entityId = election.election_id;
        } else {
          entityId = Math.floor(Math.random() * 1000) + 1;
        }
        
        const timestamp = new Date(date);
        timestamp.setHours(Math.floor(Math.random() * 24));
        timestamp.setMinutes(Math.floor(Math.random() * 60));
        
        const logData = {
          action_type: actionType,
          entity_type: entityType,
          timestamp: timestamp.toISOString(),
          entity_id: entityId
        };
        
        const currentHash = generateHash(previousHash, logData, timestamp.toISOString());
        
        const metadata = JSON.stringify({
          ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
          user_agent: 'Mozilla/5.0',
          session_id: `session_${Math.random().toString(36).substring(7)}`
        });
        
        try {
          await connection.query(
            `INSERT INTO audit_logs 
             (action_type, entity_type, entity_id, voter_id, timestamp, previous_hash, current_hash, details) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              actionType,
              entityType,
              entityId,
              voterId,
              timestamp,
              previousHash,
              currentHash,
              metadata
            ]
          );
          
          previousHash = currentHash;
          count++;
          
          if (count % 50 === 0) {
            console.log(`   ✓ Seeded ${count} audit logs...`);
          }
        } catch (err) {
          console.error(`   ✗ Error seeding audit log:`, err.message);
        }
      }
    }
    
    await connection.commit();
    console.log(`\n✅ Successfully seeded ${count} audit logs!\n`);
    
    // Print summary
    const [summary] = await connection.query(
      `SELECT action_type, COUNT(*) as count 
       FROM audit_logs 
       GROUP BY action_type 
       ORDER BY count DESC`
    );
    
    console.log('📊 Audit Logs by Action Type:');
    summary.forEach(row => {
      console.log(`   ${row.action_type}: ${row.count} logs`);
    });
    
    const [entitySummary] = await connection.query(
      `SELECT entity_type, COUNT(*) as count 
       FROM audit_logs 
       GROUP BY entity_type 
       ORDER BY count DESC`
    );
    
    console.log('\n📊 Audit Logs by Entity Type:');
    entitySummary.forEach(row => {
      console.log(`   ${row.entity_type}: ${row.count} logs`);
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error seeding audit logs:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedAuditLogs()
    .then(() => {
      console.log('✅ Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedAuditLogs };

