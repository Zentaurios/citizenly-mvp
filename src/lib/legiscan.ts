/**
 * LegiScan API Service
 * Handles integration with LegiScan API for Nevada legislative data
 * https://legiscan.com/legiscan
 */

export interface LegiScanSession {
  session_id: number;
  state_id: number;
  year_start: number;
  year_end: number;
  prefile: number;
  sine_die: number;
  prior: number;
  special: number;
  session_name: string;
  session_title: string;
  session_tag: string;
}

export interface LegiScanBillSummary {
  bill_id: number;
  number: string;
  change_hash: string;
  url: string;
  status_date: string;
  status: number;
  last_action_date: string;
  last_action: string;
  title: string;
  description: string;
}

export interface LegiScanBillDetail {
  bill_id: number;
  session_id: number;
  bill_number: string;
  bill_type: string;
  title: string;
  description: string;
  status: number;
  status_date: string;
  last_action: string;
  last_action_date: string;
  chamber: string;
  committee: {
    committee_id: number;
    name: string;
  } | null;
  subjects: string[];
  sponsors: Array<{
    people_id: number;
    party: string;
    role: string;
    name: string;
    first_name: string;
    last_name: string;
    sponsor_type_id: number;
    sponsor_order: number;
  }>;
  votes: Array<{
    roll_call_id: number;
    date: string;
    desc: string;
    yea: number;
    nay: number;
    nv: number;
    absent: number;
    total: number;
    passed: number;
    chamber: string;
    url: string;
  }>;
  texts: Array<{
    doc_id: number;
    type: string;
    date: string;
    url: string;
    state_url: string;
  }>;
  change_hash: string;
  url: string;
  state_url: string;
}

export interface LegiScanPerson {
  people_id: number;
  person_hash: string;
  party: string;
  role: string;
  name: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  nickname?: string;
  district: string;
  ftm_eid?: number;
  votesmart_id?: number;
  opensecrets_id?: string;
  ballotpedia?: string;
  committee_sponsor?: Array<{
    committee_id: number;
    position: string;
  }>;
  committee_id?: number;
}

export interface LegiScanRollCall {
  roll_call_id: number;
  bill_id: number;
  date: string;
  desc: string;
  yea: number;
  nay: number;
  nv: number;
  absent: number;
  total: number;
  passed: number;
  chamber: string;
  votes: Array<{
    people_id: number;
    vote_id: number;
    vote_text: string;
  }>;
  url: string;
  state_url: string;
}

export class LegiScanService {
  private apiKey: string;
  private baseUrl = 'https://api.legiscan.com/';
  private rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;

  constructor() {
    this.apiKey = process.env.LEGISCAN_API_KEY!;
    if (!this.apiKey) {
      throw new Error('LEGISCAN_API_KEY environment variable is required');
    }
  }

  /**
   * Apply rate limiting to respect LegiScan API limits
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Make API request with error handling and retries
   */
  private async makeRequest(endpoint: string, retries = 3): Promise<any> {
    await this.rateLimit();

    const url = `${this.baseUrl}?key=${this.apiKey}&${endpoint}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Citizenly-MVP/1.0',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.status === 'ERROR') {
          throw new Error(`LegiScan API Error: ${data.alert.message}`);
        }

        return data;
      } catch (error) {
        console.error(`LegiScan API attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  /**
   * Get all sessions for Nevada
   */
  async getNevadaSessions(): Promise<LegiScanSession[]> {
    const data = await this.makeRequest('op=getSessionList&state=NV');
    return data.sessions || [];
  }

  /**
   * Get master list of bills for a session with change hashes
   */
  async getMasterListRaw(sessionId: number): Promise<{
    session: LegiScanSession;
    masterlist: LegiScanBillSummary[];
  }> {
    const data = await this.makeRequest(`op=getMasterListRaw&id=${sessionId}`);
    return {
      session: data.session,
      masterlist: Object.values(data.masterlist || {}) as LegiScanBillSummary[]
    };
  }

  /**
   * Get detailed bill information
   */
  async getBill(billId: number): Promise<{ bill: LegiScanBillDetail }> {
    const data = await this.makeRequest(`op=getBill&id=${billId}`);
    return { bill: data.bill };
  }

  /**
   * Get roll call details
   */
  async getRollCall(rollCallId: number): Promise<{ roll_call: LegiScanRollCall }> {
    const data = await this.makeRequest(`op=getRollCall&id=${rollCallId}`);
    return { roll_call: data.roll_call };
  }

  /**
   * Get legislator information
   */
  async getPerson(peopleId: number): Promise<{ person: LegiScanPerson }> {
    const data = await this.makeRequest(`op=getPerson&id=${peopleId}`);
    return { person: data.person };
  }

  /**
   * Get list of legislators for a session
   */
  async getSessionPeople(sessionId: number): Promise<LegiScanPerson[]> {
    const data = await this.makeRequest(`op=getSessionPeople&id=${sessionId}`);
    return Object.values(data.sessionpeople?.people || {}) as LegiScanPerson[];
  }

  /**
   * Search bills by keyword (limited use - premium feature)
   */
  async searchBills(query: string, state = 'NV', year?: number): Promise<any> {
    let endpoint = `op=search&query=${encodeURIComponent(query)}&state=${state}`;
    if (year) {
      endpoint += `&year=${year}`;
    }
    
    const data = await this.makeRequest(endpoint);
    return data.searchresult || [];
  }

  /**
   * Get bill status codes and their meanings
   */
  getStatusText(statusCode: number): string {
    const statusMap: Record<number, string> = {
      1: 'Introduced',
      2: 'Engrossed',
      3: 'Enrolled',
      4: 'Passed',
      5: 'Vetoed',
      6: 'Failed/Dead'
    };
    
    return statusMap[statusCode] || 'Unknown';
  }

  /**
   * Parse chamber from LegiScan chamber field
   */
  getChamberName(chamber: string): string {
    const chamberMap: Record<string, string> = {
      'H': 'House',
      'S': 'Senate',
      'E': 'Executive'
    };
    
    return chamberMap[chamber] || chamber;
  }

  /**
   * Parse party abbreviation
   */
  getPartyName(party: string): string {
    const partyMap: Record<string, string> = {
      'D': 'Democratic',
      'R': 'Republican',
      'I': 'Independent',
      'L': 'Libertarian',
      'G': 'Green',
      'N': 'Nonpartisan'
    };
    
    return partyMap[party] || party;
  }

  /**
   * Determine if a district affects a user based on their address
   */
  doesDistrictAffectUser(district: string, userDistricts: string[]): boolean {
    // Nevada district formats: "HD-025", "SD-04", "NV-02"
    return userDistricts.some(userDistrict => 
      userDistrict === district || 
      district.includes(userDistrict) ||
      userDistrict.includes(district)
    );
  }

  /**
   * Extract district information from legislator role and district
   */
  parseDistrict(role: string, district: string, level: 'state' | 'federal'): string {
    if (level === 'federal') {
      return `NV-${district.padStart(2, '0')}`;
    }
    
    if (role === 'Sen') {
      return `SD-${district.padStart(2, '0')}`;
    } else if (role === 'Rep') {
      return `HD-${district.padStart(3, '0')}`;
    }
    
    return district;
  }
}

// Export a singleton instance
export const legiscanService = new LegiScanService();