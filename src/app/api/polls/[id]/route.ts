// ============================================================================
// CITIZENLY PHASE 2: INDIVIDUAL POLL API ROUTE
// File: src/app/api/polls/[id]/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getPollById, updatePoll, deletePoll, getPollResults } from '@/lib/actions/polls';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updatePollSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  ends_at: z.string().datetime().optional(),
  status: z.enum(['draft', 'active', 'closed', 'archived']).optional(),
  is_active: z.boolean().optional()
});

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
// GET - RETRIEVE SINGLE POLL WITH RESULTS
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      // Get poll details and results
      const [poll, results] = await Promise.all([
        getPollById(pollId),
        getPollResults(pollId)
      ]);

      if (!poll) {
        return createErrorResponse('Poll not found', 404);
      }

      return NextResponse.json({
        success: true,
        data: {
          poll,
          results
        }
      });

    } catch (error) {
      if (error instanceof Error && error.message.includes('Not authorized')) {
        return createErrorResponse('Not authorized to view this poll', 403);
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return createErrorResponse('Poll not found', 404);
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in GET /api/polls/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// ============================================================================
// PUT - UPDATE POLL
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      validatedData = updatePollSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          'Invalid update data',
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
    const updateData = {
      ...validatedData,
      ends_at: validatedData.ends_at ? new Date(validatedData.ends_at) : undefined
    };

    // Update poll using server action
    const result = await updatePoll(pollId, updateData);

    if (!result.success) {
      if (result.error?.includes('not found') || result.error?.includes('access denied')) {
        return createErrorResponse('Poll not found or access denied', 404);
      }
      return createErrorResponse(result.error || 'Failed to update poll', 400);
    }

    // Get updated poll data
    const updatedPoll = await getPollById(pollId);

    return NextResponse.json({
      success: true,
      data: {
        poll: updatedPoll
      },
      message: 'Poll updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT /api/polls/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// ============================================================================
// DELETE - DELETE POLL
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Delete poll using server action
    const result = await deletePoll(pollId);

    if (!result.success) {
      if (result.error?.includes('not found') || result.error?.includes('access denied')) {
        return createErrorResponse('Poll not found or access denied', 404);
      }
      if (result.error?.includes('Cannot delete poll with responses')) {
        return createErrorResponse('Cannot delete poll with responses. Archive it instead.', 409);
      }
      return createErrorResponse(result.error || 'Failed to delete poll', 400);
    }

    return NextResponse.json({
      success: true,
      message: 'Poll deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/polls/[id]:', error);
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
