/**
 * Legislative Feed Generation System
 * Creates personalized feed items from legislative data changes
 */

import { LegislativeDatabase } from './database/legislative';
import { legiscanService } from './legiscan';
import db from './database/connection';
import type { LegiScanBillDetail, LegiScanRollCall } from './legiscan';

export interface FeedItemParams {
  type: 'bill_introduced' | 'bill_updated' | 'vote_scheduled' | 'vote_result' | 'status_change';
  bill?: LegiScanBillDetail;
  rollCall?: LegiScanRollCall;
  actionDate: string;
  metadata?: any;
}

export class FeedGenerator {
  /**
   * Create feed item from bill or vote data
   */
  static async createFeedItem(params: FeedItemParams): Promise<string> {
    const { type, bill, rollCall, actionDate, metadata = {} } = params;
    
    let title: string;
    let description: string;
    let districts: string[] = [];
    let subjects: string[] = [];
    let billId: number | undefined;
    let rollCallId: number | undefined;
    let peopleId: number | undefined;

    if (bill) {
      billId = bill.bill_id;
      subjects = bill.subjects || [];
      districts = await LegislativeDatabase.getDistrictsForBill(bill.bill_id);
      
      switch (type) {
        case 'bill_introduced':
          title = `New Bill: ${bill.bill_number} - ${bill.title}`;
          description = this.truncateText(bill.description || '', 200);
          break;
          
        case 'bill_updated':
          title = `Bill Updated: ${bill.bill_number}`;
          description = `${bill.title} - ${bill.last_action}`;
          break;
          
        case 'status_change':
          const statusText = legiscanService.getStatusText(bill.status);
          title = `${bill.bill_number} Status: ${statusText}`;
          description = `${bill.title} - ${bill.last_action}`;
          break;
      }
    }

    if (rollCall) {
      rollCallId = rollCall.roll_call_id;
      billId = rollCall.bill_id;
      
      // Get bill info for context
      const billResult = await LegislativeDatabase.getBillByChangeHash('');
      if (billResult) {
        subjects = billResult.subjects || [];
        districts = await LegislativeDatabase.getDistrictsForBill(rollCall.bill_id);
      }
      
      switch (type) {
        case 'vote_scheduled':
          title = `Upcoming Vote: ${rollCall.desc}`;
          description = `Scheduled for ${new Date(rollCall.date).toLocaleDateString()}`;
          break;
          
        case 'vote_result':
          const resultText = rollCall.passed ? 'PASSED' : 'FAILED';
          title = `Vote Result: ${rollCall.desc} - ${resultText}`;
          description = `${rollCall.yea} Yes, ${rollCall.nay} No, ${rollCall.nv} Not Voting, ${rollCall.absent} Absent`;
          break;
      }
    }

    // Ensure we have required data
    if (!title) {
      throw new Error('Unable to generate title for feed item');
    }

    return await LegislativeDatabase.createFeedItem({
      type,
      title,
      description: description || '',
      bill_id: billId,
      roll_call_id: rollCallId,
      people_id: peopleId,
      action_date: actionDate,
      subjects,
      districts,
      metadata
    });
  }

  /**
   * Generate feed items for newly introduced bills
   */
  static async processBillIntroduced(bill: LegiScanBillDetail): Promise<string[]> {
    const feedItems: string[] = [];
    
    // Main bill introduction item
    const mainItem = await this.createFeedItem({
      type: 'bill_introduced',
      bill,
      actionDate: bill.status_date || new Date().toISOString().split('T')[0],
      metadata: {
        chamber: legiscanService.getChamberName(bill.chamber),
        sponsors: bill.sponsors?.map(s => s.name) || [],
        committee: bill.committee?.name || null
      }
    });
    feedItems.push(mainItem);

    return feedItems;
  }

  /**
   * Generate feed items for bill status changes
   */
  static async processBillStatusChange(
    oldBill: any, 
    newBill: LegiScanBillDetail
  ): Promise<string[]> {
    const feedItems: string[] = [];

    // Check if status actually changed
    if (!oldBill || oldBill.status !== newBill.status) {
      const statusItem = await this.createFeedItem({
        type: 'status_change',
        bill: newBill,
        actionDate: newBill.status_date || new Date().toISOString().split('T')[0],
        metadata: {
          previous_status: oldBill?.status || null,
          new_status: newBill.status,
          status_text: legiscanService.getStatusText(newBill.status),
          chamber: legiscanService.getChamberName(newBill.chamber)
        }
      });
      feedItems.push(statusItem);
    }

    // Check if last action changed
    if (!oldBill || oldBill.last_action !== newBill.last_action) {
      const actionItem = await this.createFeedItem({
        type: 'bill_updated',
        bill: newBill,
        actionDate: newBill.last_action_date || new Date().toISOString().split('T')[0],
        metadata: {
          action_type: 'last_action_change',
          previous_action: oldBill?.last_action || null,
          new_action: newBill.last_action
        }
      });
      feedItems.push(actionItem);
    }

    return feedItems;
  }

