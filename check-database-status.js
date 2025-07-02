// check-database-status.js
// Check what legislative data exists in the database

require('dotenv').config();
const { Pool } = require('pg');

async function checkDatabaseStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📊 Checking legislative database status...\n');

    // Check table counts
    const tables = ['feed_items', 'bills', 'legislators', 'legislative_sessions', 'roll_calls'];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        console.log(`${table}: ${count} records`);
      } catch (error) {
        console.log(`${table}: ❌ Table doesn't exist or error: ${error.message}`);
      }
    }

    // Check recent feed items
    try {
      const recentFeed = await pool.query(`
        SELECT type, title, action_date, created_at 
        FROM feed_items 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      if (recentFeed.rows.length > 0) {
        console.log('\n📰 Recent feed items:');
        recentFeed.rows.forEach(item => {
          console.log(`  ${item.action_date} - ${item.type}: ${item.title}`);
        });
      } else {
        console.log('\n📰 No feed items found');
      }
    } catch (error) {
      console.log('\n📰 Could not check feed items:', error.message);
    }

    // Check recent bills
    try {
      const recentBills = await pool.query(`
        SELECT bill_number, title, last_action_date, updated_at 
        FROM bills 
        ORDER BY updated_at DESC 
        LIMIT 3
      `);
      
      if (recentBills.rows.length > 0) {
        console.log('\n📋 Recent bills:');
        recentBills.rows.forEach(bill => {
          console.log(`  ${bill.bill_number}: ${bill.title}`);
        });
      } else {
        console.log('\n📋 No bills found');
      }
    } catch (error) {
      console.log('\n📋 Could not check bills:', error.message);
    }

    // Check active sessions
    try {
      const sessions = await pool.query(`
        SELECT session_id, session_name, year_start, active 
        FROM legislative_sessions 
        WHERE state = 'NV' 
        ORDER BY year_start DESC 
        LIMIT 3
      `);
      
      if (sessions.rows.length > 0) {
        console.log('\n🏛️  Nevada sessions:');
        sessions.rows.forEach(session => {
          console.log(`  ${session.session_name} (${session.year_start}) - ${session.active ? 'Active' : 'Inactive'}`);
        });
      } else {
        console.log('\n🏛️  No sessions found');
      }
    } catch (error) {
      console.log('\n🏛️  Could not check sessions:', error.message);
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseStatus();