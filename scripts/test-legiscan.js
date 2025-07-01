require('dotenv').config({ path: '.env.local' });

async function testLegiScanAPI() {
  try {
    console.log('Testing LegiScan API connection...\n');
    
    const apiKey = process.env.LEGISCAN_API_KEY;
    if (!apiKey) {
      console.log('❌ LEGISCAN_API_KEY not found in environment');
      return;
    }
    
    console.log('✅ LegiScan API key found');
    console.log('🔗 Testing API connection...\n');
    
    // Test basic API connectivity
    const testUrl = `https://api.legiscan.com/?key=${apiKey}&op=getSessionList&state=NV`;
    
    const response = await fetch(testUrl);
    const data = await response.json();
    
    console.log('📡 API Response Status:', response.status);
    console.log('📄 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.status === 'OK') {
      console.log('\n✅ LegiScan API is working!');
      
      if (data.sessions && Array.isArray(data.sessions)) {
        console.log(`📊 Found ${data.sessions.length} Nevada sessions:`);
        data.sessions.slice(0, 5).forEach(session => {
          console.log(`   • ${session.session_name} (${session.year_start}-${session.year_end}) - ${session.sine_die ? 'Ended' : 'Active'}`);
        });
        
        const activeSessions = data.sessions.filter(s => !s.prior && !s.sine_die);
        console.log(`\n🎯 Active sessions: ${activeSessions.length}`);
        
        if (activeSessions.length === 0) {
          console.log('⚠️  No active sessions found - this is why sync failed');
          console.log('💡 Try syncing a specific session:');
          if (data.sessions.length > 0) {
            const latestSession = data.sessions[0];
            console.log(`   curl -X POST http://localhost:3002/api/cron/sync-bills \\`);
            console.log(`     -H "Authorization: Bearer ${process.env.CRON_SECRET}" \\`);
            console.log(`     -H "Content-Type: application/json" \\`);
            console.log(`     -d '{"type": "session", "sessionId": ${latestSession.session_id}}'`);
          }
        }
      }
    } else {
      console.log('❌ LegiScan API error:', data.alert?.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Error testing LegiScan API:', error.message);
  }
}

testLegiScanAPI();