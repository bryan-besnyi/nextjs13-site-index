import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/options';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const action = searchParams.get('action') || undefined;
    const resource = searchParams.get('resource') || undefined;
    const userEmail = searchParams.get('userEmail') || undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Log this activity
    await ActivityLogger.logApiRequest({
      request,
      userEmail: session.user.email,
      action: 'VIEW_ACTIVITY_LOG',
      resource: 'activity',
      statusCode: 200,
      duration: Date.now() - startTime,
    });

    // Search activity logs
    const activities = await ActivityLogger.searchActivity({
      action,
      resource,
      userEmail,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    
    // Log the error
    await ActivityLogger.logApiRequest({
      request,
      action: 'VIEW_ACTIVITY_LOG_ERROR',
      resource: 'activity',
      statusCode: 500,
      duration: Date.now() - startTime,
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    });

    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}