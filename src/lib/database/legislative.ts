/**
 * Database operations for legislative data with mock fallback for MVP
 */

import db from './connection';
import { MockLegislativeDatabase } from './mock-legislative';
import { legislativeCache, withCache } from '../cache/legislative';
import type { 
  LegiScanSession, 
  LegiScanBillDetail, 
  LegiScanPerson, 
  LegiScanRollCall 
} from '../legiscan';

export interface DatabaseBill {
  bill_id: number;
  session_id: number;
  bill_number: string;
  bill_type: string;
  title: string;
  description: string | null;
  status: number;
  status_date: string | null;
  last_action: string | null;
  last_action_date: string | null;
  chamber: string | null;
  current_committee_id: number | null;
  subjects: string[];
  change_hash: string;
  legiscan_url: string | null;
  state_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseLegislator {
  people_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  party: string;
  role: string;
  district: string;
  chamber: string | null;
  state: string;
  level: string;
  votesmart_id: number | null;
  ballotpedia: string | null;
  person_hash: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseFeedItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  bill_id: number | null;
  roll_call_id: number | null;
  people_id: number | null;
  action_date: string;
  subjects: string[];
  districts: string[];
  metadata: any;
  created_at: Date;
}

export interface UserFeedFilters {
  type?: string[];
  subjects?: string[];
  dateRange?: { start: Date; end: Date };
  limit?: number;
  offset?: number;
}

// Check if we should use mock data
const USE_MOCK_DATA = process.env.USE_MOCK_LEGISLATIVE === 'true';
// Note: Removed NODE_ENV check so development can use real database

// Helper function to check if a string is a valid UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to check database connectivity
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await db.query('SELECT 1');
    return true;
  } catch (error) {
    console.warn('Database not available, falling back to mock data:', error);
    return false;
  }
}

export class LegislativeDatabase {
  /**
   * Upsert legislative session
   */
  static async upsertSession(session: LegiScanSession): Promise<void> {
    await db.query(`
      INSERT INTO legislative_sessions (
        session_id, state_id, state, year_start, year_end, 
        session_name, session_title, special, active, dataset_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (session_id) 
      UPDATE SET 
        state_id = EXCLUDED.state_id,
        year_start = EXCLUDED.year_start,
        year_end = EXCLUDED.year_end,
        session_name = EXCLUDED.session_name,
        session_title = EXCLUDED.session_title,
        special = EXCLUDED.special,
        active = EXCLUDED.active,
        dataset_hash = EXCLUDED.dataset_hash,
        updated_at = CURRENT_TIMESTAMP
    `, [
      session.session_id,
      session.state_id,
      'NV',
      session.year_start,
      session.year_end,
      session.session_name,
      session.session_title,
      session.special === 1,
      session.sine_die === 0, // Active if not sine die
      null // dataset_hash to be computed
    ]);
  }

  /**
   * Upsert bill with full details
   */
  static async upsertBill(bill: LegiScanBillDetail): Promise<void> {
    await db.query(`
      INSERT INTO bills (
        bill_id, session_id, bill_number, bill_type, title, description,
        status, status_date, last_action, last_action_date, chamber,
        current_committee_id, subjects, change_hash, legiscan_url, state_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (bill_id)
      UPDATE SET
        session_id = EXCLUDED.session_id,
        bill_number = EXCLUDED.bill_number,
        bill_type = EXCLUDED.bill_type,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        status_date = EXCLUDED.status_date,
        last_action = EXCLUDED.last_action,
        last_action_date = EXCLUDED.last_action_date,
        chamber = EXCLUDED.chamber,
        current_committee_id = EXCLUDED.current_committee_id,
        subjects = EXCLUDED.subjects,
        change_hash = EXCLUDED.change_hash,
        legiscan_url = EXCLUDED.legiscan_url,
        state_url = EXCLUDED.state_url,
        updated_at = CURRENT_TIMESTAMP
    `, [
      bill.bill_id,
      bill.session_id,
      bill.bill_number,
      bill.bill_type,
      bill.title,
      bill.description || null,
      bill.status,
      bill.status_date || null,
      bill.last_action || null,
      bill.last_action_date || null,
      bill.chamber || null,
      bill.committee?.committee_id || null,
      bill.subjects || [],
      bill.change_hash,
      bill.url || null,
      bill.state_url || null
    ]);
  }

