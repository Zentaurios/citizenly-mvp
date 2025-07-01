const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('Connected to database')

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../database/schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('Running database migrations...')
    await client.query(schema)
    
    console.log('✅ Database migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

if (require.main === module) {
  migrate()
}

module.exports = migrate
