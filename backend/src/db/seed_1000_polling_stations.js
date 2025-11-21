const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voting_system'
};

// Major cities and regions in India with coordinates
const indianCities = [
  { city: 'Delhi', state: 'Delhi', district: 'New Delhi', lat: 28.6139, lng: 77.2090 },
  { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { city: 'Bangalore', state: 'Karnataka', district: 'Bangalore Urban', lat: 12.9716, lng: 77.5946 },
  { city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { city: 'Kolkata', state: 'West Bengal', district: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { city: 'Pune', state: 'Maharashtra', district: 'Pune', lat: 18.5204, lng: 73.8567 },
  { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { city: 'Jaipur', state: 'Rajasthan', district: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { city: 'Surat', state: 'Gujarat', district: 'Surat', lat: 21.1702, lng: 72.8311 },
  { city: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { city: 'Kanpur', state: 'Uttar Pradesh', district: 'Kanpur Nagar', lat: 26.4499, lng: 80.3319 },
  { city: 'Nagpur', state: 'Maharashtra', district: 'Nagpur', lat: 21.1458, lng: 79.0882 },
  { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore', lat: 22.7196, lng: 75.8577 },
  { city: 'Thane', state: 'Maharashtra', district: 'Thane', lat: 19.2183, lng: 72.9781 },
  { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal', lat: 23.2599, lng: 77.4126 },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', district: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  { city: 'Patna', state: 'Bihar', district: 'Patna', lat: 25.5941, lng: 85.1376 },
  { city: 'Vadodara', state: 'Gujarat', district: 'Vadodara', lat: 22.3072, lng: 73.1812 },
  { city: 'Ghaziabad', state: 'Uttar Pradesh', district: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
  { city: 'Ludhiana', state: 'Punjab', district: 'Ludhiana', lat: 30.9010, lng: 75.8573 },
  { city: 'Agra', state: 'Uttar Pradesh', district: 'Agra', lat: 27.1767, lng: 78.0081 },
  { city: 'Nashik', state: 'Maharashtra', district: 'Nashik', lat: 19.9975, lng: 73.7898 },
  { city: 'Faridabad', state: 'Haryana', district: 'Faridabad', lat: 28.4089, lng: 77.3178 },
  { city: 'Meerut', state: 'Uttar Pradesh', district: 'Meerut', lat: 28.9845, lng: 77.7064 },
  { city: 'Rajkot', state: 'Gujarat', district: 'Rajkot', lat: 22.3039, lng: 70.8022 },
  { city: 'Varanasi', state: 'Uttar Pradesh', district: 'Varanasi', lat: 25.3176, lng: 82.9739 },
  { city: 'Srinagar', state: 'Jammu and Kashmir', district: 'Srinagar', lat: 34.0837, lng: 74.7973 },
  { city: 'Amritsar', state: 'Punjab', district: 'Amritsar', lat: 31.6340, lng: 74.8723 },
  { city: 'Chandigarh', state: 'Chandigarh', district: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { city: 'Coimbatore', state: 'Tamil Nadu', district: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { city: 'Madurai', state: 'Tamil Nadu', district: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { city: 'Guwahati', state: 'Assam', district: 'Kamrup', lat: 26.1445, lng: 91.7362 },
  { city: 'Thiruvananthapuram', state: 'Kerala', district: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
  { city: 'Kochi', state: 'Kerala', district: 'Ernakulam', lat: 9.9312, lng: 76.2673 },
  { city: 'Bhubaneswar', state: 'Odisha', district: 'Khordha', lat: 20.2961, lng: 85.8245 },
  { city: 'Dehradun', state: 'Uttarakhand', district: 'Dehradun', lat: 30.3165, lng: 78.0322 },
  { city: 'Raipur', state: 'Chhattisgarh', district: 'Raipur', lat: 21.2514, lng: 81.6296 },
  { city: 'Jodhpur', state: 'Rajasthan', district: 'Jodhpur', lat: 26.2389, lng: 73.0243 },
  { city: 'Allahabad', state: 'Uttar Pradesh', district: 'Prayagraj', lat: 25.4358, lng: 81.8463 },
  { city: 'Ranchi', state: 'Jharkhand', district: 'Ranchi', lat: 23.3441, lng: 85.3096 },
  { city: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior', lat: 26.2183, lng: 78.1828 },
  { city: 'Vijayawada', state: 'Andhra Pradesh', district: 'Krishna', lat: 16.5062, lng: 80.6480 },
  { city: 'Jamshedpur', state: 'Jharkhand', district: 'East Singhbhum', lat: 22.8046, lng: 86.2029 },
  { city: 'Aurangabad', state: 'Maharashtra', district: 'Aurangabad', lat: 19.8762, lng: 75.3433 },
  { city: 'Salem', state: 'Tamil Nadu', district: 'Salem', lat: 11.6643, lng: 78.1460 },
  { city: 'Tiruchirappalli', state: 'Tamil Nadu', district: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047 },
  { city: 'Mysore', state: 'Karnataka', district: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { city: 'Bareilly', state: 'Uttar Pradesh', district: 'Bareilly', lat: 28.3670, lng: 79.4304 },
  { city: 'Gurgaon', state: 'Haryana', district: 'Gurugram', lat: 28.4089, lng: 77.0378 },
  { city: 'Aligarh', state: 'Uttar Pradesh', district: 'Aligarh', lat: 27.8974, lng: 78.0880 },
  { city: 'Jalandhar', state: 'Punjab', district: 'Jalandhar', lat: 31.3260, lng: 75.5762 },
  { city: 'Tirunelveli', state: 'Tamil Nadu', district: 'Tirunelveli', lat: 8.7139, lng: 77.7567 },
  { city: 'Bhubaneswar', state: 'Odisha', district: 'Khordha', lat: 20.2961, lng: 85.8245 },
  { city: 'Moradabad', state: 'Uttar Pradesh', district: 'Moradabad', lat: 28.8389, lng: 78.7739 },
  { city: 'Kolhapur', state: 'Maharashtra', district: 'Kolhapur', lat: 16.7050, lng: 74.2433 },
  { city: 'Noida', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', lat: 28.5355, lng: 77.3910 },
  { city: 'Greater Noida', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', lat: 28.4744, lng: 77.5040 },
];

// Station types
const stationTypes = [
  'Government Primary School',
  'Government High School',
  'Government College',
  'Community Center',
  'Town Hall',
  'Public Library',
  'Municipal School',
  'Panchayat Office',
  'Government Hospital',
  'Public Park',
  'Community Hall',
  'Village School',
  'Block Development Office',
  'Post Office',
  'Police Station',
  'Fire Station',
  'Anganwadi Center',
  'Primary Health Center',
  'Government Office',
  'Public Auditorium'
];

function generateRandomOffset(baseLat, baseLng, radiusKm = 5) {
  // Generate random offset within radius (in km)
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusKm;
  
  // Convert km to degrees (rough approximation)
  const latOffset = distance / 111.0;
  const lngOffset = distance / (111.0 * Math.cos(baseLat * Math.PI / 180));
  
  return {
    lat: baseLat + (Math.random() - 0.5) * latOffset * 2,
    lng: baseLng + (Math.random() - 0.5) * lngOffset * 2
  };
}

function generatePinCode(district) {
  // Generate realistic pin codes based on region
  const basePins = {
    'Delhi': 110000,
    'Mumbai': 400000,
    'Bangalore': 560000,
    'Hyderabad': 500000,
    'Chennai': 600000,
    'Kolkata': 700000,
    'Pune': 411000,
    'Ahmedabad': 380000,
    'Jaipur': 302000,
    'Lucknow': 226000,
  };
  
  const base = basePins[district] || 100000;
  return base + Math.floor(Math.random() * 999);
}

async function seedPollingStations() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🌱 Seeding 1000 polling stations across India...\n');
    
    let stationCount = 0;
    const stationsPerCity = Math.ceil(1000 / indianCities.length);

    for (const city of indianCities) {
      for (let i = 0; i < stationsPerCity && stationCount < 1000; i++) {
        const stationType = stationTypes[Math.floor(Math.random() * stationTypes.length)];
        const areaName = `Area ${i + 1}`;
        const stationName = `${stationType}, ${areaName}`;
        // Generate unique station code with timestamp to avoid conflicts
        const timestamp = Date.now();
        const stationCode = `PS${String(stationCount + 1).padStart(4, '0')}-${timestamp.toString().slice(-6)}`;
        
        // Generate coordinates with random offset from city center
        const offset = generateRandomOffset(city.lat, city.lng, 10);
        const latitude = parseFloat(offset.lat.toFixed(6));
        const longitude = parseFloat(offset.lng.toFixed(6));
        
        const address = `${areaName}, ${city.city}, ${city.state}`;
        const pinCode = String(generatePinCode(city.city));
        const capacity = Math.floor(Math.random() * 1000) + 1000; // 1000-2000 voters

        // Insert station (ignore duplicates by using INSERT IGNORE or checking)
        try {
          await connection.query(
            `INSERT INTO polling_stations 
             (station_code, station_name, address, district, state, pin_code, latitude, longitude, capacity) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              stationCode,
              stationName,
              address,
              city.district,
              city.state,
              pinCode,
              latitude,
              longitude,
              capacity
            ]
          );
          stationCount++;
          
          if (stationCount % 100 === 0) {
            console.log(`✅ Created ${stationCount} polling stations...`);
          }
        } catch (insertError) {
          // Skip if duplicate or other error, continue with next station
          if (insertError.code !== 'ER_DUP_ENTRY') {
            console.warn(`⚠️  Error inserting station ${stationCode}:`, insertError.message);
          }
        }
      }
    }
    
    console.log(`\n🎉 Successfully seeded ${stationCount} polling stations across India!`);
    
    // Show summary
    const [summary] = await connection.query(
      'SELECT state, COUNT(*) as count FROM polling_stations GROUP BY state ORDER BY count DESC'
    );
    
    console.log('\n📊 Summary by State:');
    summary.forEach((row) => {
      console.log(`   ${row.state}: ${row.count} stations`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    await connection.end();
    throw error;
  }
}

  seedPollingStations()
    .then(() => {
    console.log('\n✅ All done!');
      process.exit(0);
    })
  .catch(error => {
    console.error('Seeding failed:', error);
      process.exit(1);
    });
