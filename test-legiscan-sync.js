// test-legiscan-sync.js
// Quick test to see if LegiScan sync is working

const API_KEY = process.env.LEGISCAN_API_KEY || '3b5846b7a43f73bf963cb47afd5bb39d';
const CRON_SECRET = process.env.CRON_SECRET || process.env.LEGISLATIVE_SYNC_SECRET;

async function testLegiScanAPI() {
  console.log('🔍 Testing LegiScan API connection...');
  
  try {
    // Test direct LegiScan API call
    const response = await fetch(`https://api.legiscan.com/?key=${API_KEY}&op=getSessionList&state=NV`);
    const data = await response.json();
    
    if (data.status === 'OK') {
      console.log('✅ LegiScan API working!');
      console.log(`Found ${data.sessionlist?.length || 0} Nevada sessions`);
      return true;
    } else {
      console.log('❌ LegiScan API error:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ LegiScan API failed:', error.message);
    return false;
  }
}

async function testSyncEndpoint() {
  console.log('🔍 Testing sync endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/cron/sync-bills', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'quick',
        maxBills: 5 // Just test with 5 bills
      })
    });
    
    const result = await response.json();
    console.log('Sync result:', result);
    
    if (result.success) {
      console.log('✅ Sync endpoint working!');
      console.log(`Created ${result.results?.feed_items_created || 0} feed items`);
    } else {
      console.log('❌ Sync failed:', result.message);
    }
    
  } catch (error) {
    console.log('❌ Sync endpoint failed:', error.message);
  }
}

async function main() {
  console.log('Testing LegiScan integration...\n');
  
  const apiWorking = await testLegiScanAPI();
  
  if (apiWorking) {
    console.log('\n📡 API working, testing sync endpoint...');
    await testSyncEndpoint();
  }
}

main();