const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voting_system'
};

// Indian political party names and candidate names
const partyNames = [
  'Bharatiya Janata Party',
  'Indian National Congress',
  'Aam Aadmi Party',
  'Shiv Sena',
  'Nationalist Congress Party',
  'Trinamool Congress',
  'Dravida Munnetra Kazhagam',
  'All India Anna Dravida Munnetra Kazhagam',
  'Telugu Desam Party',
  'Yuvajana Sramika Rythu Congress Party',
  'Janata Dal (United)',
  'Rashtriya Janata Dal',
  'Samajwadi Party',
  'Bahujan Samaj Party',
  'Communist Party of India (Marxist)',
  'Independent'
];

const candidateNames = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Devi', 'Vikram Singh',
  'Anjali Reddy', 'Mohammed Ali', 'Kavita Nair', 'Ramesh Iyer', 'Deepa Menon',
  'Suresh Yadav', 'Meera Joshi', 'Arjun Desai', 'Lakshmi Rao', 'Nitin Shah',
  'Pooja Gupta', 'Ravi Verma', 'Shanti Kumari', 'Kiran Mehta', 'Ajay Malhotra',
  'Neha Agarwal', 'Manoj Tiwari', 'Sarika Pandey', 'Rohit Chaturvedi', 'Divya Nair',
  'Siddharth Rao', 'Anita Deshmukh', 'Prakash Kumar', 'Rekha Iyer', 'Vijay Malhotra'
];

const manifestos = [
  'I promise to work for the betterment of our constituency. My focus areas include education, healthcare, infrastructure, and employment generation.',
  'My vision is to create a transparent and accountable governance system. I will prioritize women empowerment, youth development, and digital infrastructure.',
  'I commit to improving public services, ensuring clean water supply, better roads, and quality education for all children in our constituency.',
  'My agenda includes affordable housing, healthcare facilities, skill development programs, and support for farmers and small businesses.',
  'I will work towards sustainable development, environmental protection, renewable energy, and creating job opportunities for the youth.',
  'My priorities are social justice, equality, and inclusive growth. I will ensure that all communities receive fair representation and opportunities.',
  'I promise to focus on infrastructure development, improving connectivity, and bringing industries to create employment opportunities.',
  'My commitment is to ensure transparent governance, fight corruption, and work for the welfare of the common people.',
  'I will prioritize education reforms, healthcare accessibility, and support for marginalized communities.',
  'My vision includes digital transformation, e-governance, and making government services accessible to all citizens.'
];

async function seedElectionsWithCandidates() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🗳️  Seeding elections with candidates...\n');
    
    // Get all elections
    const [elections] = await connection.query('SELECT election_id, title, status FROM elections ORDER BY election_id');
    
    if (elections.length === 0) {
      console.log('⚠️  No elections found. Please run seed:elections first.');
      return;
    }
    
    console.log(`Found ${elections.length} elections. Adding candidates...\n`);
    
    let totalCandidates = 0;
    
    for (const election of elections) {
      // Check if candidates already exist for this election
      const [existingCandidates] = await connection.query(
        'SELECT COUNT(*) as count FROM candidates WHERE election_id = ?',
        [election.election_id]
      );
      
      if (existingCandidates[0].count > 0) {
        console.log(`⏭️  Skipping ${election.title} - already has ${existingCandidates[0].count} candidates`);
        continue;
      }
      
      // Determine number of candidates based on election type
      let numCandidates = 5; // Default
      if (election.title.includes('Lok Sabha') || election.title.includes('General')) {
        numCandidates = 8;
      } else if (election.title.includes('State Assembly')) {
        numCandidates = 6;
      } else if (election.title.includes('Municipal') || election.title.includes('Corporation')) {
        numCandidates = 5;
      } else if (election.title.includes('Panchayat') || election.title.includes('Zilla')) {
        numCandidates = 4;
      }
      
      const candidatesForElection = [];
      
      for (let i = 0; i < numCandidates; i++) {
        const candidateName = candidateNames[(election.election_id * numCandidates + i) % candidateNames.length];
        const party = partyNames[i % partyNames.length];
        const manifesto = manifestos[i % manifestos.length];
        
        // Create candidate name with party affiliation
        const fullName = `${candidateName} (${party})`;
        
        const [result] = await connection.query(
          'INSERT INTO candidates (election_id, name, manifesto) VALUES (?, ?, ?)',
          [election.election_id, fullName, manifesto]
        );
        
        candidatesForElection.push(result.insertId);
        totalCandidates++;
        
        // Also add to manifestos table
        await connection.query(
          'INSERT INTO candidate_manifestos (candidate_id, manifesto_text, version) VALUES (?, ?, ?)',
          [result.insertId, manifesto, 1]
        );
      }
      
      console.log(`✅ Added ${numCandidates} candidates to: ${election.title}`);
    }
    
    console.log(`\n🎉 Successfully added ${totalCandidates} candidates across ${elections.length} elections!\n`);
    
    // Show summary
    const [summary] = await connection.query(
      `SELECT e.title, COUNT(c.candidate_id) as candidate_count 
       FROM elections e 
       LEFT JOIN candidates c ON e.election_id = c.election_id 
       GROUP BY e.election_id, e.title 
       ORDER BY candidate_count DESC`
    );
    
    console.log('📊 Candidates per Election:');
    summary.forEach((row) => {
      console.log(`   ${row.title}: ${row.candidate_count} candidates`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    await connection.end();
    throw error;
  }
}

seedElectionsWithCandidates()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });


