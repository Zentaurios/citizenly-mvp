// check-feed-filtering.js
// Check what districts and subjects are in your real feed data

require('dotenv').config();
const { Pool } = require('pg');

async function checkFeedFiltering() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Checking feed item filtering data...\n');

    // Check what districts and subjects exist in feed_items
    const feedData = await pool.query(`
      SELECT 
        id, title, type, districts, subjects, action_date
      FROM feed_items 
      ORDER BY created_at DESC
    `);

    console.log('📊 Your actual feed items:');
    feedData.rows.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
      console.log(`   Type: ${item.type}`);
      console.log(`   Districts: ${JSON.stringify(item.districts)}`);
      console.log(`   Subjects: ${JSON.stringify(item.subjects)}`);
      console.log(`   Date: ${item.action_date}`);
      console.log('');
    });

    // Check unique districts
    const districts = await pool.query(`
      SELECT DISTINCT unnest(districts) as district 
      FROM feed_items 
      ORDER BY district
    `);
    console.log('🗺️  All districts in your data:', districts.rows.map(r => r.district));

    // Check unique subjects  
    const subjects = await pool.query(`
      SELECT DISTINCT unnest(subjects) as subject 
      FROM feed_items 
      ORDER BY subject
    `);
    console.log('📚 All subjects in your data:', subjects.rows.map(r => r.subject));

    // Test the exact query your app is using
    console.log('\n🧪 Testing your app\'s query with user "citizen-1":');
    const userDistricts = ['3', 'NV-3'];
    const userInterests = ['economy', 'environment', 'education'];

    const testQuery = await pool.query(`
      SELECT 
        fi.*, b.bill_number, b.title as bill_title
      FROM feed_items fi
      LEFT JOIN bills b ON fi.bill_id = b.bill_id  
      WHERE fi.districts && $1 
        AND (fi.subjects && $2 OR array_length(fi.subjects, 1) IS NULL)
      ORDER BY fi.action_date DESC, fi.created_at DESC 
      LIMIT 10
    `, [userDistricts, userInterests]);

    console.log(`Query returned ${testQuery.rows.length} rows`);
    
    if (testQuery.rows.length === 0) {
      console.log('\n❌ No matches found. Testing individual conditions:');
      
      // Test districts only
      const districtTest = await pool.query(`
        SELECT COUNT(*) as count FROM feed_items WHERE districts && $1
      `, [userDistricts]);
      console.log(`District filter matches: ${districtTest.rows[0].count} items`);
      
      // Test subjects only  
      const subjectTest = await pool.query(`
        SELECT COUNT(*) as count FROM feed_items 
        WHERE subjects && $1 OR array_length(subjects, 1) IS NULL
      `, [userInterests]);
      console.log(`Subject filter matches: ${subjectTest.rows[0].count} items`);
      
      // Test no filters
      const noFilterTest = await pool.query(`
        SELECT COUNT(*) as count FROM feed_items
      `);
      console.log(`Total feed items: ${noFilterTest.rows[0].count} items`);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await pool.end();
  }
}

checkFeedFiltering();