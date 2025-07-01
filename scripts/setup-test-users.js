const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '../.env') })

async function setupTestUsers() {
  console.log('🔧 Setting up test users for Citizenly MVP')
  console.log('==========================================')

  // Create Supabase client using service role key
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase configuration')
    console.log('   Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('🗄️ Setting up database schema first...')
    
    // Read the basic schema
    const schemaPath = path.join(__dirname, '../database/supabase-schema-basic.sql')
    const testUsersPath = path.join(__dirname, '../database/test-users.sql')
    
    if (!fs.existsSync(schemaPath)) {
      console.log('❌ Schema file not found. Please run the schema setup first.')
      console.log('📋 Manual Setup Required:')
      console.log('1. Go to Supabase Dashboard → SQL Editor')
      console.log('2. Copy and paste contents of database/supabase-schema-basic.sql')
      console.log('3. Run the query')
      console.log('4. Then run this script again')
      process.exit(1)
    }

    console.log('👥 Creating test users...')
    
    if (fs.existsSync(testUsersPath)) {
      const testUsersSQL = fs.readFileSync(testUsersPath, 'utf8')
      
      // Execute the test users SQL directly via query
      const { error } = await supabase.rpc('exec', { sql: testUsersSQL })
      
      if (error) {
        console.log('⚠️ Could not create test users automatically')
        console.log('Error:', error.message)
        console.log('')
        console.log('📋 Manual Setup Required:')
        console.log('1. Go to Supabase Dashboard → SQL Editor')
        console.log('2. Copy and paste contents of database/test-users.sql')
        console.log('3. Run the query to create test users')
      } else {
        console.log('✅ Test users created successfully!')
      }
    }

    // Verify users exist
    console.log('🔍 Verifying test users...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email, first_name, last_name, role, verification_status')
      .in('email', ['citizen@user.com', 'politician@user.com', 'admin@user.com'])

    if (usersError) {
      console.log('❌ Could not verify users:', usersError.message)
      console.log('')
      console.log('📋 Manual Setup Required:')
      console.log('1. Go to Supabase Dashboard → SQL Editor')
      console.log('2. Copy and paste contents of database/supabase-schema-basic.sql')
      console.log('3. Copy and paste contents of database/test-users.sql')
      console.log('4. Run both queries')
    } else if (users && users.length > 0) {
      console.log('✅ Test users verified:')
      users.forEach(user => {
        console.log(`   📧 ${user.email} - ${user.role} (${user.verification_status})`)
      })
      console.log('')
      console.log('🎯 Ready to test!')
      console.log('📋 Test Credentials:')
      console.log('   Email: citizen@user.com | Password: password123')
      console.log('   Email: politician@user.com | Password: password123') 
      console.log('   Email: admin@user.com | Password: password123')
      console.log('')
      console.log('🚀 Start the app: npm run dev')
    } else {
      console.log('⚠️ No test users found')
      console.log('📋 Please run the manual setup in Supabase Dashboard')
    }

  } catch (error) {
    console.log('❌ Setup failed:', error.message)
    console.log('')
    console.log('📋 Manual Setup Instructions:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Copy and paste contents of database/supabase-schema-basic.sql')
    console.log('3. Run the schema query')
    console.log('4. Copy and paste contents of database/test-users.sql') 
    console.log('5. Run the test users query')
    console.log('6. Start the app: npm run dev')
  }
}

if (require.main === module) {
  setupTestUsers()
}

module.exports = setupTestUsers
