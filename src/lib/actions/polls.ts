// ============================================================================
// CITIZENLY PHASE 2: POLL MANAGEMENT SERVER ACTIONS
// File: src/lib/actions/polls.ts
// ============================================================================

'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/database';
import { 
  Poll, 
  CreatePollInput, 
  UpdatePollInput, 
  SubmitPollResponseInput,
  PollFilters,
  PollQueryOptions,
  PollResultsResponse,
  PollEligibility,
  PollValidation,
  RateLimit
} from '@/lib/types/polls';
import { createNotification } from './notifications';
import { logAuditEvent } from './audit';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createPollSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  poll_type: z.enum(['yes_no', 'multiple_choice', 'approval_rating', 'ranked_choice']),
  options: z.object({
    options: z.array(z.string()).optional(),
    scale: z.object({
      min: z.number(),
      max: z.number(),
      labels: z.record(z.string()).optional()
    }).optional(),
    candidates: z.array(z.string()).optional()
  }).optional(),
  target_audience: z.object({
    congressional_districts: z.array(z.string()).optional(),
    states: z.array(z.string()).optional(),
    age_groups: z.array(z.string()).optional(),
    party_affiliations: z.array(z.string()).optional(),
    voter_registration_status: z.boolean().optional()
  }).optional(),
  starts_at: z.date().optional(),
  ends_at: z.date().optional(),
  max_responses: z.number().positive().optional(),
  requires_verification: z.boolean().default(true),
  allows_anonymous: z.boolean().default(false),
  show_results_before_vote: z.boolean().default(false),
  show_results_after_vote: z.boolean().default(true)
});

const submitResponseSchema = z.object({
  poll_id: z.string().uuid(),
  response_data: z.record(z.any()),
  response_time_seconds: z.number().positive().optional()
});

// ============================================================================
// RATE LIMITING
// ============================================================================

const rateLimits = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(userId: string, action: string, limit: number, windowMs: number): Promise<RateLimit> {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return {
      limit,
      remaining: limit - 1,
      reset: new Date(now + windowMs),
      blocked: false
    };
  }

  if (entry.count >= limit) {
    return {
      limit,
      remaining: 0,
      reset: new Date(entry.resetTime),
      blocked: true
    };
  }

  entry.count++;
  return {
    limit,
    remaining: limit - entry.count,
    reset: new Date(entry.resetTime),
    blocked: false
  };
}

// ============================================================================
// POLL CREATION
// ============================================================================

