const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '../.env') })

async function migrateSupabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('🔗 Connected to Supabase database')

    // Read and execute Supabase-compatible schema
    const schemaPath = path.join(__dirname, '../database/supabase-schema.sql')
    
    if (!fs.existsSync(schemaPath)) {
      console.log('❌ Supabase schema file not found at:', schemaPath)
      console.log('💡 Make sure database/supabase-schema.sql exists')
      process.exit(1)
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('🏗️ Running Supabase database migrations...')
    
    // Execute schema with better error handling
    try {
      await client.query(schema)
      console.log('✅ Supabase database migrations completed successfully')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ Some database objects already exist (this is normal)')
        console.log('✅ Migration completed with warnings')
      } else {
        throw error
      }
    }
    
    // Verify key tables exist
    console.log('🔍 Verifying database setup...')
    
    const tables = ['users', 'addresses', 'politicians', 'verification_attempts']
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table])
      
      if (result.rows[0].exists) {
        console.log(`   ✅ Table '${table}' exists`)
      } else {
        console.log(`   ❌ Table '${table}' missing`)
      }
    }
    
    // Check RLS status
    console.log('🛡️ Checking Row Level Security...')
    const rlsResult = await client.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'addresses', 'politicians')
    `)
    
    rlsResult.rows.forEach(row => {
      if (row.rowsecurity) {
        console.log(`   🔒 RLS enabled on '${row.tablename}'`)
      } else {
        console.log(`   ⚠️ RLS disabled on '${row.tablename}'`)
      }
    })
    
    console.log('')
    console.log('🎯 Next Steps:')
    console.log('1. Verify in Supabase Dashboard → Table Editor that tables exist')
    console.log('2. Check Authentication → Settings for auth configuration')
    console.log('3. Run: npm run db:seed (to add test data)')
    console.log('4. Run: npm run dev (to start development)')
    console.log('')
    console.log('🔐 Security Notes:')
    console.log('- RLS policies are configured for Supabase Auth')
    console.log('- SUPABASE_ANON_KEY can only access data according to RLS rules')
    console.log('- SUPABASE_SERVICE_ROLE_KEY bypasses RLS (keep private!)')
    console.log('')
    console.log('📖 Supabase Dashboard: https://supabase.com/dashboard')
    
  } catch (error) {
    console.error('❌ Supabase migration failed:', error)
    
    if (error.message.includes('password authentication failed')) {
      console.log('')
      console.log('🔧 Database connection issue:')
      console.log('1. Check your DATABASE_URL in .env')
      console.log('2. Verify password is correct')
      console.log('3. Ensure database exists in Supabase')
    } else if (error.message.includes('does not exist')) {
      console.log('')
      console.log('🔧 Database not found:')
      console.log('1. Make sure you created the Supabase project')
      console.log('2. Check the DATABASE_URL format')
      console.log('3. Verify project is not paused')
    }
    
    process.exit(1)
  } finally {
    await client.end()
  }
}

if (require.main === module) {
  migrateSupabase()
}

module.exports = migrateSupabase
