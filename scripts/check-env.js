// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NEXT_PUBLIC_APP_URL'
]

const optionalEnvVars = [
  'GOOGLE_MAPS_API_KEY',
  'SMTP_PASSWORD',
  'FROM_EMAIL',
  'JUMIO_API_KEY',
  'JUMIO_SECRET',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

function checkEnvironment() {
  console.log('🔍 Checking environment variables...')
  console.log('=====================================')
  
  let hasErrors = false
  
  // Check required variables
  console.log('\n✅ Required Variables:')
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`   ✓ ${varName}: Set`)
      
      // Additional validation
      if (varName === 'DATABASE_URL' && !value.startsWith('postgresql://')) {
        console.log(`   ⚠️  Warning: DATABASE_URL should start with "postgresql://"`)
      }
      
      if (varName === 'JWT_SECRET' && value.length < 32) {
        console.log(`   ⚠️  Warning: JWT_SECRET should be at least 32 characters long`)
      }
      
    } else {
      console.log(`   ❌ ${varName}: Missing`)
      hasErrors = true
    }
  })
  
  // Check optional variables
  console.log('\n📋 Optional Variables:')
  optionalEnvVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`   ✓ ${varName}: Set`)
    } else {
      console.log(`   - ${varName}: Not set`)
    }
  })
  
  // Environment-specific checks
  console.log('\n🌍 Environment:')
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
  
  if (process.env.NODE_ENV === 'production') {
    console.log('\n🔒 Production Environment Checks:')
    
    // Production-specific validations
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.log('   ⚠️  Warning: GOOGLE_MAPS_API_KEY not set (address verification will use mock data)')
    }
    
    if (!process.env.SMTP_PASSWORD) {
      console.log('   ⚠️  Warning: SMTP_PASSWORD not set (email sending disabled)')
    }
    
    if (process.env.MOCK_VERIFICATION === 'true') {
      console.log('   ⚠️  Warning: MOCK_VERIFICATION is enabled in production')
    }
  }
  
  console.log('\n=====================================')
  
  if (hasErrors) {
    console.log('❌ Environment check failed. Please set missing required variables.')
    console.log('\nSee .env.example for reference.')
    process.exit(1)
  } else {
    console.log('✅ Environment check passed!')
  }
}

// Database connection test
async function testDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not set, skipping database test')
    return
  }
  
  try {
    console.log('\n🗄️ Testing database connection...')
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })
    
    await client.connect()
    const result = await client.query('SELECT NOW()')
    await client.end()
    
    console.log('✅ Database connection successful')
    console.log(`   Connected at: ${result.rows[0].now}`)
  } catch (error) {
    console.log('❌ Database connection failed:')
    console.log(`   Error: ${error.message}`)
    process.exit(1)
  }
}

async function main() {
  checkEnvironment()
  await testDatabaseConnection()
  
  console.log('\n🚀 Environment is ready for Citizenly!')
  console.log('\nNext steps:')
  console.log('  1. Run: npm run db:setup')
  console.log('  2. Run: npm run dev')
  console.log('  3. Open: http://localhost:3000')
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { checkEnvironment, testDatabaseConnection }
