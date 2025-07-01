import { NextRequest, NextResponse } from 'next/server';
import { LegislativeDatabase } from '@/lib/database/legislative';
import { getCurrentUser } from '@/lib/actions/auth';

interface InterestsRequest {
  subjects?: string[];
  follow_districts?: string[];
  notification_types?: string[];
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const userId = user.id;
    const interests = await LegislativeDatabase.getUserLegislativeInterests(userId);

    return NextResponse.json({
      success: true,
      interests
    });

  } catch (error) {
    console.error('Get legislative interests API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const userId = user.id;
    const body: InterestsRequest = await request.json();

    // Validate the request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate arrays if provided
    const validationErrors: string[] = [];

    if (body.subjects && !Array.isArray(body.subjects)) {
      validationErrors.push('subjects must be an array');
    }

    if (body.follow_districts && !Array.isArray(body.follow_districts)) {
      validationErrors.push('follow_districts must be an array');
    }

    if (body.notification_types && !Array.isArray(body.notification_types)) {
      validationErrors.push('notification_types must be an array');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Validate notification types
    const validNotificationTypes = [
      'bill_introduced',
      'bill_updated', 
      'vote_result',
      'vote_scheduled',
      'status_change'
    ];

    if (body.notification_types) {
      const invalidTypes = body.notification_types.filter(
        type => !validNotificationTypes.includes(type)
      );
      if (invalidTypes.length > 0) {
        return NextResponse.json(
          { 
            error: 'Invalid notification types',
            invalid_types: invalidTypes,
            valid_types: validNotificationTypes
          },
          { status: 400 }
        );
      }
    }

    // Update user's legislative interests
    await LegislativeDatabase.updateUserLegislativeInterests(userId, {
      subjects: body.subjects,
      follow_districts: body.follow_districts,
      notification_types: body.notification_types
    });

    // Get updated interests to return
    const updatedInterests = await LegislativeDatabase.getUserLegislativeInterests(userId);

    return NextResponse.json({
      success: true,
      message: 'Legislative interests updated successfully',
      interests: updatedInterests
    });

  } catch (error) {
    console.error('Update legislative interests API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}