export async function createPoll(data: CreatePollInput): Promise<{ success: boolean; poll?: Poll; error?: string }> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Rate limiting - 5 polls per hour
    const rateLimit = await checkRateLimit(session.user.id, 'create_poll', 5, 60 * 60 * 1000);
    if (rateLimit.blocked) {
      return { success: false, error: 'Rate limit exceeded. Please try again later.' };
    }

    // Validate politician role
    const politician = await db.query(
      'SELECT id, congressional_district, state_code, is_verified FROM politicians WHERE user_id = $1',
      [session.user.id]
    );

    if (!politician.rows[0]) {
      return { success: false, error: 'Only verified politicians can create polls' };
    }

    if (!politician.rows[0].is_verified) {
      return { success: false, error: 'Politician verification required to create polls' };
    }

    // Validate input
    const validatedData = createPollSchema.parse(data);

    // Validate poll configuration
    const validation = await validatePollConfiguration(validatedData);
    if (!validation.valid) {
      return { success: false, error: validation.errors[0]?.message || 'Invalid poll configuration' };
    }

    // Insert poll
    const pollResult = await db.query(`
      INSERT INTO polls (
        politician_id, title, description, poll_type, options, target_audience,
        congressional_district, state_code, starts_at, ends_at, max_responses,
        requires_verification, allows_anonymous, show_results_before_vote, show_results_after_vote
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      politician.rows[0].id,
      validatedData.title,
      validatedData.description,
      validatedData.poll_type,
      JSON.stringify(validatedData.options || {}),
      JSON.stringify(validatedData.target_audience || {}),
      politician.rows[0].congressional_district,
      politician.rows[0].state_code,
      validatedData.starts_at || new Date(),
      validatedData.ends_at,
      validatedData.max_responses,
      validatedData.requires_verification,
      validatedData.allows_anonymous,
      validatedData.show_results_before_vote,
      validatedData.show_results_after_vote
    ]);

    const poll = pollResult.rows[0];

    // Log audit event
    await logAuditEvent({
      user_id: session.user.id,
      action: 'poll_created',
      resource_type: 'poll',
      resource_id: poll.id,
      details: { poll_title: poll.title, poll_type: poll.poll_type }
    });

    // Send notifications to constituents (if poll is active)
    if (validatedData.starts_at && validatedData.starts_at <= new Date()) {
      await notifyConstituentsOfNewPoll(poll);
    }

    revalidatePath('/dashboard/polls');
    return { success: true, poll };

  } catch (error) {
    console.error('Error creating poll:', error);
    return { success: false, error: 'Failed to create poll' };
  }
}

// ============================================================================
// POLL RETRIEVAL
// ============================================================================

export async function getPolls(
  filters: PollFilters = {}, 
  options: PollQueryOptions = {}
): Promise<{ polls: Poll[]; total: number; hasMore: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log('No session in getPolls, using test user for development');
      // For testing - remove this in production
      // throw new Error('Authentication required');
    }

    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = options;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    // For citizens, only show polls from their representatives
    if (session?.user?.id) {
      const user = await db.query(
        'SELECT u.role, a.congressional_district, a.state FROM users u LEFT JOIN addresses a ON u.id = a.user_id WHERE u.id = $1 AND a.is_primary = true',
        [session.user.id]
      );

      if (user.rows[0]?.role === 'citizen') {
        conditions.push(`congressional_district = $${++paramCount}`);
        params.push(user.rows[0].congressional_district);
      }
    }

    // Apply filters
    if (filters.politician_id) {
      conditions.push(`politician_id = $${++paramCount}`);
      params.push(filters.politician_id);
    }

    if (filters.status) {
      conditions.push(`status = $${++paramCount}`);
      params.push(filters.status);
    }

    if (filters.poll_type) {
      conditions.push(`poll_type = $${++paramCount}`);
      params.push(filters.poll_type);
    }

    if (filters.is_active !== undefined) {
      conditions.push(`is_active = $${++paramCount}`);
      params.push(filters.is_active);
    }

    if (filters.search) {
      conditions.push(`(title ILIKE $${++paramCount} OR description ILIKE $${++paramCount})`);
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Build query
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const pollsQuery = `
      SELECT p.*, u.first_name, u.last_name, pol.office_title, pol.office_level
      FROM polls p
      JOIN politicians pol ON p.politician_id = pol.id
      JOIN users u ON pol.user_id = u.id
      ${whereClause}
      ORDER BY p.${sort_by} ${sort_order}
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM polls p
      JOIN politicians pol ON p.politician_id = pol.id
      ${whereClause}
    `;

    const [pollsResult, countResult] = await Promise.all([
      db.query(pollsQuery, params),
      db.query(countQuery, params.slice(0, -2)) // Remove limit and offset for count
    ]);

    const polls = pollsResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const hasMore = offset + polls.length < total;

    return { polls, total, hasMore };

  } catch (error) {
    console.error('Error fetching polls:', error);
    throw new Error('Failed to fetch polls');
  }
}

// ============================================================================
// POLL DETAILS
// ============================================================================

export async function getPollById(pollId: string): Promise<Poll | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    const result = await db.query(`
      SELECT p.*, u.first_name, u.last_name, pol.office_title, pol.office_level
      FROM polls p
      JOIN politicians pol ON p.politician_id = pol.id
      JOIN users u ON pol.user_id = u.id
      WHERE p.id = $1
    `, [pollId]);

    if (!result.rows[0]) {
      return null;
    }

    // Check if user can access this poll
    const eligibility = await checkPollEligibility(session.user.id, pollId);
    if (!eligibility.eligible && !eligibility.can_view_results) {
      throw new Error('Not authorized to view this poll');
    }

    return result.rows[0];

  } catch (error) {
    console.error('Error fetching poll:', error);
    throw new Error('Failed to fetch poll');
  }
}

// ============================================================================
// POLL VOTING
// ============================================================================

export async function submitPollResponse(data: SubmitPollResponseInput): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Rate limiting - 10 votes per minute
    const rateLimit = await checkRateLimit(session.user.id, 'submit_vote', 10, 60 * 1000);
    if (rateLimit.blocked) {
      return { success: false, error: 'Too many votes. Please slow down.' };
    }

    // Validate input
    const validatedData = submitResponseSchema.parse(data);

    // Check poll eligibility
    const eligibility = await checkPollEligibility(session.user.id, validatedData.poll_id);
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reason || 'Not eligible to vote on this poll' };
    }

    if (eligibility.already_voted) {
      return { success: false, error: 'You have already voted on this poll' };
    }

    // Get poll details
    const poll = await db.query('SELECT * FROM polls WHERE id = $1', [validatedData.poll_id]);
    if (!poll.rows[0]) {
      return { success: false, error: 'Poll not found' };
    }

    if (!poll.rows[0].is_active || poll.rows[0].status !== 'active') {
      return { success: false, error: 'Poll is not currently active' };
    }

    // Check if poll has ended
    if (poll.rows[0].ends_at && new Date() > new Date(poll.rows[0].ends_at)) {
      return { success: false, error: 'Poll has ended' };
    }

    // Get user demographic data (anonymized)
    const user = await db.query(`
      SELECT a.congressional_district, a.state, 
             CASE 
               WHEN DATE_PART('year', AGE(u.date_of_birth)) BETWEEN 18 AND 24 THEN '18-24'
               WHEN DATE_PART('year', AGE(u.date_of_birth)) BETWEEN 25 AND 34 THEN '25-34'
               WHEN DATE_PART('year', AGE(u.date_of_birth)) BETWEEN 35 AND 44 THEN '35-44'
               WHEN DATE_PART('year', AGE(u.date_of_birth)) BETWEEN 45 AND 54 THEN '45-54'
               WHEN DATE_PART('year', AGE(u.date_of_birth)) BETWEEN 55 AND 64 THEN '55-64'
               WHEN DATE_PART('year', AGE(u.date_of_birth)) >= 65 THEN '65+'
               ELSE 'unknown'
             END as age_group
      FROM users u
      LEFT JOIN addresses a ON u.id = a.user_id AND a.is_primary = true
      WHERE u.id = $1
    `, [session.user.id]);

    const userData = user.rows[0];
    const demographicData = {
      age_group: userData?.age_group || 'unknown',
      district: userData?.congressional_district || 'unknown',
      party_affiliation: 'undeclared' // Could be added to user profile later
    };

    // Create response hash for duplicate detection
    const responseHash = createResponseHash(session.user.id, validatedData.poll_id, validatedData.response_data);

    // Insert response
    await db.query(`
      INSERT INTO poll_responses (
        poll_id, user_id, response_data, demographic_data, 
        response_hash, response_time_seconds, verification_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      validatedData.poll_id,
      session.user.id,
      JSON.stringify(validatedData.response_data),
      JSON.stringify(demographicData),
      responseHash,
      validatedData.response_time_seconds,
      100 // Full verification score for authenticated users
    ]);

    // Log audit event
    await logAuditEvent({
      user_id: session.user.id,
      action: 'poll_response_submitted',
      resource_type: 'poll',
      resource_id: validatedData.poll_id,
      details: { poll_type: poll.rows[0].poll_type }
    });

    revalidatePath(`/polls/${validatedData.poll_id}`);
    return { success: true };

  } catch (error) {
    console.error('Error submitting poll response:', error);
    return { success: false, error: 'Failed to submit response' };
  }
}

