require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkFunctions() {
  try {
    console.log('Checking database functions...\n');
    
    // Check if update_updated_at_column function exists
    const functionResult = await pool.query(`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname = 'update_updated_at_column'
    `);
    
    if (functionResult.rows.length > 0) {
      console.log('✅ update_updated_at_column function exists');
    } else {
      console.log('❌ update_updated_at_column function does not exist');
      console.log('Creating the function...');
      
      await pool.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);
      
      console.log('✅ update_updated_at_column function created');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkFunctions();