const pool = require('../config/database');

/**
 * Seed 1000 Polling Stations across India
 * Includes major districts from all states with realistic coordinates
 */

// Major districts with their approximate coordinates (lat, lng)
const districts = [
  // West Bengal
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, pinStart: 700000 },
  { name: 'Salt Lake', state: 'West Bengal', lat: 22.5900, lng: 88.4100, pinStart: 700091 },
  { name: 'Howrah', state: 'West Bengal', lat: 22.5958, lng: 88.2636, pinStart: 711100 },
  { name: 'Durgapur', state: 'West Bengal', lat: 23.5204, lng: 87.3119, pinStart: 713200 },
  { name: 'Siliguri', state: 'West Bengal', lat: 26.7271, lng: 88.3953, pinStart: 734000 },
  
  // Uttar Pradesh
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, pinStart: 226000 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319, pinStart: 208000 },
  { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081, pinStart: 282000 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739, pinStart: 221000 },
  { name: 'Allahabad', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463, pinStart: 211000 },
  { name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064, pinStart: 250000 },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lng: 77.4538, pinStart: 201000 },
  { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910, pinStart: 201300 },
  
  // Maharashtra
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, pinStart: 400000 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, pinStart: 411000 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, pinStart: 440000 },
  { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898, pinStart: 422000 },
  { name: 'Aurangabad', state: 'Maharashtra', lat: 19.8762, lng: 75.3433, pinStart: 431000 },
  { name: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781, pinStart: 400600 },
  
  // Delhi
  { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, pinStart: 110000 },
  { name: 'Central Delhi', state: 'Delhi', lat: 28.6517, lng: 77.2219, pinStart: 110001 },
  { name: 'North Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025, pinStart: 110006 },
  { name: 'South Delhi', state: 'Delhi', lat: 28.5245, lng: 77.1855, pinStart: 110017 },
  { name: 'East Delhi', state: 'Delhi', lat: 28.6448, lng: 77.3107, pinStart: 110092 },
  { name: 'West Delhi', state: 'Delhi', lat: 28.6562, lng: 77.1009, pinStart: 110018 },
  
  // Karnataka
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946, pinStart: 560000 },
  { name: 'Mysore', state: 'Karnataka', lat: 12.2958, lng: 76.6394, pinStart: 570000 },
  { name: 'Hubli', state: 'Karnataka', lat: 15.3647, lng: 75.1240, pinStart: 580020 },
  { name: 'Mangalore', state: 'Karnataka', lat: 12.9141, lng: 74.8560, pinStart: 575001 },
  
  // Tamil Nadu
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, pinStart: 600000 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, pinStart: 641000 },
  { name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198, pinStart: 625000 },
  { name: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.1460, pinStart: 636000 },
  
  // Gujarat
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, pinStart: 380000 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311, pinStart: 395000 },
  { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812, pinStart: 390000 },
  { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022, pinStart: 360000 },
  
  // Rajasthan
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, pinStart: 302000 },
  { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243, pinStart: 342000 },
  { name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125, pinStart: 313000 },
  { name: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648, pinStart: 324000 },
  
  // Bihar
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376, pinStart: 800000 },
  { name: 'Gaya', state: 'Bihar', lat: 24.7955, lng: 84.9994, pinStart: 823000 },
  { name: 'Muzaffarpur', state: 'Bihar', lat: 26.1209, lng: 85.3647, pinStart: 842000 },
  
  // Madhya Pradesh
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, pinStart: 462000 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, pinStart: 452000 },
  { name: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828, pinStart: 474000 },
  
  // Punjab
  { name: 'Chandigarh', state: 'Punjab', lat: 30.7333, lng: 76.7794, pinStart: 160000 },
  { name: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723, pinStart: 143000 },
  { name: 'Ludhiana', state: 'Punjab', lat: 30.9010, lng: 75.8573, pinStart: 141000 },
  
  // Haryana
  { name: 'Gurgaon', state: 'Haryana', lat: 28.4089, lng: 77.0378, pinStart: 122000 },
  { name: 'Faridabad', state: 'Haryana', lat: 28.4089, lng: 77.3178, pinStart: 121000 },
  { name: 'Panipat', state: 'Haryana', lat: 29.3909, lng: 76.9635, pinStart: 132100 },
  
  // Kerala
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673, pinStart: 682000 },
  { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366, pinStart: 695000 },
  { name: 'Kozhikode', state: 'Kerala', lat: 11.2588, lng: 75.7804, pinStart: 673000 },
  
  // Andhra Pradesh
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, pinStart: 500000 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480, pinStart: 520000 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185, pinStart: 530000 },
  
  // Odisha
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245, pinStart: 751000 },
  { name: 'Cuttack', state: 'Odisha', lat: 20.4625, lng: 85.8830, pinStart: 753000 },
  
  // Assam
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362, pinStart: 781000 },
  { name: 'Silchar', state: 'Assam', lat: 24.8333, lng: 92.7789, pinStart: 788000 },
  
  // Jharkhand
  { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096, pinStart: 834000 },
  { name: 'Jamshedpur', state: 'Jharkhand', lat: 22.8046, lng: 86.2029, pinStart: 831000 },
  
  // Chhattisgarh
  { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296, pinStart: 492000 },
  { name: 'Bilaspur', state: 'Chhattisgarh', lat: 22.0796, lng: 82.1391, pinStart: 495000 },
  
  // Uttarakhand
  { name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322, pinStart: 248000 },
  { name: 'Haridwar', state: 'Uttarakhand', lat: 29.9457, lng: 78.1642, pinStart: 249400 },
  
  // Himachal Pradesh
  { name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734, pinStart: 171000 },
  { name: 'Dharamshala', state: 'Himachal Pradesh', lat: 32.2190, lng: 76.3234, pinStart: 176200 },
  
  // Jammu and Kashmir
  { name: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lng: 74.7973, pinStart: 190000 },
  { name: 'Jammu', state: 'Jammu and Kashmir', lat: 32.7266, lng: 74.8570, pinStart: 180001 },
  
  // Goa
  { name: 'Panaji', state: 'Goa', lat: 15.4909, lng: 73.8278, pinStart: 403000 },
  { name: 'Margao', state: 'Goa', lat: 15.2733, lng: 73.9579, pinStart: 403600 },
  
  // Tripura
  { name: 'Agartala', state: 'Tripura', lat: 23.8315, lng: 91.2868, pinStart: 799000 },
  
  // Manipur
  { name: 'Imphal', state: 'Manipur', lat: 24.8170, lng: 93.9368, pinStart: 795000 },
  
  // Meghalaya
  { name: 'Shillong', state: 'Meghalaya', lat: 25.5788, lng: 91.8933, pinStart: 793000 },
  
  // Nagaland
  { name: 'Kohima', state: 'Nagaland', lat: 25.6750, lng: 94.1106, pinStart: 797000 },
  
  // Mizoram
  { name: 'Aizawl', state: 'Mizoram', lat: 23.7271, lng: 92.7176, pinStart: 796000 },
  
  // Arunachal Pradesh
  { name: 'Itanagar', state: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053, pinStart: 791100 },
  
  // Sikkim
  { name: 'Gangtok', state: 'Sikkim', lat: 27.3389, lng: 88.6065, pinStart: 737100 },
  
  // Telangana
  { name: 'Warangal', state: 'Telangana', lat: 17.9689, lng: 79.5941, pinStart: 506000 },
  { name: 'Karimnagar', state: 'Telangana', lat: 18.4386, lng: 79.1288, pinStart: 505000 },
];

