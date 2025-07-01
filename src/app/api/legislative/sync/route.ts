import { NextRequest, NextResponse } from 'next/server';
import { legiscanService } from '@/lib/legiscan';
import { LegislativeDatabase } from '@/lib/database/legislative';
import { FeedGenerator } from '@/lib/feed-generator';

export async function POST(request: NextRequest) {
  try {
    // Verify sync authorization (should use a secret token)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.LEGISLATIVE_SYNC_SECRET;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid sync token' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const force = searchParams.get('force') === 'true';

    let syncResults = {
      sessions_synced: 0,
      bills_processed: 0,
      bills_new: 0,
      bills_updated: 0,
      feed_items_created: 0,
      legislators_synced: 0,
      errors: [] as string[]
    };

    try {
      // Get Nevada sessions to sync
      let sessionsToSync;
      if (sessionId) {
        // Sync specific session
        const allSessions = await legiscanService.getNevadaSessions();
        sessionsToSync = allSessions.filter(s => s.session_id.toString() === sessionId);
      } else {
        // Sync active sessions
        const allSessions = await legiscanService.getNevadaSessions();
        sessionsToSync = allSessions.filter(s => !s.prior && !s.sine_die);
      }

      console.log(`Syncing ${sessionsToSync.length} Nevada legislative sessions...`);

      for (const session of sessionsToSync) {
        try {
          // Upsert session
          await LegislativeDatabase.upsertSession(session);
          syncResults.sessions_synced++;

          // Get session people (legislators)
          try {
            const sessionPeople = await legiscanService.getSessionPeople(session.session_id);
            for (const person of sessionPeople) {
              await LegislativeDatabase.upsertLegislator(person, 'state');
              syncResults.legislators_synced++;
            }
          } catch (error) {
            console.error(`Error syncing legislators for session ${session.session_id}:`, error);
            syncResults.errors.push(`Failed to sync legislators for session ${session.session_id}`);
          }

          // Get bill changes using change_hash for efficiency
          const masterList = await legiscanService.getMasterListRaw(session.session_id);
          
          for (const billSummary of masterList.masterlist) {
            try {
              syncResults.bills_processed++;

              // Check if bill has changed since last sync
              const existingBill = await LegislativeDatabase.getBillByChangeHash(billSummary.change_hash);
              
              if (!existingBill || force) {
                // New or updated bill - fetch full details
                const billDetailResponse = await legiscanService.getBill(billSummary.bill_id);
                const billDetail = billDetailResponse.bill;
                
                // Update database
                await LegislativeDatabase.upsertBill(billDetail);
                await LegislativeDatabase.syncBillSponsors(billDetail);
                
                // Sync any roll calls
                for (const vote of billDetail.votes || []) {
                  try {
                    const rollCallResponse = await legiscanService.getRollCall(vote.roll_call_id);
                    await LegislativeDatabase.syncRollCall(rollCallResponse.roll_call);
                  } catch (error) {
                    console.error(`Error syncing roll call ${vote.roll_call_id}:`, error);
                  }
                }
                
                // Generate feed items
                if (!existingBill) {
                  // New bill
                  const feedItems = await FeedGenerator.processBillIntroduced(billDetail);
                  syncResults.feed_items_created += feedItems.length;
                  syncResults.bills_new++;
                } else {
                  // Updated bill
                  const feedItems = await FeedGenerator.processBillStatusChange(existingBill, billDetail);
                  syncResults.feed_items_created += feedItems.length;
                  syncResults.bills_updated++;
                }
              }
            } catch (error) {
              console.error(`Error processing bill ${billSummary.bill_id}:`, error);
              syncResults.errors.push(`Failed to process bill ${billSummary.bill_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        } catch (error) {
          console.error(`Error syncing session ${session.session_id}:`, error);
          syncResults.errors.push(`Failed to sync session ${session.session_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Clean up old feed items (optional)
      if (!sessionId) {
        try {
          const cleanedCount = await FeedGenerator.cleanupOldFeedItems(180); // Keep 6 months
          console.log(`Cleaned up ${cleanedCount} old feed items`);
        } catch (error) {
          console.error('Error cleaning up old feed items:', error);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Legislative data sync completed',
        results: syncResults
      });

    } catch (error) {
      console.error('Legislative sync error:', error);
      return NextResponse.json({
        success: false,
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        partial_results: syncResults
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Legislative sync API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get sync status and statistics
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.LEGISLATIVE_SYNC_SECRET;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid sync token' }, 
        { status: 401 }
      );
    }

    const stats = await FeedGenerator.getFeedStats();
    
    // Get recent session info
    const recentSessions = await LegislativeDatabase.getActiveSessions();

    return NextResponse.json({
      success: true,
      feed_stats: stats,
      active_sessions: recentSessions,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Legislative sync status API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

