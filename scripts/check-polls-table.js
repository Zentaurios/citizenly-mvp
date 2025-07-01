require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkPollsTable() {
  try {
    // Get table columns
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'polls'
      ORDER BY ordinal_position
    `);

    console.log('Polls table structure:');
    console.log('======================');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

  } catch (error) {
    console.error('Error checking polls table:', error);
  } finally {
    await pool.end();
  }
}

checkPollsTable();