// ============================================================================
// CITIZENLY PHASE 2: POLL VOTE SUBMISSION API ROUTE
// File: src/app/api/polls/[id]/vote/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { submitPollResponse, getPollResults } from '@/lib/actions/polls';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const yesNoResponseSchema = z.object({
  answer: z.enum(['yes', 'no', 'undecided']),
  confidence: z.number().min(1).max(10).optional()
});

const multipleChoiceResponseSchema = z.object({
  selected: z.array(z.string()).min(1),
  primary: z.string().optional()
});

const approvalRatingResponseSchema = z.object({
  rating: z.number().min(1).max(5),
  category: z.enum(['strongly_disapprove', 'disapprove', 'neutral', 'approve', 'strongly_approve'])
});

const rankedChoiceResponseSchema = z.object({
  rankings: z.record(z.number())
});

const submitVoteSchema = z.object({
  poll_type: z.enum(['yes_no', 'multiple_choice', 'approval_rating', 'ranked_choice']),
  response_data: z.union([
    yesNoResponseSchema,
    multipleChoiceResponseSchema,
    approvalRatingResponseSchema,
    rankedChoiceResponseSchema
  ]),
  response_time_seconds: z.number().min(1).max(3600).optional(), // Max 1 hour
  device_info: z.object({
    type: z.enum(['mobile', 'desktop', 'tablet']).optional(),
    user_agent: z.string().max(500).optional()
  }).optional()
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
    if (timeSinceLastAttempt < 1000 && activity.attempts > 2) { // Multiple attempts within 1 second
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
// POST - SUBMIT VOTE
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

    // Rate limiting - 5 votes per minute per IP
    if (!checkRateLimit(ip, 5, 60 * 1000)) {
      return createErrorResponse('Rate limit exceeded. Please slow down.', 429);
    }

    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 401);
    }

    // Additional rate limiting per user - 3 votes per minute
    if (!checkRateLimit(session.user.id, 3, 60 * 1000)) {
      return createErrorResponse('Too many votes. Please wait a moment.', 429);
    }

    // Await params for Next.js 15
    const resolvedParams = await params;
    
    // Validate poll ID
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
      validatedData = submitVoteSchema.parse(body);
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
      session.user.id,
      pollId,
      validatedData.response_time_seconds
    );

    if (fraudCheck.suspicious && fraudCheck.confidenceScore < 50) {
      // Log suspicious activity but don't block completely
      console.warn('Suspicious voting activity detected:', {
        userId: session.user.id,
        pollId,
        reason: fraudCheck.reason,
        ip,
        userAgent
      });
    }

    // Prepare vote submission data
    const voteData = {
      poll_id: pollId,
      response_data: validatedData.response_data,
      response_time_seconds: validatedData.response_time_seconds
    };

    // Submit vote using server action
    const result = await submitPollResponse(voteData);

    if (!result.success) {
      // Handle specific error cases
      if (result.error?.includes('already voted')) {
        return createErrorResponse('You have already voted on this poll', 409);
      }
      if (result.error?.includes('not eligible')) {
        return createErrorResponse('You are not eligible to vote on this poll', 403);
      }
      if (result.error?.includes('not active')) {
        return createErrorResponse('This poll is no longer active', 410);
      }
      if (result.error?.includes('ended')) {
        return createErrorResponse('This poll has ended', 410);
      }
      
      return createErrorResponse(result.error || 'Failed to submit vote', 400);
    }

    // Get updated poll results if user should see them
    let pollResults = null;
    try {
      pollResults = await getPollResults(pollId);
    } catch (error) {
      // User might not have permission to see results yet
      console.log('User cannot see results immediately after voting');
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Vote submitted successfully',
      data: {
        vote_accepted: true,
        poll_results: pollResults,
        confidence_score: fraudCheck.confidenceScore
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/polls/[id]/vote:', error);
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
    // Rate limiting - 30 requests per minute per IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    
    if (!checkRateLimit(`${ip}:check`, 30, 60 * 1000)) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 401);
    }

    // Await params for Next.js 15
    const resolvedParams = await params;
    
    // Validate poll ID
    const pollId = resolvedParams.id;
    if (!pollId || pollId.length !== 36) {
      return createErrorResponse('Invalid poll ID format', 400);
    }

    try {
      // Get poll results (includes user vote status)
      const results = await getPollResults(pollId);
      
      return NextResponse.json({
        success: true,
        data: {
          has_voted: results.user_has_voted,
          can_vote: !results.user_has_voted,
          poll_active: results.poll.is_active && results.poll.status === 'active',
          time_remaining: results.time_remaining
        }
      });

    } catch (error) {
      if (error instanceof Error && error.message.includes('Not authorized')) {
        return createErrorResponse('Not authorized to check vote status for this poll', 403);
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in GET /api/polls/[id]/vote:', error);
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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  rateLimits.forEach((entry, key) => {
    if (now > entry.resetTime) {
      rateLimits.delete(key);
    }
  });
  
  // Clean up old suspicious activity entries (older than 1 hour)
  suspiciousActivity.forEach((activity, key) => {
    if (now - activity.lastAttempt > 60 * 60 * 1000) {
      suspiciousActivity.delete(key);
    }
  });
}, 5 * 60 * 1000); // Run cleanup every 5 minutes
