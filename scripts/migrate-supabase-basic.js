const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '../.env') })

async function migrateSupabaseBasic() {
  console.log('🔧 Setting up Citizenly Database with Supabase')
  console.log('=============================================')

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
    // Read the basic schema
    const schemaPath = path.join(__dirname, '../database/supabase-schema-basic.sql')
    
    if (!fs.existsSync(schemaPath)) {
      console.log('❌ Basic schema file not found at:', schemaPath)
      process.exit(1)
    }

    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('🏗️ Creating database tables and policies...')
    
    // Execute the schema using Supabase client
    const { data, error } = await supabase.rpc('exec_sql', { sql: schema })
    
    if (error) {
      console.log('⚠️ Some operations might need manual setup in Supabase Dashboard')
      console.log('Error details:', error.message)
      
      // Provide manual setup instructions
      console.log('')
      console.log('📋 Manual Setup Required:')
      console.log('1. Go to Supabase Dashboard → SQL Editor')
      console.log('2. Create a new query')
      console.log('3. Copy and paste the contents of database/supabase-schema-basic.sql')
      console.log('4. Click "Run" to execute the schema')
      console.log('')
      console.log('🔒 Additional Setup for Auth Integration:')
      console.log('1. In Supabase Dashboard → Authentication → Settings')
      console.log('2. Add your site URL: http://localhost:3000')
      console.log('3. Configure email templates if needed')
      console.log('')
      console.log('💡 After manual setup, you can run: npm run db:seed')
      
    } else {
      console.log('✅ Database schema created successfully!')
      console.log('')
      console.log('🎯 Next Steps:')
      console.log('1. Configure Supabase Auth settings (site URL, email templates)')
      console.log('2. Run: npm run db:seed')
      console.log('3. Run: npm run dev')
    }

  } catch (error) {
    console.log('❌ Database setup failed:', error.message)
    console.log('')
    console.log('🛠️ Manual Setup Instructions:')
    console.log('Since automated setup failed, please follow these steps:')
    console.log('')
    console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to SQL Editor')
    console.log('4. Create a new query')
    console.log('5. Copy and paste the entire contents of:')
    console.log('   database/supabase-schema-basic.sql')
    console.log('6. Click "Run" to execute')
    console.log('')
    console.log('7. Then configure Authentication:')
    console.log('   - Go to Authentication → Settings')
    console.log('   - Set Site URL to: http://localhost:3000')
    console.log('   - Configure redirect URLs if needed')
    console.log('')
    console.log('8. After manual setup: npm run dev')
  }
}

if (require.main === module) {
  migrateSupabaseBasic()
}

module.exports = migrateSupabaseBasic
