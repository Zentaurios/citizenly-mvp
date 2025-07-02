// src/lib/database/mock-legislative.ts
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

// Mock data for MVP testing
const mockFeedItems: DatabaseFeedItem[] = [
  {
    id: '1',
    type: 'bill_introduced',
    title: 'Nevada Clean Energy Initiative Act',
    description: 'A comprehensive bill to promote renewable energy development across Nevada.',
    bill_id: 1001,
    roll_call_id: null,
    people_id: 2001,
    action_date: '2025-06-25',
    subjects: ['environment', 'energy', 'economy'],
    districts: ['3', 'NV-3'],
    metadata: {
      bill_number: 'NV-SB-125',
      chamber: 'Senate',
      status: 'Introduced'
    },
    created_at: new Date('2025-06-25T10:00:00Z')
  },
  {
    id: '2',
    type: 'vote_result',
    title: 'Housing Affordability Act - Senate Vote',
    description: 'Senate approves housing affordability measures with bipartisan support.',
    bill_id: 1002,
    roll_call_id: 3001,
    people_id: null,
    action_date: '2025-06-28',
    subjects: ['housing', 'economy', 'infrastructure'],
    districts: ['3', 'NV-3', 'NV-Senate'],
    metadata: {
      bill_number: 'NV-AB-89',
      chamber: 'Senate',
      vote_result: 'Passed',
      vote_count: { yea: 15, nay: 6, absent: 0 }
    },
    created_at: new Date('2025-06-28T14:30:00Z')
  },
  {
    id: '3',
    type: 'committee_hearing',
    title: 'Education Funding Committee Hearing',
    description: 'Public hearing on proposed changes to education funding formula.',
    bill_id: 1003,
    roll_call_id: null,
    people_id: 2002,
    action_date: '2025-07-01',
    subjects: ['education', 'budget', 'taxes'],
    districts: ['3', 'NV-3'],
    metadata: {
      committee: 'Education Committee',
      hearing_type: 'Public Hearing',
      scheduled_time: '2025-07-01T09:00:00Z'
    },
    created_at: new Date('2025-06-30T16:00:00Z')
  },
  {
    id: '4',
    type: 'bill_update',
    title: 'Transportation Infrastructure Bill - Amendment Added',
    description: 'New amendment adds funding for rural road improvements.',
    bill_id: 1004,
    roll_call_id: null,
    people_id: 2003,
    action_date: '2025-06-30',
    subjects: ['infrastructure', 'transportation', 'rural'],
    districts: ['3', 'NV-3', '1', '2'],
    metadata: {
      bill_number: 'NV-SB-77',
      amendment_number: 'AM-1',
      action: 'Amendment Added'
    },
    created_at: new Date('2025-06-30T11:15:00Z')
  },
  {
    id: '5',
    type: 'legislator_announcement',
    title: 'Senator Johnson Announces Town Hall Meeting',
    description: 'District 3 town hall to discuss upcoming legislative session priorities.',
    bill_id: null,
    roll_call_id: null,
    people_id: 2001,
    action_date: '2025-07-02',
    subjects: ['civic engagement', 'town hall'],
    districts: ['3', 'NV-3'],
    metadata: {
      event_type: 'Town Hall',
      location: 'Reno Convention Center',
      scheduled_time: '2025-07-02T18:00:00Z'
    },
    created_at: new Date('2025-06-29T08:00:00Z')
  }
];

export class MockLegislativeDatabase {
  /**
   * Get personalized feed for user (MVP implementation)
   */
  static async getUserFeed(userId: string, filters: UserFeedFilters = {}): Promise<DatabaseFeedItem[]> {
    // Simulate database delay
    await new Promise(resolve => setTimeout(resolve, 100));

    let filteredItems = [...mockFeedItems];

    // Apply type filter
    if (filters.type && filters.type.length > 0) {
      filteredItems = filteredItems.filter(item => 
        filters.type!.includes(item.type)
      );
    }

    // Apply subjects filter
    if (filters.subjects && filters.subjects.length > 0) {
      filteredItems = filteredItems.filter(item =>
        item.subjects.some(subject => filters.subjects!.includes(subject))
      );
    }

    // Apply date range filter
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        filteredItems = filteredItems.filter(item =>
          new Date(item.action_date) >= filters.dateRange!.start!
        );
      }
      if (filters.dateRange.end) {
        filteredItems = filteredItems.filter(item =>
          new Date(item.action_date) <= filters.dateRange!.end!
        );
      }
    }

    // Sort by action date (newest first)
    filteredItems.sort((a, b) => 
      new Date(b.action_date).getTime() - new Date(a.action_date).getTime()
    );

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    
    return filteredItems.slice(offset, offset + limit);
  }

  /**
   * Get or create user legislative interests (MVP implementation)
   */
  static async getUserLegislativeInterests(userId: string): Promise<any> {
    // Return default interests for MVP
    return {
      user_id: userId,
      subjects: ['economy', 'environment', 'education'],
      follow_districts: ['3', 'NV-3'],
      notification_types: ['bill_introduced', 'vote_result'],
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  /**
   * Update user legislative interests (MVP implementation)
   */
  static async updateUserLegislativeInterests(userId: string, interests: {
    subjects?: string[];
    follow_districts?: string[];
    notification_types?: string[];
  }): Promise<void> {
    // In MVP, just log the update (no persistence)
    console.log(`Updated interests for user ${userId}:`, interests);
  }

  /**
   * Create feed item (MVP implementation)
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
    // Generate a new ID
    const newId = (mockFeedItems.length + 1).toString();
    
    // Add to mock data
    mockFeedItems.unshift({
      id: newId,
      type: item.type,
      title: item.title,
      description: item.description || null,
      bill_id: item.bill_id || null,
      roll_call_id: item.roll_call_id || null,
      people_id: item.people_id || null,
      action_date: item.action_date,
      subjects: item.subjects || [],
      districts: item.districts || [],
      metadata: item.metadata || {},
      created_at: new Date()
    });

    return newId;
  }
}