// Generate station names
const stationNamePrefixes = [
  'Primary School', 'High School', 'Government School', 'Municipal School',
  'Community Hall', 'Panchayat Bhavan', 'Town Hall', 'Public Library',
  'Government College', 'Polytechnic College', 'Community Center', 'Auditorium',
  'Sports Complex', 'Stadium', 'Exhibition Ground', 'Park',
  'Temple Premises', 'Gurudwara', 'Church', 'Mosque',
  'Government Office', 'Block Office', 'Tehsil Office', 'Court Complex'
];

async function seedPollingStations() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🗳️  Starting to seed 1000 polling stations...\n');
    
    await connection.beginTransaction();
    
    let stationCount = 0;
    const stationsPerDistrict = Math.ceil(1000 / districts.length);
    
    for (const district of districts) {
      const stationsToCreate = Math.min(stationsPerDistrict, 1000 - stationCount);
      
      for (let i = 0; i < stationsToCreate && stationCount < 1000; i++) {
        const prefix = stationNamePrefixes[Math.floor(Math.random() * stationNamePrefixes.length)];
        const stationNumber = i + 1;
        const stationCode = `${district.name.substring(0, 3).toUpperCase()}${String(stationNumber).padStart(3, '0')}`;
        const stationName = `${prefix} ${stationNumber}, ${district.name}`;
        
        // Generate address
        const streetNumber = Math.floor(Math.random() * 200) + 1;
        const streetNames = ['Main Road', 'MG Road', 'Station Road', 'Market Street', 'Park Street', 'Church Road', 'Temple Street', 'College Road'];
        const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
        const address = `${streetNumber}, ${streetName}, ${district.name}, ${district.state}`;
        
        // Generate PIN code (base + variation)
        const pinCode = String(district.pinStart + i).padStart(6, '0');
        
        // Generate coordinates with slight variation (within ~5km radius)
        const latVariation = (Math.random() - 0.5) * 0.1; // ~5.5km variation
        const lngVariation = (Math.random() - 0.5) * 0.1;
        const latitude = district.lat + latVariation;
        const longitude = district.lng + lngVariation;
        
        // Capacity between 500-2000 voters
        const capacity = Math.floor(Math.random() * 1500) + 500;
        
        try {
          await connection.query(
            `INSERT INTO polling_stations 
             (station_code, station_name, address, district, state, pin_code, capacity, latitude, longitude) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             station_name = VALUES(station_name),
             address = VALUES(address),
             capacity = VALUES(capacity),
             latitude = VALUES(latitude),
             longitude = VALUES(longitude)`,
            [
              stationCode,
              stationName,
              address,
              district.name,
              district.state,
              pinCode,
              capacity,
              latitude,
              longitude
            ]
          );
          
          stationCount++;
          if (stationCount % 100 === 0) {
            console.log(`   ✓ Seeded ${stationCount} polling stations...`);
          }
        } catch (err) {
          console.error(`   ✗ Error seeding station ${stationCode}:`, err.message);
        }
      }
    }
    
    await connection.commit();
    console.log(`\n✅ Successfully seeded ${stationCount} polling stations across ${districts.length} districts!\n`);
    
    // Print summary
    const [summary] = await connection.query(
      `SELECT state, COUNT(*) as count 
       FROM polling_stations 
       GROUP BY state 
       ORDER BY count DESC`
    );
    
    console.log('📊 Polling Stations by State:');
    summary.forEach(row => {
      console.log(`   ${row.state}: ${row.count} stations`);
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error seeding polling stations:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedPollingStations()
    .then(() => {
      console.log('✅ Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedPollingStations };

