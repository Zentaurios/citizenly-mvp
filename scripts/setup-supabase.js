const fs = require('fs')
const path = require('path')

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '../.env') })

function setupSupabase() {
  console.log('🔧 Setting up Supabase for Citizenly MVP')
  console.log('=========================================')
  
  // Check if Supabase environment variables are set
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'DATABASE_URL']
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.log('❌ Missing required Supabase environment variables:')
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`)
    })
    console.log('')
    console.log('📋 Setup Instructions:')
    console.log('1. Go to https://supabase.com')
    console.log('2. Create a new project: "citizenly-mvp"')
    console.log('3. Go to Settings → API')
    console.log('4. Copy the following to your .env file:')
    console.log('   - Project URL → SUPABASE_URL')
    console.log('   - anon public key → SUPABASE_ANON_KEY')
    console.log('   - service_role secret key → SUPABASE_SERVICE_ROLE_KEY')
    console.log('5. Go to Settings → Database')
    console.log('   - Copy Connection string → DATABASE_URL')
    console.log('')
    console.log('💡 See .env.supabase.example for the complete template')
    process.exit(1)
  }
  
  console.log('✅ Supabase environment variables found')
  
  // Check if supabase schema exists
  const schemaPath = path.join(__dirname, '../database/supabase-schema.sql')
  if (!fs.existsSync(schemaPath)) {
    console.log('❌ Supabase schema file not found')
    console.log('Expected: database/supabase-schema.sql')
    process.exit(1)
  }
  
  console.log('✅ Supabase schema file found')
  console.log('')
  console.log('🗄️ Next Steps:')
  console.log('1. Run: npm run db:migrate:supabase')
  console.log('2. In Supabase Dashboard → SQL Editor:')
  console.log('   - Create new query')
  console.log('   - Paste contents of database/supabase-schema.sql')
  console.log('   - Click "Run" to execute')
  console.log('3. Run: npm run db:seed')
  console.log('4. Run: npm run dev')
  console.log('')
  console.log('🔒 Security Setup:')
  console.log('1. Enable RLS on all tables (done automatically by schema)')
  console.log('2. Configure Auth settings in Supabase Dashboard')
  console.log('3. Set up email templates for verification')
  console.log('')
  
  // Show example .env content
  console.log('📝 Your .env should look like:')
  console.log(`SUPABASE_URL="${process.env.SUPABASE_URL || 'https://your-project.supabase.co'}"`)
  console.log(`SUPABASE_ANON_KEY="${process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'your-anon-key'}"`)
  console.log(`DATABASE_URL="${process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^@]*@/, ':***@') : 'postgresql://postgres:***@host:5432/postgres'}"`)
  console.log('')
  
  // Check authentication strategy
  const authStrategy = process.env.AUTH_STRATEGY || 'custom'
  console.log('🔐 Authentication Strategy:')
  if (authStrategy === 'supabase') {
    console.log('✅ Using Supabase Auth (recommended)')
    console.log('   - Built-in user management')
    console.log('   - Email verification')
    console.log('   - Password reset')
    console.log('   - Social auth ready')
  } else {
    console.log('⚠️ Using Custom Auth')
    console.log('   - More control, more code to maintain')
    console.log('   - Consider switching to AUTH_STRATEGY="supabase"')
  }
  
  console.log('')
  console.log('🎯 Ready for Supabase! Run the migration next.')
}

if (require.main === module) {
  setupSupabase()
}

module.exports = setupSupabase
