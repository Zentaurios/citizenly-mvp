require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createPollingTables() {
  try {
    console.log('Creating polling system tables...\n');
    
    // Read the polling schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'polling-schema.sql');
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
          } else if (statement.toLowerCase().includes('create index')) {
            const indexName = statement.match(/create index (\w+)/i)?.[1];
            console.log(`✅ Created index: ${indexName}`);
          } else if (statement.toLowerCase().includes('create trigger')) {
            const triggerName = statement.match(/create trigger (\w+)/i)?.[1];
            console.log(`✅ Created trigger: ${triggerName}`);
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
    const tables = ['polls', 'poll_responses', 'sample_comments'];
    
    console.log('\n📊 Verifying polling tables:');
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ ${table}: Ready (${result.rows[0].count} records)`);
      } catch (error) {
        console.log(`❌ ${table}: Not accessible - ${error.message}`);
      }
    }
    
    console.log('\n🎉 Polling system database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Add test politicians to the database');
    console.log('2. Create sample polls');
    console.log('3. Test the polling interface');
    
  } catch (error) {
    console.error('❌ Error creating polling tables:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createPollingTables();