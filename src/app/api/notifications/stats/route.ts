// ============================================================================
// CITIZENLY PHASE 2: NOTIFICATION STATISTICS API ROUTE
// File: src/app/api/notifications/stats/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserNotifications } from '@/lib/actions/notifications';

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
// GET - NOTIFICATION STATISTICS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 401);
    }

    // Get notification statistics
    const { notifications, unreadCount } = await getUserNotifications(1, 100);
    
    // Calculate statistics from recent notifications
    const stats = {
      total_notifications: notifications.length,
      unread_count: unreadCount,
      last_notification_at: notifications.length > 0 ? notifications[0].created_at : null,
      notification_types: notifications.reduce((acc: Record<string, number>, notif) => {
        acc[notif.type] = (acc[notif.type] || 0) + 1;
        return acc;
      }, {}),
      recent_activity: notifications.slice(0, 5).map(notif => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        created_at: notif.created_at,
        is_read: notif.is_read
      }))
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error in GET /api/notifications/stats:', error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}