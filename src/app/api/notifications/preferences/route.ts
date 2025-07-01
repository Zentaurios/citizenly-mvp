// ============================================================================
// CITIZENLY PHASE 2: NOTIFICATION PREFERENCES API ROUTE
// File: src/app/api/notifications/preferences/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { 
  getUserNotificationPreferences, 
  updateNotificationPreferences 
} from '@/lib/actions/notifications';

const updatePreferencesSchema = z.object({
  email_enabled: z.boolean().optional(),
  sms_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  in_app_enabled: z.boolean().optional(),
  new_poll_notifications: z.boolean().optional(),
  poll_result_notifications: z.boolean().optional(),
  poll_reminder_notifications: z.boolean().optional(),
  poll_ending_notifications: z.boolean().optional(),
  system_notifications: z.boolean().optional(),
  digest_frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).optional(),
  quiet_hours_start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quiet_hours_end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().optional()
});

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

// GET notification preferences
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 401);
    }

    // Get user preferences
    const preferences = await getUserNotificationPreferences();

    if (!preferences) {
      return createErrorResponse('Notification preferences not found', 404);
    }

    return NextResponse.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('Error in GET /api/notifications/preferences:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// PUT notification preferences
export async function PUT(request: NextRequest) {
  try {
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

    let validatedData;
    try {
      validatedData = updatePreferencesSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse('Invalid preferences data', 400);
      }
      return createErrorResponse('Invalid request data', 400);
    }

    // Update preferences
    const result = await updateNotificationPreferences(validatedData);

    if (!result.success) {
      return createErrorResponse(result.error || 'Failed to update preferences', 400);
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated'
    });

  } catch (error) {
    console.error('Error in PUT /api/notifications/preferences:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
