// test-db-connection.js
// Save this file and run: node test-db-connection.js

const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("🔍 Testing database connection...");
    console.log("URL:", process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@'));
    
    const client = await pool.connect();
    console.log("✅ Connection successful!");
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log("✅ Query successful!");
    console.log("Current time:", result.rows[0].current_time);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.log("❌ Connection failed!");
    console.log("Error:", error.message);
    console.log("Code:", error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.log("\n🔧 This means DNS resolution failed.");
      console.log("Possible solutions:");
      console.log("1. Check if your Supabase project is active");
      console.log("2. Verify the connection string in your dashboard");
      console.log("3. Try restarting your Supabase project");
    } else if (error.code === 'ECONNREFUSED') {
      console.log("\n🔧 Connection refused - database might be starting up");
      console.log("Try again in a few minutes");
    } else if (error.message.includes('password')) {
      console.log("\n🔧 Authentication failed");
      console.log("Get a fresh connection string from your Supabase dashboard");
    }
  }
}

testConnection();