// ============================================================================
// CITIZENLY PHASE 2: SEND TEST NOTIFICATION API ROUTE (FOR DEVELOPMENT)
// File: src/app/api/notifications/test/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createNotification } from '@/lib/actions/notifications';

// ============================================================================
// ERROR HANDLING
// ============================================================================

function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { 
      error: message, 
      status,
      timestamp: new Date().toISOString()
    }, 
    { status }
  );
}

// ============================================================================
// POST - SEND TEST NOTIFICATION (DEVELOPMENT ONLY)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return createErrorResponse('Test notifications not allowed in production', 403);
    }

    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 401);
    }

    // Create test notification
    const result = await createNotification({
      user_id: session.user.id,
      type: 'system_announcement',
      title: 'Test Notification',
      content: 'This is a test notification to verify the notification system is working.',
      data: {
        urgency: 'low'
      },
      channels: ['email', 'push', 'in_app'],
      priority: 5
    });

    if (!result.success) {
      return createErrorResponse(result.error || 'Failed to send test notification', 400);
    }

    return NextResponse.json({
      success: true,
      message: 'Test notification sent',
      notification: result.notification
    });

  } catch (error) {
    console.error('Error in POST /api/notifications/test:', error);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}