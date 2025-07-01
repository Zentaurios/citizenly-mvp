// ============================================================================
// CITIZENLY PHASE 2: POLLING SYSTEM TYPESCRIPT TYPES
// ============================================================================

// Base database entity type
interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// POLL TYPES
// ============================================================================

export type PollType = 'yes_no' | 'multiple_choice' | 'approval_rating' | 'ranked_choice';
export type PollStatus = 'draft' | 'active' | 'closed' | 'archived';

export interface PollOptions {
  // For multiple choice polls
  options?: string[];
  // For approval rating polls
  scale?: {
    min: number;
    max: number;
    labels?: Record<number, string>;
  };
  // For ranked choice polls
  candidates?: string[];
}

export interface TargetAudience {
  congressional_districts?: string[];
  states?: string[];
  age_groups?: string[];
  party_affiliations?: string[];
  voter_registration_status?: boolean;
}

export interface Poll extends BaseEntity {
  politician_id: string;
  title: string;
  description?: string;
  poll_type: PollType;
  options?: PollOptions;
  target_audience: TargetAudience;
  congressional_district?: string;
  state_code?: string;
  status: PollStatus;
  is_active: boolean;
  starts_at: Date;
  ends_at?: Date;
  max_responses?: number;
  requires_verification: boolean;
  allows_anonymous: boolean;
  show_results_before_vote: boolean;
  show_results_after_vote: boolean;
  total_responses: number;
  response_rate?: number;
  engagement_score?: number;
}

// For poll creation
export interface CreatePollInput {
  title: string;
  description?: string;
  poll_type: PollType;
  options?: PollOptions;
  target_audience?: TargetAudience;
  starts_at?: Date;
  ends_at?: Date;
  max_responses?: number;
  requires_verification?: boolean;
  allows_anonymous?: boolean;
  show_results_before_vote?: boolean;
  show_results_after_vote?: boolean;
}

// For poll updates
export interface UpdatePollInput {
  title?: string;
  description?: string;
  ends_at?: Date;
  status?: PollStatus;
  is_active?: boolean;
}

// ============================================================================
// POLL RESPONSE TYPES
// ============================================================================

export interface YesNoResponse {
  answer: 'yes' | 'no' | 'undecided';
  confidence?: number; // 1-10 scale
}

export interface MultipleChoiceResponse {
  selected: string[];
  primary?: string; // If they can rank their top choice
}

export interface ApprovalRatingResponse {
  rating: number;
  category: 'strongly_disapprove' | 'disapprove' | 'neutral' | 'approve' | 'strongly_approve';
}

export interface RankedChoiceResponse {
  rankings: Record<string, number>; // candidate_id -> rank
}

export type PollResponseData = YesNoResponse | MultipleChoiceResponse | ApprovalRatingResponse | RankedChoiceResponse;

export interface DemographicData {
  age_group?: string;
  district?: string;
  party_affiliation?: string;
  voter_registration_status?: boolean;
  education_level?: string;
  employment_status?: string;
}

export interface PollResponse extends BaseEntity {
  poll_id: string;
  user_id: string;
  response_data: PollResponseData;
  demographic_data: DemographicData;
  ip_address?: string;
  user_agent?: string;
  response_hash?: string;
  verification_score: number;
  response_time_seconds?: number;
  device_type?: 'mobile' | 'desktop' | 'tablet';
}

// For submitting poll responses
export interface SubmitPollResponseInput {
  poll_id: string;
  response_data: PollResponseData;
  response_time_seconds?: number;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType = 
  | 'new_poll' 
  | 'poll_results' 
  | 'poll_ending' 
  | 'poll_reminder' 
  | 'system_announcement';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface NotificationData {
  poll_id?: string;
  politician_name?: string;
  urgency?: 'low' | 'medium' | 'high';
  action_url?: string;
  poll_title?: string;
  poll_end_time?: Date;
}

export interface Notification extends BaseEntity {
  user_id: string;
  type: NotificationType;
  title: string;
  content?: string;
  data: NotificationData;
  channels: NotificationChannel[];
  is_read: boolean;
  is_sent: boolean;
  sent_at?: Date;
  read_at?: Date;
  email_status?: DeliveryStatus;
  sms_status?: DeliveryStatus;
  push_status?: DeliveryStatus;
  priority: number;
  scheduled_for?: Date;
  expires_at?: Date;
}

// For creating notifications
export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  content?: string;
  data?: NotificationData;
  channels?: NotificationChannel[];
  priority?: number;
  scheduled_for?: Date;
  expires_at?: Date;
}

// ============================================================================
// POLL ANALYTICS TYPES
// ============================================================================

export interface DemographicBreakdown {
  age_groups?: Record<string, number>;
  districts?: Record<string, number>;
  party_affiliations?: Record<string, number>;
  education_levels?: Record<string, number>;
}

export interface ResponseDistribution {
  // For yes/no polls
  yes?: number;
  no?: number;
  undecided?: number;
  
  // For multiple choice polls
  options?: Record<string, number>;
  
  // For approval rating polls
  ratings?: Record<number, number>;
  average_rating?: number;
  