// ============================================================================
// POLL RESULTS
// ============================================================================

export async function getPollResults(pollId: string): Promise<PollResultsResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    // Check eligibility to view results
    const eligibility = await checkPollEligibility(session.user.id, pollId);
    if (!eligibility.can_view_results) {
      throw new Error('Not authorized to view poll results');
    }

    // Get poll details
    const poll = await getPollById(pollId);
    if (!poll) {
      throw new Error('Poll not found');
    }

    // Get response distribution
    const responses = await db.query(`
      SELECT response_data, demographic_data
      FROM poll_responses
      WHERE poll_id = $1
    `, [pollId]);

    // Calculate response distribution based on poll type
    const responseDistribution = calculateResponseDistribution(poll.poll_type, responses.rows);

    // Calculate demographic breakdown
    const demographicBreakdown = calculateDemographicBreakdown(responses.rows);

    // Calculate time remaining
    const timeRemaining = poll.ends_at ? Math.max(0, new Date(poll.ends_at).getTime() - Date.now()) / 1000 : undefined;

    // Check if user has voted
    const userVote = await db.query(
      'SELECT id FROM poll_responses WHERE poll_id = $1 AND user_id = $2',
      [pollId, session.user.id]
    );

    return {
      poll,
      response_distribution: responseDistribution,
      demographic_breakdown: demographicBreakdown,
      total_responses: responses.rows.length,
      response_rate: calculateResponseRate(poll, responses.rows.length),
      user_has_voted: userVote.rows.length > 0,
      time_remaining: timeRemaining
    };

  } catch (error) {
    console.error('Error fetching poll results:', error);
    throw new Error('Failed to fetch poll results');
  }
}

