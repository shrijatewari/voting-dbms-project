const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voting_system'
};

const sampleStations = [
  {
    station_code: 'PS001',
    station_name: 'Government Primary School, Sector 5',
    address: 'Sector 5, Noida, Uttar Pradesh',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    pin_code: '201301',
    latitude: 28.5355,
    longitude: 77.3910,
    capacity: 1500
  },
  {
    station_code: 'PS002',
    station_name: 'Delhi Public School, Sector 12',
    address: 'Sector 12, Noida, Uttar Pradesh',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    pin_code: '201301',
    latitude: 28.5400,
    longitude: 77.3950,
    capacity: 2000
  },
  {
    station_code: 'PS003',
    station_name: 'Community Center, Connaught Place',
    address: 'Connaught Place, New Delhi',
    district: 'New Delhi',
    state: 'Delhi',
    pin_code: '110001',
    latitude: 28.6304,
    longitude: 77.2177,
    capacity: 1800
  },
  {
    station_code: 'PS004',
    station_name: 'Municipal School, Andheri West',
    address: 'Andheri West, Mumbai, Maharashtra',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    pin_code: '400053',
    latitude: 19.1418,
    longitude: 72.8300,
    capacity: 1700
  },
  {
    station_code: 'PS005',
    station_name: 'Government High School, Koramangala',
    address: 'Koramangala, Bangalore, Karnataka',
    district: 'Bangalore Urban',
    state: 'Karnataka',
    pin_code: '560095',
    latitude: 12.9352,
    longitude: 77.6245,
    capacity: 1600
  },
  {
    station_code: 'PS006',
    station_name: 'Public Library, Salt Lake',
    address: 'Salt Lake, Kolkata, West Bengal',
    district: 'Kolkata',
    state: 'West Bengal',
    pin_code: '700064',
    latitude: 22.5726,
    longitude: 88.3639,
    capacity: 1400
  },
  {
    station_code: 'PS007',
    station_name: 'Town Hall, Anna Nagar',
    address: 'Anna Nagar, Chennai, Tamil Nadu',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pin_code: '600040',
    latitude: 13.0827,
    longitude: 80.2707,
    capacity: 1900
  },
  {
    station_code: 'PS008',
    station_name: 'Community Hall, Banjara Hills',
    address: 'Banjara Hills, Hyderabad, Telangana',
    district: 'Hyderabad',
    state: 'Telangana',
    pin_code: '500034',
    latitude: 17.4239,
    longitude: 78.4478,
    capacity: 1650
  }
];

async function seedPollingStations() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🌱 Seeding polling stations...\n');

    for (const station of sampleStations) {
      // Check if station already exists
      const [existing] = await connection.query(
        'SELECT station_id FROM polling_stations WHERE station_code = ?',
        [station.station_code]
      );

      if (existing.length === 0) {
        await connection.query(
          `INSERT INTO polling_stations 
           (station_code, station_name, address, district, state, pin_code, latitude, longitude, capacity) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            station.station_code,
            station.station_name,
            station.address,
            station.district,
            station.state,
            station.pin_code,
            station.latitude,
            station.longitude,
            station.capacity
          ]
        );
        console.log(`✅ Created: ${station.station_name} (${station.district}, ${station.state})`);
      } else {
        console.log(`⏭️  Skipped: ${station.station_name} (already exists)`);
      }
    }

    console.log('\n🎉 Polling stations seeding completed!');
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

