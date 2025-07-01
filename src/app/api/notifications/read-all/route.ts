// ============================================================================
// CITIZENLY PHASE 2: MARK ALL NOTIFICATIONS AS READ API ROUTE  
// File: src/app/api/notifications/read-all/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/actions/auth';

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

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 401);
    }

    // Mark all notifications as read
    const result = await markAllNotificationsAsRead();

    if (!result.success) {
      return createErrorResponse(result.error || 'Failed to mark all notifications as read', 400);
    }

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Error in POST /api/notifications/read-all:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
