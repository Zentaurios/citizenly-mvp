const { Client } = require('pg')

async function reset() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('🗄️ Connected to database')

    console.log('🔄 Dropping all tables...')
    // Drop all tables in the correct order (reverse of dependencies)
    const dropQueries = [
      'DROP TABLE IF EXISTS poll_responses CASCADE',
      'DROP TABLE IF EXISTS polls CASCADE', 
      'DROP TABLE IF EXISTS audit_logs CASCADE',
      'DROP TABLE IF EXISTS sessions CASCADE',
      'DROP TABLE IF EXISTS verification_attempts CASCADE',
      'DROP TABLE IF EXISTS politicians CASCADE',
      'DROP TABLE IF EXISTS addresses CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
      'DROP VIEW IF EXISTS verified_citizens CASCADE',
      'DROP VIEW IF EXISTS verified_politicians CASCADE',
      'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE'
    ]

    for (const query of dropQueries) {
      try {
        await client.query(query)
      } catch (error) {
        // Ignore errors for tables that don't exist
        console.log(`Note: ${query.split(' ')[4]} might not exist (this is fine)`)
      }
    }
    
    console.log('✅ All tables dropped successfully')
    console.log('🔄 Database reset complete - ready for fresh migration')
    
  } catch (error) {
    console.error('❌ Reset failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

if (require.main === module) {
  reset()
}

module.exports = reset
