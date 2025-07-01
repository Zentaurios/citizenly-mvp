// ============================================================================
// CITIZENLY MVP: SIMPLIFIED LEGISLATIVE POLL VOTING API
// File: src/app/api/legislative-polls/[id]/vote/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { submitPollResponse, getPollResults } from '@/lib/actions/polls';
import { db } from '@/lib/database';

// ============================================================================
// VALIDATION SCHEMAS - SIMPLIFIED FOR MVP
// ============================================================================

const submitLegislativeVoteSchema = z.object({
  response: z.enum(['approve', 'disapprove', 'no_opinion']),
  response_time_seconds: z.number().min(1).max(3600).optional()
});

// ============================================================================
// RATE LIMITING & FRAUD DETECTION
// ============================================================================

const rateLimits = new Map<string, { count: number; resetTime: number }>();
const suspiciousActivity = new Map<string, { attempts: number; lastAttempt: number }>();

function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimits.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

function detectSuspiciousActivity(userId: string, pollId: string, responseTime?: number): {
  suspicious: boolean;
  reason?: string;
  confidenceScore: number;
} {
  const key = `${userId}:${pollId}`;
  const now = Date.now();
  
  let suspicious = false;
  let reason = '';
  let confidenceScore = 100;

  // Check for extremely fast responses (likely bots)
  if (responseTime && responseTime < 3) {
    suspicious = true;
    reason = 'Response time too fast';
    confidenceScore = 20;
  }

  // Check for repeated rapid attempts
  const activity = suspiciousActivity.get(key);
  if (activity) {
    const timeSinceLastAttempt = now - activity.lastAttempt;
    if (timeSinceLastAttempt < 1000 && activity.attempts > 2) {
      suspicious = true;
      reason = 'Rapid repeated attempts';
      confidenceScore = 10;
    }
  }

  // Update activity tracking
  suspiciousActivity.set(key, {
    attempts: (activity?.attempts || 0) + 1,
    lastAttempt: now
  });

  return { suspicious, reason, confidenceScore };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

function createErrorResponse(message: string, status: number = 400, details?: any) {
  return NextResponse.json(
    { 
      error: message, 
      status,
      details,
      timestamp: new Date().toISOString()
    }, 
    { status }
  );
}

// ============================================================================
// POST - SUBMIT SIMPLIFIED VOTE
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get IP and user agent for fraud detection
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Rate limiting - 3 votes per minute per IP
    if (!checkRateLimit(ip, 3, 60 * 1000)) {
      return createErrorResponse('Rate limit exceeded. Please slow down.', 429);
    }

    // Authenticate user
    const session = await auth();
    const userId = session?.user?.id || '060efb96-e696-4f6a-8803-e4d8842d700c'; // Test user for development (admin)
    if (!userId) {
      return createErrorResponse('Authentication required', 401);
    }

    // Additional rate limiting per user - 2 votes per minute
    if (!checkRateLimit(userId, 2, 60 * 1000)) {
      return createErrorResponse('Too many votes. Please wait a moment.', 429);
    }

    // Validate poll ID
    const resolvedParams = await params;
    const pollId = resolvedParams.id;
    if (!pollId || pollId.length !== 36) {
      return createErrorResponse('Invalid poll ID format', 400);
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    // Validate input schema
    let validatedData;
    try {
      validatedData = submitLegislativeVoteSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          'Invalid vote data',
          400,
          error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        );
      }
      return createErrorResponse('Invalid vote format', 400);
    }

    // Fraud detection
    const fraudCheck = detectSuspiciousActivity(
      userId,
      pollId,
      validatedData.response_time_seconds
    );

    if (fraudCheck.suspicious && fraudCheck.confidenceScore < 50) {
      console.warn('Suspicious voting activity detected:', {
        userId: userId,
        pollId,
        reason: fraudCheck.reason,
        ip,
        userAgent
      });
    }

    // Convert MVP response to existing poll format
    // approve=3, no_opinion=2, disapprove=1 (matches our scale)
    const ratingMap = {
      'approve': 3,
      'no_opinion': 2,
      'disapprove': 1
    };

    const categoryMap = {
      'approve': 'approve',
      'no_opinion': 'neutral', 
      'disapprove': 'disapprove'
    };

    // Prepare vote submission data for existing infrastructure
    const voteData = {
      poll_id: pollId,
      response_data: {
        rating: ratingMap[validatedData.response],
        category: categoryMap[validatedData.response]
      },
      response_time_seconds: validatedData.response_time_seconds,
      // MVP-specific fields
      simple_response: validatedData.response
    };

    // Simple direct vote submission for MVP
    try {
      // Check if poll exists and is active
      const pollCheck = await db.query('SELECT id, is_active, status, end_date FROM polls WHERE id = $1', [pollId]);
      if (pollCheck.rows.length === 0) {
        return createErrorResponse('Poll not found', 404);
      }
      
      const poll = pollCheck.rows[0];
      if (!poll.is_active || poll.status !== 'active') {
        return createErrorResponse('This poll is no longer active', 410);
      }
      
      if (poll.end_date && new Date() > new Date(poll.end_date)) {
        return createErrorResponse('This poll has ended', 410);
      }

      // Check if user already voted
      const existingVote = await db.query('SELECT id FROM poll_responses WHERE poll_id = $1 AND user_id = $2', [pollId, userId]);
      if (existingVote.rows.length > 0) {
        return createErrorResponse('You have already voted on this poll', 409);
      }

      // Insert vote
      const responseData = {
        rating: ratingMap[validatedData.response],
        category: categoryMap[validatedData.response]
      };

      await db.query(`
        INSERT INTO poll_responses (
          id, poll_id, user_id, response_data, 
          simple_response, submitted_at
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, NOW()
        )
      `, [
        pollId, 
        userId, 
        JSON.stringify(responseData),
        validatedData.response
      ]);

      // Get simple vote counts
      const countsResult = await db.query(`
        SELECT simple_response, COUNT(*) as count
        FROM poll_responses 
        WHERE poll_id = $1 
        GROUP BY simple_response
      `, [pollId]);

      const counts = { approve: 0, disapprove: 0, no_opinion: 0 };
      countsResult.rows.forEach(row => {
        counts[row.simple_response] = parseInt(row.count);
      });

      const totalResponses = counts.approve + counts.disapprove + counts.no_opinion;
      const pollResults = {
        total_responses: totalResponses,
        approve_count: counts.approve,
        disapprove_count: counts.disapprove,
        no_opinion_count: counts.no_opinion,
        approval_percentage: totalResponses > 0 ? Math.round((counts.approve / totalResponses) * 100) : 0
      };

      // Return simplified success response
      return NextResponse.json({
        success: true,
        message: 'Vote submitted successfully',
        data: {
          vote_accepted: true,
          your_vote: validatedData.response,
          poll_results: pollResults,
          confidence_score: fraudCheck.confidenceScore
        }
      }, { status: 201 });

    } catch (dbError) {
      console.error('Database error submitting vote:', dbError);
      return createErrorResponse('Failed to submit vote', 500);
    }

  } catch (error) {
    console.error('Error in POST /api/legislative-polls/[id]/vote:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// ============================================================================
// GET - CHECK VOTE STATUS
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting - 20 requests per minute per IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    
    if (!checkRateLimit(`${ip}:check`, 20, 60 * 1000)) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    // Authenticate user
    const session = await auth();
    const userId = session?.user?.id || '060efb96-e696-4f6a-8803-e4d8842d700c'; // Test user for development (admin)
    if (!userId) {
      return createErrorResponse('Authentication required', 401);
    }

    // Validate poll ID
    const resolvedParams = await params;
    const pollId = resolvedParams.id;
    if (!pollId || pollId.length !== 36) {
      return createErrorResponse('Invalid poll ID format', 400);
    }

    try {
      // Simple check - just see if user has voted and get basic poll info
      const [pollResult, responseResult] = await Promise.all([
        db.query('SELECT id, title, question, context_bill_id, is_active, status, end_date FROM polls WHERE id = $1', [pollId]),
        db.query('SELECT id FROM poll_responses WHERE poll_id = $1 AND user_id = $2', [pollId, userId])
      ]);

      if (pollResult.rows.length === 0) {
        return createErrorResponse('Poll not found', 404);
      }

      const poll = pollResult.rows[0];
      const hasVoted = responseResult.rows.length > 0;
      const isActive = poll.is_active && poll.status === 'active';
      const timeRemaining = poll.end_date ? Math.max(0, Math.floor((new Date(poll.end_date).getTime() - Date.now()) / 1000)) : null;

      const voteStatus = {
        has_voted: hasVoted,
        can_vote: !hasVoted && isActive,
        poll_active: isActive,
        time_remaining: timeRemaining,
        poll_info: {
          question: poll.question || poll.title,
          bill_id: poll.context_bill_id,
          total_responses: 0 // Will be calculated if needed
        }
      };

      return NextResponse.json({
        success: true,
        data: voteStatus
      });

    } catch (error) {
      console.error('Error checking vote status:', error);
      return createErrorResponse('Failed to check vote status', 500);
    }

  } catch (error) {
    console.error('Error in GET /api/legislative-polls/[id]/vote:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// ============================================================================
// OPTIONS - CORS PREFLIGHT
// ============================================================================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}