// ============================================================================
// POLL MANAGEMENT
// ============================================================================

export async function updatePoll(pollId: string, data: UpdatePollInput): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify ownership
    const poll = await db.query(`
      SELECT p.id FROM polls p
      JOIN politicians pol ON p.politician_id = pol.id
      WHERE p.id = $1 AND pol.user_id = $2
    `, [pollId, session.user.id]);

    if (!poll.rows[0]) {
      return { success: false, error: 'Poll not found or access denied' };
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (data.title) {
      updates.push(`title = $${++paramCount}`);
      params.push(data.title);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${++paramCount}`);
      params.push(data.description);
    }

    if (data.ends_at !== undefined) {
      updates.push(`ends_at = $${++paramCount}`);
      params.push(data.ends_at);
    }

    if (data.status) {
      updates.push(`status = $${++paramCount}`);
      params.push(data.status);
    }

    if (data.is_active !== undefined) {
      updates.push(`is_active = $${++paramCount}`);
      params.push(data.is_active);
    }

    if (updates.length === 0) {
      return { success: false, error: 'No updates provided' };
    }

    updates.push(`updated_at = NOW()`);
    params.push(pollId);

    await db.query(`
      UPDATE polls 
      SET ${updates.join(', ')}
      WHERE id = $${++paramCount}
    `, params);

    await logAuditEvent({
      user_id: session.user.id,
      action: 'poll_updated',
      resource_type: 'poll',
      resource_id: pollId,
      details: data
    });

    revalidatePath('/dashboard/polls');
    revalidatePath(`/polls/${pollId}`);
    return { success: true };

  } catch (error) {
    console.error('Error updating poll:', error);
    return { success: false, error: 'Failed to update poll' };
  }
}

export async function deletePoll(pollId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify ownership and check if poll has responses
    const poll = await db.query(`
      SELECT p.id, p.total_responses 
      FROM polls p
      JOIN politicians pol ON p.politician_id = pol.id
      WHERE p.id = $1 AND pol.user_id = $2
    `, [pollId, session.user.id]);

    if (!poll.rows[0]) {
      return { success: false, error: 'Poll not found or access denied' };
    }

    if (poll.rows[0].total_responses > 0) {
      return { success: false, error: 'Cannot delete poll with responses. Archive it instead.' };
    }

    await db.query('DELETE FROM polls WHERE id = $1', [pollId]);

    await logAuditEvent({
      user_id: session.user.id,
      action: 'poll_deleted',
      resource_type: 'poll',
      resource_id: pollId,
      details: {}
    });

    revalidatePath('/dashboard/polls');
    return { success: true };

  } catch (error) {
    console.error('Error deleting poll:', error);
    return { success: false, error: 'Failed to delete poll' };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function checkPollEligibility(userId: string, pollId: string): Promise<PollEligibility> {
  try {
    // Get user and poll info
    const [userResult, pollResult, responseResult] = await Promise.all([
      db.query(`
        SELECT u.role, u.verification_status, a.congressional_district, a.state 
        FROM users u 
        LEFT JOIN addresses a ON u.id = a.user_id AND a.is_primary = true
        WHERE u.id = $1
      `, [userId]),
      db.query('SELECT target_districts, target_constituency, requires_verification, allows_anonymous, status, is_active FROM polls WHERE id = $1', [pollId]),
      db.query('SELECT id FROM poll_responses WHERE poll_id = $1 AND user_id = $2', [pollId, userId])
    ]);

    const user = userResult.rows[0];
    const poll = pollResult.rows[0];
    const alreadyVoted = responseResult.rows.length > 0;

    if (!user || !poll) {
      return { eligible: false, reason: 'User or poll not found', can_view_results: false, can_vote: false, already_voted: false };
    }

    // Check if poll is active
    if (!poll.is_active || poll.status !== 'active') {
      return { eligible: false, reason: 'Poll is not active', can_view_results: true, can_vote: false, already_voted: alreadyVoted };
    }

    // Check verification requirements
    if (poll.requires_verification && user.verification_status !== 'verified') {
      return { eligible: false, reason: 'Verification required', can_view_results: false, can_vote: false, already_voted: alreadyVoted };
    }

    // Check district eligibility
    if (user.congressional_district !== poll.congressional_district) {
      return { eligible: false, reason: 'Not in poll constituency', can_view_results: false, can_vote: false, already_voted: alreadyVoted };
    }

    return { 
      eligible: true, 
      can_view_results: true, 
      can_vote: !alreadyVoted, 
      already_voted: alreadyVoted 
    };

  } catch (error) {
    console.error('Error checking poll eligibility:', error);
    return { eligible: false, reason: 'Error checking eligibility', can_view_results: false, can_vote: false, already_voted: false };
  }
}

async function validatePollConfiguration(data: CreatePollInput): Promise<PollValidation> {
  const errors: any[] = [];

  // Validate poll type specific requirements
  if (data.poll_type === 'multiple_choice' && (!data.options?.options || data.options.options.length < 2)) {
    errors.push({ code: 'INVALID_OPTIONS', message: 'Multiple choice polls require at least 2 options' });
  }

  if (data.poll_type === 'approval_rating' && !data.options?.scale) {
    errors.push({ code: 'INVALID_SCALE', message: 'Approval rating polls require a scale configuration' });
  }

  // Validate dates
  if (data.ends_at && data.starts_at && data.ends_at <= data.starts_at) {
    errors.push({ code: 'INVALID_DATES', message: 'End date must be after start date' });
  }

  return { valid: errors.length === 0, errors, warnings: [] };
}

function createResponseHash(userId: string, pollId: string, responseData: any): string {
  const crypto = require('crypto');
  const data = `${userId}:${pollId}:${JSON.stringify(responseData)}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

function calculateResponseDistribution(pollType: string, responses: any[]): any {
  // Implementation depends on poll type
  switch (pollType) {
    case 'yes_no':
      return responses.reduce((acc, r) => {
        const answer = r.response_data.answer;
        acc[answer] = (acc[answer] || 0) + 1;
        return acc;
      }, {});
    
    case 'multiple_choice':
      return responses.reduce((acc, r) => {
        const selected = r.response_data.selected || [];
        selected.forEach((option: string) => {
          acc[option] = (acc[option] || 0) + 1;
        });
        return acc;
      }, {});
    
    default:
      return {};
  }
}

function calculateDemographicBreakdown(responses: any[]): any {
  return responses.reduce((acc, r) => {
    const demo = r.demographic_data;
    
    // Age groups
    if (demo.age_group) {
      acc.age_groups = acc.age_groups || {};
      acc.age_groups[demo.age_group] = (acc.age_groups[demo.age_group] || 0) + 1;
    }
    
    // Districts
    if (demo.district) {
      acc.districts = acc.districts || {};
      acc.districts[demo.district] = (acc.districts[demo.district] || 0) + 1;
    }
    
    return acc;
  }, {});
}

function calculateResponseRate(poll: Poll, responseCount: number): number {
  // This would need to be calculated based on eligible voter count
  // For now, return a placeholder
  return responseCount > 0 ? (responseCount / (poll.max_responses || 1000)) * 100 : 0;
}

async function notifyConstituentsOfNewPoll(poll: Poll): Promise<void> {
  // Get all verified users in the poll's district
  const constituents = await db.query(`
    SELECT u.id FROM users u
    JOIN addresses a ON u.id = a.user_id AND a.is_primary = true
    WHERE a.congressional_district = $1 
    AND u.verification_status = 'verified'
    AND u.role = 'citizen'
  `, [poll.congressional_district]);

  // Create notifications for each constituent
  for (const constituent of constituents.rows) {
    await createNotification({
      user_id: constituent.id,
      type: 'new_poll',
      title: `New Poll: ${poll.title}`,
      content: `Your representative has created a new poll. Cast your vote now!`,
      data: {
        poll_id: poll.id,
        poll_title: poll.title,
        urgency: 'medium'
      },
      channels: ['email', 'push'],
      priority: 7
    });
  }
}
