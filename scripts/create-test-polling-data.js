require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTestPollingData() {
  try {
    console.log('Creating test politicians and sample polls...\n');
    
    // ============================================================================
    // 1. CREATE TEST POLITICIANS
    // ============================================================================
    
    const testPoliticians = [
      {
        first_name: 'Catherine',
        last_name: 'Cortez Masto',
        title: 'U.S. Senator',
        email: 'test.ccmasto@senate.gov',
        district: 'NV-Statewide',
        level: 'federal',
        party: 'D'
      },
      {
        first_name: 'Jacky',
        last_name: 'Rosen', 
        title: 'U.S. Senator',
        email: 'test.jrosen@senate.gov',
        district: 'NV-Statewide',
        level: 'federal',
        party: 'D'
      },
      {
        first_name: 'Dina',
        last_name: 'Titus',
        title: 'U.S. Representative',
        email: 'test.dtitus@house.gov',
        district: 'NV-1',
        level: 'federal',
        party: 'D'
      },
      {
        first_name: 'Mark',
        last_name: 'Amodei',
        title: 'U.S. Representative', 
        email: 'test.mamodei@house.gov',
        district: 'NV-2',
        level: 'federal',
        party: 'R'
      },
      {
        first_name: 'Howard',
        last_name: 'Watts',
        title: 'State Assemblyman',
        email: 'test.hwatts@assembly.nv.gov',
        district: 'NV-15',
        level: 'state',
        party: 'D'
      }
    ];

    console.log('📋 Creating test politicians...');
    const createdPoliticians = [];
    
    for (const politician of testPoliticians) {
      try {
        // Check if user already exists
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [politician.email]
        );

        let userId;
        if (existingUser.rows.length > 0) {
          userId = existingUser.rows[0].id;
          console.log(`⚠️  Politician already exists: ${politician.first_name} ${politician.last_name}`);
        } else {
          // Create new user with required fields
          const userResult = await pool.query(`
            INSERT INTO users (
              first_name, last_name, email, role, 
              date_of_birth, password_hash, verification_status,
              notification_preferences, email_verified, is_active,
              created_at, updated_at
            ) VALUES ($1, $2, $3, 'politician', 
              '1970-01-01', 'dummy_hash', 'verified',
              '{}', true, true,
              NOW(), NOW())
            RETURNING id
          `, [politician.first_name, politician.last_name, politician.email]);
          
          userId = userResult.rows[0].id;
          console.log(`✅ Created politician: ${politician.first_name} ${politician.last_name} (${politician.title})`);
        }

        // Also create entry in politicians table
        let politicianId;
        try {
          const politicianResult = await pool.query(`
            INSERT INTO politicians (
              id, user_id, office_level, office_title, district, state, party,
              is_verified, premium_access, created_at, updated_at
            ) VALUES (
              uuid_generate_v4(), $1, $2, $3, $4, 'NV', $5,
              true, false, NOW(), NOW()
            ) RETURNING id
          `, [userId, politician.level, politician.title, politician.district, politician.party]);
          
          politicianId = politicianResult.rows[0].id;
          console.log(`   ✅ Added to politicians table`);
        } catch (politicianError) {
          // Check if politician already exists
          const existingPolitician = await pool.query(
            'SELECT id FROM politicians WHERE user_id = $1',
            [userId]
          );
          if (existingPolitician.rows.length > 0) {
            politicianId = existingPolitician.rows[0].id;
            console.log(`   ⚠️  Already in politicians table`);
          } else {
            throw politicianError;
          }
        }

        createdPoliticians.push({
          ...politician,
          id: userId,
          politician_id: politicianId
        });
      } catch (error) {
        console.log(`❌ Error creating politician ${politician.first_name} ${politician.last_name}:`, error.message);
      }
    }

    // ============================================================================
    // 2. GET EXISTING BILLS FOR POLLS
    // ============================================================================
    
    console.log('\n📊 Finding existing bills for polls...');
    const billsResult = await pool.query(`
      SELECT bill_id, bill_number, title 
      FROM bills 
      WHERE session_id IN (SELECT session_id FROM legislative_sessions WHERE state = 'NV')
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    if (billsResult.rows.length === 0) {
      console.log('❌ No bills found in database. Please run bill sync first.');
      return;
    }

    console.log(`✅ Found ${billsResult.rows.length} bills for polling`);

    // ============================================================================
    // 3. CREATE SAMPLE POLLS
    // ============================================================================
    
    const samplePolls = [
      {
        politician_index: 0, // Sen. Cortez Masto
        question: "Do you support this bill to strengthen consumer protections?",
        context_text: "This legislation would enhance oversight of consumer financial products and provide stronger protections against predatory practices.",
        districts: ['1', '2', '3', '4'],
        expires_hours: 72
      },
      {
        politician_index: 2, // Rep. Titus
        question: "Should Nevada prioritize this healthcare accessibility bill?",
        context_text: "This bill aims to expand healthcare access in rural areas and reduce prescription drug costs for seniors.",
        districts: ['1'],
        expires_hours: 48
      },
      {
        politician_index: 3, // Rep. Amodei
        question: "Do you approve of this water conservation measure?",
        context_text: "The proposed legislation would implement new water conservation standards for Nevada municipalities and businesses.",
        districts: ['2'],
        expires_hours: 96
      },
      {
        politician_index: 4, // Assemblyman Watts
        question: "Should the state support this renewable energy initiative?",
        context_text: "This bill would provide tax incentives for solar installations and create jobs in the clean energy sector.",
        districts: ['15', '3'],
        expires_hours: 120
      },
      {
        politician_index: 1, // Sen. Rosen
        question: "Do you favor this small business support bill?",
        context_text: "Proposed legislation to provide grants and low-interest loans to Nevada small businesses affected by economic challenges.",
        districts: ['1', '2', '3', '4'],
        expires_hours: 168
      }
    ];

    console.log('\n🗳️  Creating sample polls...');
    
    for (let i = 0; i < Math.min(samplePolls.length, billsResult.rows.length); i++) {
      const poll = samplePolls[i];
      const bill = billsResult.rows[i];
      const politician = createdPoliticians[poll.politician_index];

      if (!politician) {
        console.log(`⚠️  Skipping poll ${i + 1} - politician not found`);
        continue;
      }

      try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (poll.expires_hours * 60 * 60 * 1000));

        // Create poll using the existing polls table structure
        const pollResult = await pool.query(`
          INSERT INTO polls (
            id, politician_id, title, description, poll_type,
            options, target_constituency, constituency_filter,
            start_date, end_date, is_active, created_at, updated_at,
            context_type, context_bill_id, context_custom_text, 
            question, target_districts, target_level, status
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, 'yes_no',
            $4, 'district', $5, $6, $7,
            true, NOW(), NOW(),
            'bill', $8, $9, $10, $11, 'state', 'active'
          ) RETURNING id, title
        `, [
          politician.politician_id,
          `Legislative Poll: ${poll.question}`,
          poll.context_text || `Poll about legislative bill ${bill.bill_number}`,
          JSON.stringify({
            scale: {
              min: 1,
              max: 3,
              labels: {
                "1": "Disapprove",
                "2": "No Opinion",
                "3": "Approve"
              }
            }
          }),
          JSON.stringify({
            congressional_districts: poll.districts
          }),
          now,
          expiresAt,
          bill.bill_id,
          poll.context_text,
          poll.question,
          poll.districts
        ]);

        console.log(`✅ Created poll: "${poll.question}" by ${politician.first_name} ${politician.last_name}`);
        console.log(`   📄 Bill: ${bill.bill_number} - ${bill.title.substring(0, 50)}...`);
        console.log(`   🎯 Districts: ${poll.districts.join(', ')}`);
        console.log(`   ⏰ Expires: ${poll.expires_hours} hours from now`);
        
      } catch (error) {
        console.log(`❌ Error creating poll ${i + 1}:`, error.message);
      }
    }

    // ============================================================================
    // 4. VERIFY CREATED DATA
    // ============================================================================
    
    console.log('\n📈 Verifying created data...');
    
    // Check politicians
    const politiciansCount = await pool.query(`
      SELECT COUNT(*) FROM politicians WHERE is_verified = true
    `);
    console.log(`✅ Total politicians in database: ${politiciansCount.rows[0].count}`);

    // Check polls
    const pollsCount = await pool.query(`
      SELECT COUNT(*) FROM polls WHERE context_type = 'bill' AND is_active = true
    `);
    console.log(`✅ Active legislative polls: ${pollsCount.rows[0].count}`);

    // Show sample poll details
    const samplePoll = await pool.query(`
      SELECT p.title, p.question, p.target_districts, 
             (u.first_name || ' ' || u.last_name) as politician_name,
             b.bill_number, p.end_date
      FROM polls p
      JOIN users u ON p.politician_id = u.id
      LEFT JOIN bills b ON p.context_bill_id = b.bill_id
      WHERE p.context_type = 'bill' AND p.is_active = true
      ORDER BY p.created_at DESC
      LIMIT 1
    `);

    if (samplePoll.rows.length > 0) {
      const poll = samplePoll.rows[0];
      console.log('\n📋 Sample poll created:');
      console.log(`   Question: ${poll.question}`);
      console.log(`   By: ${poll.politician_name}`);
      console.log(`   Bill: ${poll.bill_number}`);
      console.log(`   Districts: ${poll.target_districts?.join(', ') || 'N/A'}`);
      console.log(`   Expires: ${poll.end_date}`);
    }

    console.log('\n🎉 Test polling data creation complete!');
    console.log('\nNext steps:');
    console.log('1. Visit the legislative feed at /legislative');
    console.log('2. Click "Show More Details" on any bill');
    console.log('3. Scroll down to see legislative polls');
    console.log('4. Vote on polls to test the functionality');
    
  } catch (error) {
    console.error('❌ Error creating test polling data:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createTestPollingData();