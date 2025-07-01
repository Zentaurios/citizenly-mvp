/**
 * Background sync job for Nevada legislative bills
 * Syncs data from LegiScan API and generates feed items
 */

import { legiscanService } from '../legiscan';
import { LegislativeDatabase } from '../database/legislative';
import { FeedGenerator } from '../feed-generator';
import { legislativeCache } from '../cache/legislative';

export interface SyncOptions {
  sessionId?: number;
  force?: boolean;
  maxBills?: number;
  onProgress?: (progress: SyncProgress) => void;
}

export interface SyncProgress {
  phase: string;
  current: number;
  total: number;
  message: string;
}

export interface SyncResults {
  success: boolean;
  sessions_synced: number;
  bills_processed: number;
  bills_new: number;
  bills_updated: number;
  legislators_synced: number;
  roll_calls_synced: number;
  feed_items_created: number;
  errors: string[];
  duration_ms: number;
  started_at: string;
  completed_at: string;
}

export class NevadaBillSync {
  private static instance: NevadaBillSync;
  private isRunning = false;

  static getInstance(): NevadaBillSync {
    if (!NevadaBillSync.instance) {
      NevadaBillSync.instance = new NevadaBillSync();
    }
    return NevadaBillSync.instance;
  }

  /**
   * Main sync function for Nevada bills
   */
  async syncNevadaBills(options: SyncOptions = {}): Promise<SyncResults> {
    if (this.isRunning) {
      throw new Error('Sync is already running');
    }

    this.isRunning = true;
    const startTime = Date.now();
    const startedAt = new Date().toISOString();

    const results: SyncResults = {
      success: false,
      sessions_synced: 0,
      bills_processed: 0,
      bills_new: 0,
      bills_updated: 0,
      legislators_synced: 0,
      roll_calls_synced: 0,
      feed_items_created: 0,
      errors: [],
      duration_ms: 0,
      started_at: startedAt,
      completed_at: ''
    };

    try {
      console.log('Starting Nevada legislative sync...', {
        sessionId: options.sessionId,
        force: options.force,
        maxBills: options.maxBills
      });

      // Phase 1: Get sessions to sync
      options.onProgress?.({
        phase: 'sessions',
        current: 0,
        total: 1,
        message: 'Fetching Nevada legislative sessions...'
      });

      const allSessions = await legiscanService.getNevadaSessions();
      let sessionsToSync = options.sessionId 
        ? allSessions.filter(s => s.session_id === options.sessionId)
        : allSessions.filter(s => !s.prior && !s.sine_die); // Active sessions only

      if (sessionsToSync.length === 0) {
        throw new Error('No sessions found to sync');
      }

      console.log(`Found ${sessionsToSync.length} sessions to sync`);

      // Phase 2: Sync sessions and legislators
      for (let i = 0; i < sessionsToSync.length; i++) {
        const session = sessionsToSync[i];
        
        try {
          options.onProgress?.({
            phase: 'session_sync',
            current: i + 1,
            total: sessionsToSync.length,
            message: `Syncing session ${session.session_name}...`
          });

          // Upsert session
          await LegislativeDatabase.upsertSession(session);
          results.sessions_synced++;

          // Sync legislators for this session
          const sessionPeople = await legiscanService.getSessionPeople(session.session_id);
          for (const person of sessionPeople) {
            await LegislativeDatabase.upsertLegislator(person, 'state');
            results.legislators_synced++;
          }

          // Cache session data
          await legislativeCache.setSession(session.session_id, session);

        } catch (error) {
          console.error(`Error syncing session ${session.session_id}:`, error);
          results.errors.push(`Session ${session.session_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Phase 3: Sync bills for each session
      for (let sessionIndex = 0; sessionIndex < sessionsToSync.length; sessionIndex++) {
        const session = sessionsToSync[sessionIndex];

        try {
          options.onProgress?.({
            phase: 'bills_fetch',
            current: sessionIndex + 1,
            total: sessionsToSync.length,
            message: `Fetching bills for ${session.session_name}...`
          });

          // Get master list of bills with change hashes
          const masterList = await legiscanService.getMasterListRaw(session.session_id);
          let billsToProcess = masterList.masterlist;

          // Apply maxBills limit if specified
          if (options.maxBills && billsToProcess.length > options.maxBills) {
            billsToProcess = billsToProcess.slice(0, options.maxBills);
          }

          console.log(`Processing ${billsToProcess.length} bills for session ${session.session_name}`);

          // Process each bill
          for (let billIndex = 0; billIndex < billsToProcess.length; billIndex++) {
            const billSummary = billsToProcess[billIndex];

            try {
              options.onProgress?.({
                phase: 'bills_sync',
                current: billIndex + 1,
                total: billsToProcess.length,
                message: `Processing bill ${billSummary.number}...`
              });

              results.bills_processed++;

              // Check if bill needs updating
              const existingBill = await LegislativeDatabase.getBillByChangeHash(billSummary.change_hash);
              
              if (!existingBill || options.force) {
                // Fetch full bill details
                const billDetailResponse = await legiscanService.getBill(billSummary.bill_id);
                const billDetail = billDetailResponse.bill;

                // Store old bill for comparison
                const oldBill = existingBill;

                // Update database
                await LegislativeDatabase.upsertBill(billDetail);
                await LegislativeDatabase.syncBillSponsors(billDetail);

                // Cache bill data
                await legislativeCache.setBill(billDetail.bill_id, billDetail);

                // Sync roll calls
                for (const vote of billDetail.votes || []) {
                  try {
                    const rollCallResponse = await legiscanService.getRollCall(vote.roll_call_id);
                    await LegislativeDatabase.syncRollCall(rollCallResponse.roll_call);
                    await legislativeCache.setRollCall(vote.roll_call_id, rollCallResponse.roll_call);
                    results.roll_calls_synced++;
                  } catch (error) {
                    console.error(`Error syncing roll call ${vote.roll_call_id}:`, error);
                    results.errors.push(`Roll call ${vote.roll_call_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }

                // Generate feed items
                if (!existingBill) {
                  // New bill
                  const feedItems = await FeedGenerator.processBillIntroduced(billDetail);
                  results.feed_items_created += feedItems.length;
                  results.bills_new++;
                } else {
                  // Updated bill
                  const feedItems = await FeedGenerator.processBillStatusChange(oldBill, billDetail);
                  results.feed_items_created += feedItems.length;
                  results.bills_updated++;
                }
              }

            } catch (error) {
              console.error(`Error processing bill ${billSummary.bill_id}:`, error);
              results.errors.push(`Bill ${billSummary.bill_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }

        } catch (error) {
          console.error(`Error processing bills for session ${session.session_id}:`, error);
          results.errors.push(`Session bills ${session.session_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Phase 4: Cleanup old data
      if (!options.sessionId) {
        try {
          options.onProgress?.({
            phase: 'cleanup',
            current: 1,
            total: 1,
            message: 'Cleaning up old feed items...'
          });

          await FeedGenerator.cleanupOldFeedItems(180); // Keep 6 months
        } catch (error) {
          console.error('Error during cleanup:', error);
          results.errors.push(`Cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      results.success = true;
      console.log('Nevada legislative sync completed successfully', {
        sessions: results.sessions_synced,
        bills_new: results.bills_new,
        bills_updated: results.bills_updated,
        legislators: results.legislators_synced,
        feed_items: results.feed_items_created,
        errors: results.errors.length
      });

    } catch (error) {
      console.error('Nevada legislative sync failed:', error);
      results.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.success = false;
    } finally {
      this.isRunning = false;
      results.duration_ms = Date.now() - startTime;
      results.completed_at = new Date().toISOString();

      options.onProgress?.({
        phase: 'complete',
        current: 1,
        total: 1,
        message: results.success ? 'Sync completed successfully' : 'Sync failed'
      });
    }

    return results;
  }

  /**
   * Quick sync for recent changes only
   */
  async quickSync(): Promise<SyncResults> {
    return this.syncNevadaBills({
      maxBills: 50, // Only process recent bills
      force: false
    });
  }

  /**
   * Full sync with all data
   */
  async fullSync(): Promise<SyncResults> {
    return this.syncNevadaBills({
      force: true
    });
  }

  /**
   * Sync specific session
   */
  async syncSession(sessionId: number): Promise<SyncResults> {
    return this.syncNevadaBills({
      sessionId,
      force: true
    });
  }

  /**
   * Check if sync is currently running
   */
  isSyncRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus(): Promise<{
    is_running: boolean;
    last_sync?: SyncResults;
    cache_health: boolean;
    feed_stats: any;
  }> {
    const cacheHealth = await legislativeCache.healthCheck();
    const feedStats = await FeedGenerator.getFeedStats();

    return {
      is_running: this.isRunning,
      cache_health: cacheHealth,
      feed_stats: feedStats
    };
  }
}

// Export singleton instance
export const nevadaBillSync = NevadaBillSync.getInstance();