  /**
   * Upsert legislator
   */
  static async upsertLegislator(person: LegiScanPerson, level: 'state' | 'federal' = 'state'): Promise<void> {
    await db.query(`
      INSERT INTO legislators (
        people_id, first_name, last_name, full_name, party, role,
        district, chamber, state, level, votesmart_id, ballotpedia, person_hash, active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (people_id)
      UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        full_name = EXCLUDED.full_name,
        party = EXCLUDED.party,
        role = EXCLUDED.role,
        district = EXCLUDED.district,
        chamber = EXCLUDED.chamber,
        state = EXCLUDED.state,
        level = EXCLUDED.level,
        votesmart_id = EXCLUDED.votesmart_id,
        ballotpedia = EXCLUDED.ballotpedia,
        person_hash = EXCLUDED.person_hash,
        active = EXCLUDED.active,
        updated_at = CURRENT_TIMESTAMP
    `, [
      person.people_id,
      person.first_name,
      person.last_name,
      person.name,
      person.party,
      person.role,
      person.district,
      person.role === 'Sen' ? 'S' : 'H',
      'NV',
      level,
      person.votesmart_id || null,
      person.ballotpedia || null,
      person.person_hash || null,
      true
    ]);
  }

  /**
   * Sync bill sponsors
   */
  static async syncBillSponsors(bill: LegiScanBillDetail): Promise<void> {
    // First delete existing sponsors
    await db.query('DELETE FROM bill_sponsors WHERE bill_id = $1', [bill.bill_id]);

    // Insert new sponsors
    for (const sponsor of bill.sponsors || []) {
      await db.query(`
        INSERT INTO bill_sponsors (bill_id, people_id, sponsor_type, sponsor_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (bill_id, people_id) DO NOTHING
      `, [
        bill.bill_id,
        sponsor.people_id,
        sponsor.sponsor_type_id,
        sponsor.sponsor_order
      ]);
    }
  }

  /**
   * Sync roll calls and individual votes
   */
  static async syncRollCall(rollCall: LegiScanRollCall): Promise<void> {
    // Insert/update roll call
    await db.query(`
      INSERT INTO roll_calls (
        roll_call_id, bill_id, date, description, chamber,
        yea_count, nay_count, not_voting_count, absent_count, total_count,
        passed, legiscan_url, state_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (roll_call_id)
      UPDATE SET
        bill_id = EXCLUDED.bill_id,
        date = EXCLUDED.date,
        description = EXCLUDED.description,
        chamber = EXCLUDED.chamber,
        yea_count = EXCLUDED.yea_count,
        nay_count = EXCLUDED.nay_count,
        not_voting_count = EXCLUDED.not_voting_count,
        absent_count = EXCLUDED.absent_count,
        total_count = EXCLUDED.total_count,
        passed = EXCLUDED.passed,
        legiscan_url = EXCLUDED.legiscan_url,
        state_url = EXCLUDED.state_url
    `, [
      rollCall.roll_call_id,
      rollCall.bill_id,
      rollCall.date,
      rollCall.desc,
      rollCall.chamber,
      rollCall.yea,
      rollCall.nay,
      rollCall.nv,
      rollCall.absent,
      rollCall.total,
      rollCall.passed === 1,
      rollCall.url || null,
      rollCall.state_url || null
    ]);

    // Delete existing individual votes
    await db.query('DELETE FROM individual_votes WHERE roll_call_id = $1', [rollCall.roll_call_id]);

    // Insert individual votes
    for (const vote of rollCall.votes || []) {
      await db.query(`
        INSERT INTO individual_votes (roll_call_id, people_id, vote_type, vote_text)
        VALUES ($1, $2, $3, $4)
      `, [
        rollCall.roll_call_id,
        vote.people_id,
        vote.vote_id,
        vote.vote_text
      ]);
    }
  }

  /**
   * Get bill by change hash
   */
  static async getBillByChangeHash(changeHash: string): Promise<DatabaseBill | null> {
    const result = await db.query(
      'SELECT * FROM bills WHERE change_hash = $1',
      [changeHash]
    );
    return result.rows[0] || null;
  }

