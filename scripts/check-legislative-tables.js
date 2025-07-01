require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkLegislativeTables() {
  try {
    console.log('Checking for legislative tables...');
    
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
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ ${table}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`❌ ${table}: Table does not exist`);
        console.log(`   Error: ${error.message}`);
      }
    }
    
    console.log('\nTo create the legislative tables, run:');
    console.log('psql $DATABASE_URL -f database/legislative-feed-schema.sql');
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkLegislativeTables();