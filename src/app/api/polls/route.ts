// ============================================================================
// CITIZENLY PHASE 2: POLLS API ROUTE HANDLER
// File: src/app/api/polls/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createPoll, getPolls } from '@/lib/actions/polls';
import { auth } from '@/lib/auth';
import { z } from 'zod';

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
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
  max_responses: z.number().positive().optional(),
  requires_verification: z.boolean().default(true),
  allows_anonymous: z.boolean().default(false),
  show_results_before_vote: z.boolean().default(false),
  show_results_after_vote: z.boolean().default(true),
  status: z.enum(['draft', 'active']).default('active'),
  is_active: z.boolean().default(true)
});

const getPollsQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  politician_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'active', 'closed', 'archived']).optional(),
  poll_type: z.enum(['yes_no', 'multiple_choice', 'approval_rating', 'ranked_choice']).optional(),
  is_active: z.string().transform((val) => val === 'true').optional(),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'starts_at', 'ends_at', 'total_responses', 'response_rate']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  include_draft: z.string().transform((val) => val === 'true').optional(),
  include_closed: z.string().transform((val) => val === 'true').optional()
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
// POST - CREATE POLL
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 requests per minute per IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    
    if (!checkRateLimit(ip, 10, 60 * 1000)) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
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
      validatedData = createPollSchema.parse(body);
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

    // Convert string dates to Date objects
    const pollData = {
      ...validatedData,
      starts_at: validatedData.starts_at ? new Date(validatedData.starts_at) : undefined,
      ends_at: validatedData.ends_at ? new Date(validatedData.ends_at) : undefined
    };

    // Create poll using server action
    const result = await createPoll(pollData);

    if (!result.success) {
      return createErrorResponse(result.error || 'Failed to create poll', 400);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      poll: result.poll,
      message: 'Poll created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/polls:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// ============================================================================
// GET - RETRIEVE POLLS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - 100 requests per minute per IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    
    if (!checkRateLimit(ip, 100, 60 * 1000)) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 401);
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());

    let validatedQuery;
    try {
      validatedQuery = getPollsQuerySchema.parse(queryObject);
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

    // Build filters and options
    const filters = {
      politician_id: validatedQuery.politician_id,
      status: validatedQuery.status,
      poll_type: validatedQuery.poll_type,
      is_active: validatedQuery.is_active,
      search: validatedQuery.search
    };

    const options = {
      page: validatedQuery.page || 1,
      limit: Math.min(validatedQuery.limit || 10, 50), // Max 50 per page
      sort_by: validatedQuery.sort_by || 'created_at',
      sort_order: validatedQuery.sort_order || 'desc',
      include_draft: validatedQuery.include_draft || false,
      include_closed: validatedQuery.include_closed || true
    };

    // Get polls using server action
    const result = await getPolls(filters, options);

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        polls: result.polls,
        pagination: {
          page: options.page,
          limit: options.limit,
          total: result.total,
          hasMore: result.hasMore,
          totalPages: Math.ceil(result.total / options.limit)
        }
      }
    });

  } catch (error) {
    console.error('Error in GET /api/polls:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