  /**
   * Get active Nevada sessions
   */
  static async getActiveSessions(): Promise<any[]> {
    const result = await db.query(`
      SELECT * FROM legislative_sessions 
      WHERE state = 'NV' AND active = true
      ORDER BY year_start DESC
    `);
    return result.rows;
  }

  /**
   * Get districts affected by a bill (based on sponsors)
   */
  static async getDistrictsForBill(billId: number): Promise<string[]> {
    const result = await db.query(`
      SELECT DISTINCT l.district
      FROM bill_sponsors bs
      JOIN legislators l ON bs.people_id = l.people_id
      WHERE bs.bill_id = $1 AND l.active = true
    `, [billId]);
    
    return result.rows.map((row: any) => row.district);
  }

  /**
   * Create feed item
   */
  static async createFeedItem(item: {
    type: string;
    title: string;
    description?: string;
    bill_id?: number;
    roll_call_id?: number;
    people_id?: number;
    action_date: string;
    subjects?: string[];
    districts?: string[];
    metadata?: any;
  }): Promise<string> {
    if (USE_MOCK_DATA || !(await isDatabaseAvailable())) {
      return MockLegislativeDatabase.createFeedItem(item);
    }

    const result = await db.query(`
      INSERT INTO feed_items (
        type, title, description, bill_id, roll_call_id, people_id,
        action_date, subjects, districts, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      item.type,
      item.title,
      item.description || null,
      item.bill_id || null,
      item.roll_call_id || null,
      item.people_id || null,
      item.action_date,
      item.subjects || [],
      item.districts || [],
      item.metadata || {}
    ]);
    
    // Invalidate user feed caches since new content was added
    await legislativeCache.invalidateUserFeeds();
    
    return result.rows[0].id;
  }

  /**
   * Get personalized feed for user
   */
  static async getUserFeed(userId: string, filters: UserFeedFilters = {}): Promise<DatabaseFeedItem[]> {
    // Only use mock data if explicitly forced
    if (USE_MOCK_DATA) {
      console.log('Using mock legislative data (forced by USE_MOCK_LEGISLATIVE):', userId);
      return MockLegislativeDatabase.getUserFeed(userId, filters);
    }

    // Check database availability
    if (!(await isDatabaseAvailable())) {
      console.log('Database unavailable, using mock legislative data:', userId);
      return MockLegislativeDatabase.getUserFeed(userId, filters);
    }

    console.log('Using real database for legislative feed:', userId);
    
    try {
      // Generate cache key based on userId and filters
      const filtersHash = legislativeCache.generateFiltersHash({ userId, ...filters });
      
      return withCache(
        `feed:user:${userId}:${filtersHash}`,
        async () => {
        // Get user's districts and interests
        // For non-UUID users (mock auth), provide defaults based on actual data
        let userDistricts = ['3', 'NV-3']; // Default Nevada District 3
        let userInterests = ['Education', 'Gaming', 'Tourism', 'Finance', 'Government Affairs', 'Public Lands']; // Match real data subjects
        
        if (isValidUUID(userId)) {
          try {
            const userResult = await db.query(`
              SELECT 
                a.congressional_district,
                a.state_senate_district,
                a.state_house_district,
                u.interests,
                uli.subjects as legislative_subjects,
                uli.follow_districts,
                uli.notification_types
              FROM users u
              LEFT JOIN addresses a ON u.id = a.user_id AND a.is_primary = true
              LEFT JOIN user_legislative_interests uli ON u.id = uli.user_id
              WHERE u.id = $1
            `, [userId]);

            if (userResult.rows[0]) {
              const user = userResult.rows[0];
              userDistricts = [
                user.congressional_district,
                user.state_senate_district,
                user.state_house_district
              ].filter(Boolean);

              if (user.follow_districts) {
                userDistricts.push(...user.follow_districts);
              }

              userInterests = [
                ...(user.interests || []),
                ...(user.legislative_subjects || [])
              ];
            }
          } catch (userError) {
            console.log('User not found in database, using defaults for:', userId);
          }
        } else {
          console.log('Non-UUID user ID, using default districts and interests for:', userId);
        }

    // Build the query with proper filtering
    let query = `
    SELECT 
    fi.*,
    b.bill_number,
    b.title as bill_title,
    rc.description as vote_description,
    l.full_name as legislator_name
    FROM feed_items fi
    LEFT JOIN bills b ON fi.bill_id = b.bill_id  
    LEFT JOIN roll_calls rc ON fi.roll_call_id = rc.roll_call_id
    LEFT JOIN legislators l ON fi.people_id = l.people_id
    WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Filter by user's districts
    if (userDistricts.length > 0) {
    paramCount++;
    query += ` AND fi.districts && $${paramCount}`;
    params.push(userDistricts);
    }

    // Filter by interests if user has any
    if (userInterests.length > 0) {
    paramCount++;
    query += ` AND (fi.subjects && $${paramCount} OR array_length(fi.subjects, 1) IS NULL)`;
    params.push(userInterests);
    }

    // Filter by type if specified
    if (filters.type && filters.type.length > 0) {
      paramCount++;
      query += ` AND fi.type = ANY($${paramCount})`;
      params.push(filters.type);
    }

    // Filter by subjects if specified
    if (filters.subjects && filters.subjects.length > 0) {
      paramCount++;
      query += ` AND fi.subjects && $${paramCount}`;
      params.push(filters.subjects);
    }

    // Filter by date range
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        paramCount++;
        query += ` AND fi.action_date >= $${paramCount}`;
        params.push(filters.dateRange.start.toISOString().split('T')[0]);
      }
      if (filters.dateRange.end) {
        paramCount++;
        query += ` AND fi.action_date <= $${paramCount}`;
        params.push(filters.dateRange.end.toISOString().split('T')[0]);
      }
    }

