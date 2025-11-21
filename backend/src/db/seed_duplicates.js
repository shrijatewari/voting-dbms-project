/**
 * Seed Duplicate Checks for Testing
 * Creates realistic duplicate voter scenarios
 */

const pool = require('../config/database');

async function seedDuplicates() {
  const connection = await pool.getConnection();
  try {
    console.log('🔍 Seeding duplicate checks...\n');

    // Get existing voters
    const [voters] = await connection.query(
      'SELECT voter_id, name, aadhaar_number, dob, district, state FROM voters LIMIT 100'
    );

    if (voters.length < 2) {
      console.log('⚠️  Need at least 2 voters to create duplicates. Please seed voters first.');
      return;
    }

    console.log(`Found ${voters.length} voters. Creating duplicate checks...\n`);

    // Check existing duplicates
    const [existing] = await connection.query('SELECT COUNT(*) as count FROM duplicate_checks');
    const existingCount = existing[0].count;

    // Always create at least 10 duplicates for testing
    const targetCount = 20;
    const duplicatesToCreate = Math.max(10, targetCount - existingCount);
    console.log(`Found ${existingCount} existing duplicates. Creating ${duplicatesToCreate} more...\n`);

    let created = 0;

    // Create various types of duplicates
    // Use different voter pairs to avoid duplicates
    const usedPairs = new Set();
    
    for (let i = 0; i < duplicatesToCreate && i < voters.length * 2; i++) {
      // Pick random voters
      let idx1 = Math.floor(Math.random() * voters.length);
      let idx2 = Math.floor(Math.random() * voters.length);
      
      // Ensure different voters
      while (idx2 === idx1) {
        idx2 = Math.floor(Math.random() * voters.length);
      }
      
      const pairKey = `${Math.min(idx1, idx2)}-${Math.max(idx1, idx2)}`;
      if (usedPairs.has(pairKey)) {
        continue; // Skip if pair already used
      }
      usedPairs.add(pairKey);
      
      const voter1 = voters[idx1];
      const voter2 = voters[idx2];

      // Create different similarity scores
      const similarityScores = [85, 88, 90, 92, 95, 87, 89, 91, 93, 86];
      const similarity = similarityScores[i % similarityScores.length] + (Math.random() * 2 - 1);

      // Some resolved, some not
      const resolved = i % 3 === 0;
      const resolvedAt = resolved ? new Date() : null;

      // Determine confidence based on similarity
      let confidence = 'medium';
      if (similarity >= 95) confidence = 'very_high';
      else if (similarity >= 90) confidence = 'high';
      else if (similarity >= 85) confidence = 'medium';
      else confidence = 'low';

      try {
        // Check if duplicate already exists
        const [existing] = await connection.query(
          `SELECT check_id FROM duplicate_checks 
           WHERE (voter_id_1 = ? AND voter_id_2 = ?) OR (voter_id_1 = ? AND voter_id_2 = ?)`,
          [voter1.voter_id, voter2.voter_id, voter2.voter_id, voter1.voter_id]
        );

        if (existing.length === 0) {
          await connection.query(
            `INSERT INTO duplicate_checks 
             (voter_id_1, voter_id_2, similarity_score, resolved, resolved_at, confidence, match_fields, district, state) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              voter1.voter_id,
              voter2.voter_id,
              similarity.toFixed(2),
              resolved,
              resolvedAt,
              confidence,
              JSON.stringify(['name', 'dob', 'district']),
              voter1.district || voter2.district || 'Unknown',
              voter1.state || voter2.state || 'Unknown'
            ]
          );
          created++;
          console.log(`✅ Created duplicate: ${voter1.name} ↔ ${voter2.name} (${similarity.toFixed(2)}% similarity, ${confidence})`);
        }
      } catch (error) {
        // Skip if column doesn't exist (confidence, match_fields might not be in all schemas)
        if (error.code === 'ER_BAD_FIELD_ERROR') {
          try {
            await connection.query(
              `INSERT INTO duplicate_checks 
               (voter_id_1, voter_id_2, similarity_score, resolved, resolved_at) 
               VALUES (?, ?, ?, ?, ?)`,
              [
                voter1.voter_id,
                voter2.voter_id,
                similarity.toFixed(2),
                resolved,
                resolvedAt
              ]
            );
            created++;
            console.log(`✅ Created duplicate: ${voter1.name} ↔ ${voter2.name} (${similarity.toFixed(2)}% similarity)`);
          } catch (err2) {
            console.warn(`⚠️  Skipped duplicate for ${voter1.name}: ${err2.message}`);
          }
        } else {
          console.warn(`⚠️  Error creating duplicate: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ Created ${created} duplicate checks`);
    console.log(`📊 Total duplicates in database: ${existingCount + created}`);

  } catch (error) {
    console.error('❌ Error seeding duplicates:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedDuplicates()
    .then(() => {
      console.log('\n🎉 Duplicate seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDuplicates;

