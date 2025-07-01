require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? 'YES' : 'NO');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testAuth() {
  try {
    console.log('Testing authentication system...\n');
    
    // Check if users table exists and has data
    try {
      const usersResult = await pool.query('SELECT email, role, verification_status, is_active FROM users LIMIT 5');
      console.log('✅ Users table exists');
      console.log(`📊 Found ${usersResult.rows.length} users:`);
      usersResult.rows.forEach(user => {
        console.log(`   • ${user.email} (${user.role}) - ${user.verification_status} - ${user.is_active ? 'active' : 'inactive'}`);
      });
    } catch (error) {
      console.log('❌ Users table error:', error.message);
      console.log('Full error:', error);
    }
    
    // Check available test credentials
    console.log('\n🔑 Available test credentials:');
    console.log('   • admin@citizenly.com / admin123');
    console.log('   • citizen@test.com / password123'); 
    console.log('   • politician@test.com / password123');
    
    // Check if any test users exist in database
    const testEmails = ['admin@citizenly.com', 'citizen@test.com', 'politician@test.com'];
    for (const email of testEmails) {
      try {
        const result = await pool.query('SELECT email, role, verification_status FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          console.log(`✅ ${email} exists in database (${user.role}, ${user.verification_status})`);
        } else {
          console.log(`❌ ${email} not found in database`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${email}:`, error.message);
      }
    }
    
    console.log('\n💡 To fix login issues:');
    console.log('1. Make sure users exist in database');
    console.log('2. Check DATABASE_URL connection');
    console.log('3. Use correct test credentials');
    console.log('4. Check browser console for errors');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testAuth();