    query += ` ORDER BY fi.action_date DESC, fi.created_at DESC`;

    // Apply limit and offset
    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    } else {
      query += ` LIMIT 50`;
    }

    if (filters.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

        const result = await db.query(query, params);
        return result.rows;
      },
      async (data) => {
        await legislativeCache.setUserFeed(userId, filtersHash, data);
      },
      async () => {
        return await legislativeCache.getUserFeed(userId, filtersHash);
      }
    );
    } catch (error) {
      console.error('Error fetching user feed from database:', error);
      console.log('Falling back to mock data for user:', userId);
      return MockLegislativeDatabase.getUserFeed(userId, filters);
    }
  }

  /**
   * Get or create user legislative interests
   */
  static async getUserLegislativeInterests(userId: string): Promise<any> {
    if (USE_MOCK_DATA || !isValidUUID(userId) || !(await isDatabaseAvailable())) {
      return MockLegislativeDatabase.getUserLegislativeInterests(userId);
    }

    const result = await db.query(
      'SELECT * FROM user_legislative_interests WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows[0]) {
      return result.rows[0];
    }

    // Create default interests entry
    const insertResult = await db.query(`
      INSERT INTO user_legislative_interests (user_id, subjects, follow_districts, notification_types)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, [], [], ['bill_introduced', 'vote_result']]);
    
    return insertResult.rows[0];
  }

  /**
   * Update user legislative interests
   */
  static async updateUserLegislativeInterests(userId: string, interests: {
    subjects?: string[];
    follow_districts?: string[];
    notification_types?: string[];
  }): Promise<void> {
    if (USE_MOCK_DATA || !isValidUUID(userId) || !(await isDatabaseAvailable())) {
      return MockLegislativeDatabase.updateUserLegislativeInterests(userId, interests);
    }

    const updateFields: string[] = [];
    const params: any[] = [userId];
    let paramCount = 1;

    if (interests.subjects !== undefined) {
      paramCount++;
      updateFields.push(`subjects = $${paramCount}`);
      params.push(interests.subjects);
    }

    if (interests.follow_districts !== undefined) {
      paramCount++;
      updateFields.push(`follow_districts = $${paramCount}`);
      params.push(interests.follow_districts);
    }

    if (interests.notification_types !== undefined) {
      paramCount++;
      updateFields.push(`notification_types = $${paramCount}`);
      params.push(interests.notification_types);
    }

    if (updateFields.length === 0) return;

    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    await db.query(`
      UPDATE user_legislative_interests 
      SET ${updateFields.join(', ')}
      WHERE user_id = $1
    `, params);
  }
}