  // For ranked choice polls
  first_choice?: Record<string, number>;
  final_results?: Record<string, number>;
}

export interface GeographicDistribution {
  by_district?: Record<string, number>;
  by_state?: Record<string, number>;
  by_county?: Record<string, number>;
}

export interface PollAnalytics extends BaseEntity {
  poll_id: string;
  snapshot_date: Date;
  snapshot_hour?: number;
  total_responses: number;
  unique_responses: number;
  response_rate?: number;
  demographic_breakdown: DemographicBreakdown;
  response_distribution: ResponseDistribution;
  avg_response_time?: number;
  completion_rate?: number;
  geographic_distribution: GeographicDistribution;
}

// ============================================================================
// NOTIFICATION PREFERENCES TYPES
// ============================================================================

export type DigestFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly';

export interface NotificationPreferences extends BaseEntity {
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  new_poll_notifications: boolean;
  poll_result_notifications: boolean;
  poll_reminder_notifications: boolean;
  poll_ending_notifications: boolean;
  system_notifications: boolean;
  digest_frequency: DigestFrequency;
  quiet_hours_start: string; // Time format "HH:MM"
  quiet_hours_end: string;
  timezone: string;
}

// For updating notification preferences
export interface UpdateNotificationPreferencesInput {
  email_enabled?: boolean;
  sms_enabled?: boolean;
  push_enabled?: boolean;
  in_app_enabled?: boolean;
  new_poll_notifications?: boolean;
  poll_result_notifications?: boolean;
  poll_reminder_notifications?: boolean;
  poll_ending_notifications?: boolean;
  system_notifications?: boolean;
  digest_frequency?: DigestFrequency;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PollListResponse {
  polls: Poll[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface PollResultsResponse {
  poll: Poll;
  response_distribution: ResponseDistribution;
  demographic_breakdown: DemographicBreakdown;
  total_responses: number;
  response_rate: number;
  user_has_voted: boolean;
  time_remaining?: number; // seconds until poll closes
}

export interface PollAnalyticsResponse {
  poll: Poll;
  analytics: PollAnalytics;
  historical_data: PollAnalytics[];
  engagement_metrics: {
    participation_rate: number;
    completion_rate: number;
    avg_response_time: number;
    peak_response_times: Array<{
      hour: number;
      responses: number;
    }>;
  };
}

// ============================================================================
// FILTER AND QUERY TYPES
// ============================================================================

export interface PollFilters {
  politician_id?: string;
  status?: PollStatus;
  poll_type?: PollType;
  is_active?: boolean;
  starts_after?: Date;
  ends_before?: Date;
  congressional_district?: string;
  state_code?: string;
  search?: string; // Search in title/description
}

export interface PollQueryOptions {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'starts_at' | 'ends_at' | 'total_responses' | 'response_rate';
  sort_order?: 'asc' | 'desc';
  include_draft?: boolean;
  include_closed?: boolean;
}

// ============================================================================
// REAL-TIME TYPES
// ============================================================================

export interface RealTimePollUpdate {
  poll_id: string;
  type: 'new_response' | 'poll_closed' | 'poll_started' | 'results_updated';
  data: {
    total_responses?: number;
    new_response_data?: PollResponseData;
    updated_distribution?: ResponseDistribution;
    poll_status?: PollStatus;
  };
  timestamp: Date;
}

export interface WebSocketMessage {
  type: 'poll_update' | 'notification' | 'system_message';
  data: RealTimePollUpdate | Notification | any;
  user_id?: string;
  channel?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface PollError {
  code: string;
  message: string;
  field?: string;
}

export interface APIError {
  error: string;
  details?: PollError[];
  status: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Type for poll eligibility checking
export interface PollEligibility {
  eligible: boolean;
  reason?: string;
  can_view_results: boolean;
  can_vote: boolean;
  already_voted: boolean;
}

// Type for poll validation
export interface PollValidation {
  valid: boolean;
  errors: PollError[];
  warnings: PollError[];
}

// Type for rate limiting
export interface RateLimit {
  limit: number;
  remaining: number;
  reset: Date;
  blocked: boolean;
}

// ============================================================================
// USER AND POLITICIAN TYPES (extended from existing)
// ============================================================================

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone?: string;
  role: 'citizen' | 'politician' | 'admin';
  verification_status: 'pending' | 'verified' | 'rejected';
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  congressional_district?: string;
  state_senate_district?: string;
  state_house_district?: string;
  county?: string;
  is_primary: boolean;
}

export interface Politician {
  id: string;
  user_id: string;
  office_level: 'federal' | 'state' | 'county' | 'city';
  office_title: string;
  district?: string;
  state: string;
  party?: string;
  congressional_district?: string;
  state_code?: string;
  is_verified: boolean;
  premium_access: boolean;
  first_name?: string; // From joined user data
  last_name?: string; // From joined user data
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface Session {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'citizen' | 'politician' | 'admin';
    verification_status: string;
  };
}

export default {
  Poll,
  PollResponse,
  Notification,
  PollAnalytics,
  NotificationPreferences,
  CreatePollInput,
  SubmitPollResponseInput,
  PollResultsResponse,
  RealTimePollUpdate
};
