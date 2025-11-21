const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voting_system'
};

async function fixGenderEnum() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🔄 Fixing gender ENUM to include transgender...\n');

    // Check current column definition
    const [columnInfo] = await connection.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'voters' 
      AND COLUMN_NAME = 'gender'
    `, [dbConfig.database]);

    if (columnInfo.length === 0) {
      console.log('❌ Gender column not found. Creating it...');
      await connection.query(`
        ALTER TABLE voters 
        ADD COLUMN gender ENUM('male', 'female', 'transgender', 'other') AFTER dob
      `);
      console.log('✅ Gender column created with correct ENUM values');
    } else {
      const currentType = columnInfo[0].COLUMN_TYPE;
      console.log(`Current gender column type: ${currentType}`);

      // Check if transgender is already in the ENUM
      if (currentType.includes('transgender')) {
        console.log('✅ Gender ENUM already includes transgender');
      } else {
        console.log('🔄 Updating gender ENUM to include transgender...');
        
        // MySQL doesn't support direct ENUM modification, so we need to:
        // 1. Add a temporary column
        // 2. Copy data
        // 3. Drop old column
        // 4. Rename new column
        
        // Step 1: Add temporary column
        await connection.query(`
          ALTER TABLE voters 
          ADD COLUMN gender_temp ENUM('male', 'female', 'transgender', 'other') AFTER gender
        `);
        
        // Step 2: Copy data with mapping
        await connection.query(`
          UPDATE voters 
          SET gender_temp = CASE 
            WHEN gender = 'male' THEN 'male'
            WHEN gender = 'female' THEN 'female'
            WHEN gender = 'other' THEN 'other'
            ELSE 'other'
          END
        `);
        
        // Step 3: Drop old column
        await connection.query(`
          ALTER TABLE voters 
          DROP COLUMN gender
        `);
        
        // Step 4: Rename new column
        await connection.query(`
          ALTER TABLE voters 
          CHANGE COLUMN gender_temp gender ENUM('male', 'female', 'transgender', 'other')
        `);
        
        console.log('✅ Gender ENUM updated successfully');
      }
    }

    console.log('\n✅ Gender ENUM fix completed!');
  } catch (error) {
    console.error('❌ Error fixing gender ENUM:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixGenderEnum()
    .then(() => {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { fixGenderEnum };

