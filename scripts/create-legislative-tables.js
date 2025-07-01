require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createLegislativeTables() {
  try {
    console.log('Creating legislative tables...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'legislative-feed-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    
    console.log('✅ Legislative tables created successfully!');
    
    // Verify tables were created
    const tables = [
      'legislative_sessions',
      'bills', 
      'legislators',
      'roll_calls',
      'individual_votes',
      'bill_sponsors',
      'feed_items',
      'user_legislative_interests'
    ];
    
    console.log('\nVerifying tables:');
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ ${table}: Created (${result.rows[0].count} records)`);
      } catch (error) {
        console.log(`❌ ${table}: Failed to verify`);
      }
    }
    
    console.log('\n🎉 Legislative feed database setup complete!');
    console.log('Next steps:');
    console.log('1. Get your LegiScan API key from https://legiscan.com/legiscan');
    console.log('2. Set up Upstash Redis at https://upstash.com/');
    console.log('3. Add environment variables to .env');
    console.log('4. Visit /legislative to see the feed (requires verified user)');
    
  } catch (error) {
    console.error('❌ Error creating legislative tables:', error);
    console.log('\nIf you see permission errors, make sure your DATABASE_URL user has CREATE permissions.');
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createLegislativeTables();