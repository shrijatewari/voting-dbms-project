const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voting_system'
};

function generateAadhaar() {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

function generateBiometricHash() {
  return require('crypto').randomBytes(32).toString('hex');
}

function generateEPIC() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let epic = '';
  for (let i = 0; i < 10; i++) {
    epic += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return epic;
}

function generateMobile() {
  return '9' + Math.floor(100000000 + Math.random() * 900000000).toString();
}

const voterNames = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh',
  'Anjali Mehta', 'Rahul Gupta', 'Kavita Nair', 'Suresh Iyer', 'Meera Joshi',
  'Arjun Desai', 'Divya Rao', 'Karan Malhotra', 'Pooja Shah', 'Nikhil Agarwal',
  'Riya Kapoor', 'Aditya Verma', 'Shreya Menon', 'Rohan Bhatia', 'Neha Chawla',
  'Vikram Mehta', 'Anita Desai', 'Ravi Kumar', 'Sunita Patel', 'Manoj Singh',
  'Kavita Reddy', 'Rajesh Iyer', 'Priya Nair', 'Amit Sharma', 'Sneha Gupta',
  'Vikram Rao', 'Anjali Desai', 'Rahul Mehta', 'Kavita Kumar', 'Suresh Patel',
  'Meera Singh', 'Arjun Reddy', 'Divya Iyer', 'Karan Nair', 'Pooja Sharma',
  'Nikhil Gupta', 'Riya Rao', 'Aditya Desai', 'Shreya Mehta', 'Rohan Kumar',
  'Neha Patel', 'Vikram Singh', 'Anita Reddy', 'Ravi Iyer', 'Sunita Nair'
];

const districts = [
  'New Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
  'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana'
];

const states = [
  'Delhi', 'Maharashtra', 'Karnataka', 'Telangana', 'Tamil Nadu',
  'West Bengal', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Uttar Pradesh',
  'Uttar Pradesh', 'Maharashtra', 'Madhya Pradesh', 'Maharashtra', 'Madhya Pradesh',
  'Andhra Pradesh', 'Bihar', 'Gujarat', 'Uttar Pradesh', 'Punjab'
];

async function seedVoters() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('👥 Seeding voters...\n');
    
    // Check existing voters count
    const [existingCount] = await connection.query('SELECT COUNT(*) as count FROM voters');
    const currentCount = existingCount[0].count;
    
    if (currentCount >= 50) {
      console.log(`✅ Already have ${currentCount} voters. Skipping seed.`);
      console.log('💡 To seed more voters, run this script again or use voter registration.');
      return;
    }
    
    const votersToCreate = 50 - currentCount;
    console.log(`Creating ${votersToCreate} voters...\n`);
    
    let created = 0;
    
    for (let i = 0; i < votersToCreate; i++) {
      const name = voterNames[i % voterNames.length];
      const dob = new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const aadhaar = generateAadhaar();
      const biometricHash = generateBiometricHash();
      const epic = generateEPIC();
      const mobile = generateMobile();
      const email = `voter${i + 1}@example.com`;
      const isVerified = Math.random() > 0.3;
      const district = districts[i % districts.length];
      const state = states[i % states.length];
      
      try {
        await connection.query(
          `INSERT INTO voters 
           (name, dob, aadhaar_number, biometric_hash, email, mobile_number, epic_number, 
            is_verified, district, state, house_number, street, village_city, pin_code) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            name,
            dob.toISOString().split('T')[0],
            aadhaar,
            biometricHash,
            email,
            mobile,
            epic,
            isVerified,
            district,
            state,
            `${Math.floor(Math.random() * 999) + 1}`,
            `Street ${Math.floor(Math.random() * 100) + 1}`,
            `${district} City`,
            `${100000 + Math.floor(Math.random() * 900000)}`
          ]
        );
        created++;
        
        if (created % 10 === 0) {
          console.log(`✅ Created ${created} voters...`);
        }
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⏭️  Skipped duplicate: ${name}`);
        } else {
          console.error(`❌ Error creating voter ${name}:`, err.message);
        }
      }
    }
    
    console.log(`\n🎉 Successfully created ${created} voters!\n`);
    
    // Show summary
    const [summary] = await connection.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN is_verified = 0 THEN 1 ELSE 0 END) as pending
       FROM voters`
    );
    
    console.log('📊 Voter Summary:');
    console.log(`   Total Voters: ${summary[0].total}`);
    console.log(`   Verified: ${summary[0].verified}`);
    console.log(`   Pending: ${summary[0].pending}`);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    await connection.end();
    throw error;
  }
}

seedVoters()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });


