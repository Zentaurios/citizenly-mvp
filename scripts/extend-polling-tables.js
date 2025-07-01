require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function extendPollingTables() {
  try {
    console.log('Extending existing polling tables for MVP functionality...\n');
    
    // Add columns to polls table that we need for the MVP
    const pollsExtensions = [
      // Context fields
      `ALTER TABLE polls ADD COLUMN IF NOT EXISTS context_type VARCHAR(20) DEFAULT 'general' CHECK (context_type IN ('bill', 'vote', 'appointment', 'general'))`,
      `ALTER TABLE polls ADD COLUMN IF NOT EXISTS context_bill_id INTEGER REFERENCES bills(bill_id)`,
      `ALTER TABLE polls ADD COLUMN IF NOT EXISTS context_custom_text TEXT`,
      `ALTER TABLE polls ADD COLUMN IF NOT EXISTS question TEXT`, // Detailed question beyond title
      
      // Status management 
      `ALTER TABLE polls ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft'))`,
      
      // Better targeting
      `ALTER TABLE polls ADD COLUMN IF NOT EXISTS target_districts TEXT[]`,
      `ALTER TABLE polls ADD COLUMN IF NOT EXISTS target_level VARCHAR(10) DEFAULT 'state' CHECK (target_level IN ('federal', 'state', 'local'))`
    ];
    
    for (const sql of pollsExtensions) {
      try {
        await pool.query(sql);
        console.log('✅ Extended polls table structure');
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.log(`⚠️  Extension note: ${error.message.substring(0, 50)}...`);
        }
      }
    }
    
    // Add columns to poll_responses table
    const responsesExtensions = [
      // Demographics for analytics
      `ALTER TABLE poll_responses ADD COLUMN IF NOT EXISTS user_age_group VARCHAR(10)`,
      `ALTER TABLE poll_responses ADD COLUMN IF NOT EXISTS user_district VARCHAR(20)`,
      `ALTER TABLE poll_responses ADD COLUMN IF NOT EXISTS user_zip_code VARCHAR(10)`,
      `ALTER TABLE poll_responses ADD COLUMN IF NOT EXISTS response_hash VARCHAR(64)`,
      
      // Simple response field for approve/disapprove polls
      `ALTER TABLE poll_responses ADD COLUMN IF NOT EXISTS simple_response VARCHAR(20) CHECK (simple_response IN ('approve', 'disapprove', 'no_opinion'))`
    ];
    
    for (const sql of responsesExtensions) {
      try {
        await pool.query(sql);
        console.log('✅ Extended poll_responses table structure');
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.log(`⚠️  Extension note: ${error.message.substring(0, 50)}...`);
        }
      }
    }
    
    // Create indexes for new columns
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_polls_context_bill ON polls(context_bill_id)`,
      `CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status)`,
      `CREATE INDEX IF NOT EXISTS idx_polls_target_districts ON polls USING GIN(target_districts)`,
      `CREATE INDEX IF NOT EXISTS idx_responses_simple_response ON poll_responses(simple_response)`,
      `CREATE INDEX IF NOT EXISTS idx_responses_demographics ON poll_responses(user_age_group, user_district)`
    ];
    
    for (const sql of indexQueries) {
      try {
        await pool.query(sql);
        console.log('✅ Created/verified indexes');
      } catch (error) {
        console.log(`⚠️  Index note: ${error.message.substring(0, 50)}...`);
      }
    }
    
    // Update existing polls to have default values
    await pool.query(`
      UPDATE polls 
      SET 
        context_type = 'general',
        status = 'active',
        target_level = 'state',
        target_districts = ARRAY['3'] -- Default to district 3 for existing polls
      WHERE context_type IS NULL OR status IS NULL
    `);
    
    console.log('✅ Updated existing polls with default values');
    
    // Verify final structure
    console.log('\n📊 Verifying extended tables:');
    const tableChecks = [
      { table: 'polls', column: 'context_type' },
      { table: 'polls', column: 'target_districts' },
      { table: 'poll_responses', column: 'simple_response' },
      { table: 'sample_comments', column: 'comment_text' }
    ];
    
    for (const check of tableChecks) {
      try {
        const result = await pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        `, [check.table, check.column]);
        
        if (result.rows.length > 0) {
          console.log(`✅ ${check.table}.${check.column}: Available`);
        } else {
          console.log(`❌ ${check.table}.${check.column}: Missing`);
        }
      } catch (error) {
        console.log(`❌ ${check.table}.${check.column}: Error - ${error.message}`);
      }
    }
    
    console.log('\n🎉 Polling system extension complete!');
    console.log('\nThe existing polls table structure has been enhanced with:');
    console.log('• Context linking to bills/votes');
    console.log('• District targeting');
    console.log('• Status management');
    console.log('• Demographics collection');
    console.log('\nNow ready to create poll API routes and components!');
    
  } catch (error) {
    console.error('❌ Error extending polling tables:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

extendPollingTables();