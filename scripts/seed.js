const { Client } = require('pg')
const bcrypt = require('bcryptjs')

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('Connected to database for seeding')

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 12)
    const testPassword = await bcrypt.hash('password123', 12)

    // Clear existing test data
    console.log('Clearing existing test data...')
    await client.query('DELETE FROM users WHERE email IN ($1, $2)', [
      'admin@citizenly.com',
      'citizen@test.com'
    ])

    // Insert admin user
    console.log('Creating admin user...')
    const adminResult = await client.query(`
      INSERT INTO users (
        email, first_name, last_name, date_of_birth, password_hash, 
        role, verification_status, email_verified, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      'admin@citizenly.com',
      'Admin',
      'User',
      '1980-01-01',
      adminPassword,
      'admin',
      'verified',
      true,
      true
    ])

    // Insert test citizen
    console.log('Creating test citizen...')
    const citizenResult = await client.query(`
      INSERT INTO users (
        email, first_name, last_name, date_of_birth, password_hash,
        role, verification_status, email_verified, is_active,
        interests, notification_preferences
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      'citizen@test.com',
      'Test',
      'Citizen',
      '1990-05-15',
      testPassword,
      'citizen',
      'verified',
      true,
      true,
      JSON.stringify(['Economy', 'Infrastructure', 'Education']),
      JSON.stringify({ email: true, sms: false, push: true })
    ])

    const citizenId = citizenResult.rows[0].id

    // Insert test address for citizen
    console.log('Creating test address...')
    await client.query(`
      INSERT INTO addresses (
        user_id, street_address, city, state, zip_code,
        latitude, longitude, congressional_district, 
        state_senate_district, state_house_district, county,
        timezone, is_primary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      citizenId,
      '123 Test Street',
      'Las Vegas',
      'NV',
      '89123',
      36.1699, // Las Vegas coordinates
      -115.1398,
      '3',
      '9',
      '21',
      'Clark',
      'America/Los_Angeles',
      true
    ])

    // Insert test politician
    console.log('Creating test politician...')
    const politicianResult = await client.query(`
      INSERT INTO users (
        email, first_name, last_name, date_of_birth, password_hash,
        role, verification_status, email_verified, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      'politician@test.com',
      'Test',
      'Representative',
      '1975-03-20',
      testPassword,
      'politician',
      'verified',
      true,
      true
    ])

    const politicianUserId = politicianResult.rows[0].id

    // Insert politician profile
    await client.query(`
      INSERT INTO politicians (
        user_id, office_level, office_title, district, state,
        party, term_start, term_end, website, is_verified, premium_access
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      politicianUserId,
      'city',
      'City Council Member',
      'Ward 1',
      'NV',
      'Independent',
      '2022-01-01',
      '2026-01-01',
      'https://example.com',
      true,
      false
    ])

    // Insert politician address
    await client.query(`
      INSERT INTO addresses (
        user_id, street_address, city, state, zip_code,
        latitude, longitude, congressional_district,
        county, is_primary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      politicianUserId,
      '456 Government Ave',
      'Las Vegas',
      'NV',
      '89101',
      36.1716,
      -115.1391,
      '3',
      'Clark',
      true
    ])

    // Insert sample poll
    console.log('Creating sample poll...')
    const politicianRecord = await client.query(`
      SELECT id FROM politicians WHERE user_id = $1
    `, [politicianUserId])

    const politicianId = politicianRecord.rows[0].id

    await client.query(`
      INSERT INTO polls (
        politician_id, title, description, poll_type, options,
        start_date, end_date, is_active, target_constituency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      politicianId,
      'Community Infrastructure Priorities',
      'Which infrastructure projects should be prioritized in our community for the next fiscal year?',
      'multiple_choice',
      JSON.stringify({
        options: [
          'Road repairs and maintenance',
          'Public transportation improvements',
          'Park and recreation facilities',
          'Water and sewer system upgrades',
          'Internet infrastructure'
        ]
      }),
      new Date(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      true,
      'district'
    ])

    // Create some audit log entries
    console.log('Creating audit log entries...')
    await client.query(`
      INSERT INTO audit_logs (user_id, action, resource_type, details)
      VALUES 
        ($1, 'user_registered', 'user', '{"email": "citizen@test.com", "role": "citizen"}'),
        ($2, 'user_registered', 'user', '{"email": "politician@test.com", "role": "politician"}'),
        ($3, 'poll_created', 'poll', '{"title": "Community Infrastructure Priorities"}')
    `, [citizenId, politicianUserId, politicianUserId])

    console.log('✅ Database seeded successfully')
    console.log('')
    console.log('Test Accounts Created:')
    console.log('📧 Admin: admin@citizenly.com / admin123')
    console.log('👤 Citizen: citizen@test.com / password123')
    console.log('🏛️ Politician: politician@test.com / password123')
    console.log('')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

if (require.main === module) {
  seed()
}

module.exports = seed
