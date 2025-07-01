// ============================================================================
// CITIZENLY MVP: SIMPLIFIED LEGISLATIVE POLLS API
// File: src/app/api/legislative-polls/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createPoll, getPolls } from '@/lib/actions/polls';
import { db } from '@/lib/database';

// ============================================================================
// VALIDATION SCHEMAS - SIMPLIFIED FOR MVP
// ============================================================================

const createLegislativePollSchema = z.object({
  bill_id: z.number().int().positive(),
  question: z.string().min(10).max(500),
  context_text: z.string().max(1000).optional(),
  target_districts: z.array(z.string()).min(1).max(10),
  expires_in_hours: z.number().min(1).max(168).default(72) // Default 3 days
});

const getLegislativePollsSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  bill_id: z.string().transform(Number).optional(),
  politician_id: z.string().uuid().optional(),
  district: z.string().optional(),
  active_only: z.string().transform((val) => val === 'true').default('true')
});

// ============================================================================
// RATE LIMITING
// ============================================================================

const rateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
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
// POST - CREATE SIMPLIFIED LEGISLATIVE POLL
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 polls per hour per IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    
    if (!checkRateLimit(ip, 5, 60 * 60 * 1000)) {
      return createErrorResponse('Rate limit exceeded. You can create 5 polls per hour.', 429);
    }

    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 401);
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
      validatedData = createLegislativePollSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          'Validation failed',
          400,
          error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        );
      }
      return createErrorResponse('Invalid input data', 400);
    }

    // Convert to existing poll format
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (validatedData.expires_in_hours * 60 * 60 * 1000));

    const pollData = {
      title: `Legislative Poll: ${validatedData.question}`,
      description: validatedData.context_text || `Poll about legislative bill #${validatedData.bill_id}`,
      poll_type: 'approval_rating' as const,
      options: {
        scale: {
          min: 1,
          max: 3,
          labels: {
            "1": "Disapprove",
            "2": "No Opinion", 
            "3": "Approve"
          }
        }
      },
      target_audience: {
        congressional_districts: validatedData.target_districts
      },
      starts_at: now,
      ends_at: expiresAt,
      requires_verification: true,
      allows_anonymous: false,
      show_results_before_vote: false,
      show_results_after_vote: true,
      status: 'active' as const,
      is_active: true,
      // MVP-specific fields
      context_type: 'bill',
      context_bill_id: validatedData.bill_id,
      context_custom_text: validatedData.context_text,
      question: validatedData.question,
      target_districts: validatedData.target_districts,
      target_level: 'state'
    };

    // Create poll using existing infrastructure
    const result = await createPoll(pollData);

    if (!result.success) {
      return createErrorResponse(result.error || 'Failed to create legislative poll', 400);
    }

    // Return simplified response for MVP
    return NextResponse.json({
      success: true,
      poll: {
        id: result.poll?.id,
        bill_id: validatedData.bill_id,
        question: validatedData.question,
        target_districts: validatedData.target_districts,
        expires_at: expiresAt.toISOString(),
        poll_url: `/polls/${result.poll?.id}`,
        created_at: result.poll?.created_at
      },
      message: 'Legislative poll created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/legislative-polls:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// ============================================================================
// GET - RETRIEVE LEGISLATIVE POLLS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - 60 requests per minute per IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    
    if (!checkRateLimit(ip, 60, 60 * 1000)) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      console.log('No session found, using test user for development');
      // For testing - remove this in production
      // return createErrorResponse('Authentication required', 401);
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());

    let validatedQuery;
    try {
      validatedQuery = getLegislativePollsSchema.parse(queryObject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          'Invalid query parameters',
          400,
          error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        );
      }
      return createErrorResponse('Invalid query parameters', 400);
    }

    // Build filters for legislative polls only
    const filters = {
      politician_id: validatedQuery.politician_id,
      status: validatedQuery.active_only ? 'active' : undefined,
      poll_type: 'approval_rating', // MVP uses approval rating for approve/disapprove/no_opinion
      is_active: validatedQuery.active_only,
      context_type: 'bill' // Only legislative bill polls
    };

    const options = {
      page: validatedQuery.page || 1,
      limit: Math.min(validatedQuery.limit || 10, 20), // Max 20 per page for MVP
      sort_by: 'created_at' as const,
      sort_order: 'desc' as const,
      include_draft: false,
      include_closed: !validatedQuery.active_only
    };

    // Simple direct query for MVP
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Base condition for legislative polls
    whereConditions.push(`p.context_type = 'bill'`);
    
    if (validatedQuery.bill_id) {
      whereConditions.push(`p.context_bill_id = $${++paramCount}`);
      queryParams.push(validatedQuery.bill_id);
    }
    
    if (validatedQuery.active_only) {
      whereConditions.push(`p.is_active = true`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const pollsQuery = `
      SELECT p.id, p.title, p.question, p.context_bill_id, p.target_districts, 
             p.end_date, p.created_at, p.is_active, p.politician_id,
             u.first_name, u.last_name, pol.office_title
      FROM polls p
      JOIN politicians pol ON p.politician_id = pol.id
      JOIN users u ON pol.user_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${++paramCount}
    `;
    queryParams.push(options.limit);

    const result = await db.query(pollsQuery, queryParams);

    // Transform to simplified MVP format
    const simplifiedPolls = result.rows.map((poll: any) => ({
      id: poll.id,
      bill_id: poll.context_bill_id,
      question: poll.question || poll.title,
      target_districts: poll.target_districts || [],
      expires_at: poll.end_date,
      created_at: poll.created_at,
      total_responses: 0, // Will be calculated separately if needed
      is_active: poll.is_active,
      poll_url: `/polls/${poll.id}`,
      politician: {
        id: poll.politician_id,
        name: `${poll.first_name} ${poll.last_name}`,
        title: poll.office_title
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        polls: simplifiedPolls,
        pagination: {
          page: options.page,
          limit: options.limit,
          total: simplifiedPolls.length,
          hasMore: false,
          totalPages: 1
        }
      }
    });

  } catch (error) {
    console.error('Error in GET /api/legislative-polls:', error);
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