  /**
   * Generate feed items for roll call votes
   */
  static async processRollCallVote(rollCall: LegiScanRollCall): Promise<string[]> {
    const feedItems: string[] = [];

    // Main vote result item
    const voteItem = await this.createFeedItem({
      type: 'vote_result',
      rollCall,
      actionDate: rollCall.date,
      metadata: {
        chamber: legiscanService.getChamberName(rollCall.chamber),
        vote_breakdown: {
          yea: rollCall.yea,
          nay: rollCall.nay,
          not_voting: rollCall.nv,
          absent: rollCall.absent,
          total: rollCall.total
        },
        margin: rollCall.yea - rollCall.nay,
        passed: rollCall.passed === 1
      }
    });
    feedItems.push(voteItem);

    return feedItems;
  }

  /**
   * Generate feed items for legislator-specific updates
   */
  static async processLegislatorUpdate(
    peopleId: number,
    updateType: string,
    metadata: any
  ): Promise<string[]> {
    const feedItems: string[] = [];

    // This would be used for things like:
    // - Legislator sponsoring a new bill
    // - Legislator changing committee assignments
    // - Legislator voting record summaries
    // Implementation depends on specific use cases

    return feedItems;
  }

  /**
   * Batch process multiple bills for efficiency
   */
  static async processBillBatch(bills: LegiScanBillDetail[]): Promise<string[]> {
    const allFeedItems: string[] = [];

    for (const bill of bills) {
      try {
        // Check if bill already exists
        const existingBill = await LegislativeDatabase.getBillByChangeHash(bill.change_hash);
        
        if (!existingBill) {
          // New bill
          const items = await this.processBillIntroduced(bill);
          allFeedItems.push(...items);
        } else {
          // Existing bill - check for changes
          const items = await this.processBillStatusChange(existingBill, bill);
          allFeedItems.push(...items);
        }
      } catch (error) {
        console.error(`Error processing bill ${bill.bill_id}:`, error);
        // Continue processing other bills
      }
    }

    return allFeedItems;
  }

  /**
   * Clean up old feed items to prevent database bloat
   */
  static async cleanupOldFeedItems(daysToKeep: number = 180): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db.query(`
      DELETE FROM feed_items 
      WHERE action_date < $1
      RETURNING id
    `, [cutoffDate.toISOString().split('T')[0]]);

    return result.rows.length;
  }

  /**
   * Get feed statistics for monitoring
   */
  static async getFeedStats(): Promise<{
    total_items: number;
    items_by_type: Record<string, number>;
    items_last_24h: number;
    items_last_7d: number;
  }> {
    const totalResult = await db.query(
      'SELECT COUNT(*) as count FROM feed_items'
    );

    const typeResult = await db.query(`
      SELECT type, COUNT(*) as count 
      FROM feed_items 
      GROUP BY type
    `);

    const recentResult = await db.query(`
      SELECT 
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7d
      FROM feed_items
    `);

    const itemsByType: Record<string, number> = {};
    typeResult.rows.forEach(row => {
      itemsByType[row.type] = parseInt(row.count);
    });

    return {
      total_items: parseInt(totalResult.rows[0].count),
      items_by_type: itemsByType,
      items_last_24h: parseInt(recentResult.rows[0].last_24h || '0'),
      items_last_7d: parseInt(recentResult.rows[0].last_7d || '0')
    };
  }

  /**
   * Utility function to truncate text
   */
  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength - 3).trim() + '...';
  }
}

// Helper function to determine if a bill affects specific districts
export function getBillRelevanceScore(
  bill: LegiScanBillDetail,
  userDistricts: string[],
  userInterests: string[]
): number {
  let score = 0;

  // Base score for all bills
  score += 1;

  // Higher score for bills with matching subjects
  const matchingSubjects = bill.subjects?.filter(subject => 
    userInterests.some(interest => 
      interest.toLowerCase().includes(subject.toLowerCase()) ||
      subject.toLowerCase().includes(interest.toLowerCase())
    )
  ) || [];
  score += matchingSubjects.length * 3;

  // Score based on sponsors from user's districts
  // (This would need sponsor district data from the database)

  // Score based on bill importance (status)
  if (bill.status >= 4) { // Passed or vetoed
    score += 2;
  } else if (bill.status >= 2) { // Engrossed or enrolled
    score += 1;
  }

  return score;
}