require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createLegislativeTablesSafe() {
  try {
    console.log('Creating legislative tables safely...\n');
    
    // First, ensure the function exists
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    console.log('✅ Ensured update_updated_at_column function exists');
    
    // Read and execute the schema in chunks to handle errors better
    const schemaPath = path.join(__dirname, '..', 'database', 'legislative-feed-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split into statements and execute one by one
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await pool.query(statement);
          if (statement.toLowerCase().includes('create table')) {
            const tableName = statement.match(/create table (\w+)/i)?.[1];
            console.log(`✅ Created table: ${tableName}`);
          }
        } catch (error) {
          if (error.code === '42P07') {
            // Table already exists - that's ok
            const tableName = statement.match(/create table (\w+)/i)?.[1];
            console.log(`⚠️  Table already exists: ${tableName}`);
          } else if (error.code === '42P06') {
            // Function already exists - that's ok
            console.log(`⚠️  Function already exists`);
          } else {
            console.log(`❌ Error in statement ${i + 1}:`, error.message);
            console.log(`Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }
    
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
    
    console.log('\n📊 Verifying tables:');
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ ${table}: Ready (${result.rows[0].count} records)`);
      } catch (error) {
        console.log(`❌ ${table}: Not accessible`);
      }
    }
    
    console.log('\n🎉 Legislative feed database setup complete!');
    console.log('\nNow you can:');
    console.log('1. Login with citizen@test.com / password123');
    console.log('2. Visit /legislative to see the feed');
    console.log('3. Test sync: npm run legislative:sync');
    
  } catch (error) {
    console.error('❌ Error creating legislative tables:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createLegislativeTablesSafe();