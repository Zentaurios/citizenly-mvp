import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/actions/auth';
import { LegislativeDatabase } from '@/lib/database/legislative';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is verified
    if (user.verificationStatus !== 'verified') {
      return NextResponse.json({ error: 'User must be verified to access legislative feed' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || '';
    const district = searchParams.get('district') || '';
    const importance = parseInt(searchParams.get('importance') || '0');
    const search = searchParams.get('search') || '';

    // Get user's district for personalization (fallback to default)
    const userDistrict = district || '3'; // Default to district 3 for test users

    // Fetch feed items using the static method
    const feedItems = await LegislativeDatabase.getUserFeed(user.id, {
      type: type ? [type] : undefined,
      limit,
      offset: (page - 1) * limit
    });

    return NextResponse.json({
      items: feedItems,
      total: feedItems.length,
      page,
      hasMore: feedItems.length === limit
    });

  } catch (error) {
    console.error('Legislative feed API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legislative feed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is verified
    if (user.verificationStatus !== 'verified') {
      return NextResponse.json({ error: 'User must be verified to access legislative feed' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, filters = {}, page = 1, limit = 20 } = body;

    // Verify user can access this feed (must be their own or admin)
    if (user.id !== userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user's district for personalization (fallback to default)
    const userDistrict = '3'; // Default to district 3 for test users

    // Fetch feed items using the static method
    const feedItems = await LegislativeDatabase.getUserFeed(user.id, {
      type: filters.type || undefined,
      subjects: filters.subjects || undefined,
      limit,
      offset: (page - 1) * limit
    });

    return NextResponse.json({
      success: true,
      items: feedItems,
      total: feedItems.length,
      page,
      hasMore: feedItems.length === limit
    });

  } catch (error) {
    console.error('Legislative feed API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legislative feed' },
      { status: 500 }
    );
  }
}