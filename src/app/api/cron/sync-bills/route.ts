import { NextRequest, NextResponse } from 'next/server';
import { nevadaBillSync } from '@/lib/sync/nevada-bills';

export async function GET(request: NextRequest) {
  try {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || process.env.LEGISLATIVE_SYNC_SECRET;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      console.error('Unauthorized cron sync attempt');
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Check if sync is already running
    if (nevadaBillSync.isSyncRunning()) {
      return NextResponse.json({
        success: false,
        message: 'Sync is already running',
        skipped: true
      });
    }

    console.log('Starting scheduled Nevada bill sync...');

    // Run quick sync (only recent changes)
    const results = await nevadaBillSync.quickSync();

    if (results.success) {
      console.log('Scheduled sync completed successfully', {
        duration: results.duration_ms,
        bills_new: results.bills_new,
        bills_updated: results.bills_updated,
        feed_items: results.feed_items_created
      });

      return NextResponse.json({
        success: true,
        message: 'Bills synced successfully',
        results: {
          sessions_synced: results.sessions_synced,
          bills_processed: results.bills_processed,
          bills_new: results.bills_new,
          bills_updated: results.bills_updated,
          legislators_synced: results.legislators_synced,
          feed_items_created: results.feed_items_created,
          duration_ms: results.duration_ms,
          error_count: results.errors.length
        }
      });
    } else {
      console.error('Scheduled sync failed', {
        errors: results.errors,
        duration: results.duration_ms
      });

      return NextResponse.json({
        success: false,
        message: 'Sync failed',
        error_count: results.errors.length,
        first_error: results.errors[0],
        duration_ms: results.duration_ms
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Cron sync error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle POST for manual triggers with options
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || process.env.LEGISLATIVE_SYNC_SECRET;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { 
      type = 'quick', 
      sessionId, 
      force = false,
      maxBills 
    } = body;

    // Check if sync is already running
    if (nevadaBillSync.isSyncRunning()) {
      return NextResponse.json({
        success: false,
        message: 'Sync is already running',
        skipped: true
      });
    }

    console.log('Starting manual Nevada bill sync...', { type, sessionId, force, maxBills });

    let results;
    
    switch (type) {
      case 'quick':
        results = await nevadaBillSync.quickSync();
        break;
      case 'full':
        results = await nevadaBillSync.fullSync();
        break;
      case 'session':
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'Session ID required for session sync'
          }, { status: 400 });
        }
        results = await nevadaBillSync.syncSession(sessionId);
        break;
      case 'custom':
        results = await nevadaBillSync.syncNevadaBills({
          force,
          maxBills,
          sessionId
        });
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid sync type. Use: quick, full, session, or custom'
        }, { status: 400 });
    }

    if (results.success) {
      return NextResponse.json({
        success: true,
        message: `${type} sync completed successfully`,
        results: {
          sessions_synced: results.sessions_synced,
          bills_processed: results.bills_processed,
          bills_new: results.bills_new,
          bills_updated: results.bills_updated,
          legislators_synced: results.legislators_synced,
          roll_calls_synced: results.roll_calls_synced,
          feed_items_created: results.feed_items_created,
          duration_ms: results.duration_ms,
          error_count: results.errors.length,
          errors: results.errors.slice(0, 5) // First 5 errors
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `${type} sync failed`,
        error_count: results.errors.length,
        errors: results.errors.slice(0, 10), // First 10 errors
        duration_ms: results.duration_ms
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Manual sync error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}