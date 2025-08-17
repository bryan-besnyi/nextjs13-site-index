import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/options';
import PerformanceAlerting from '@/lib/performance-alerts';
import { CSRFProtection } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    switch (action) {
      case 'stats':
        const stats = await PerformanceAlerting.getAlertStats();
        return NextResponse.json({ stats });

      case 'recent':
      default:
        const alerts = await PerformanceAlerting.getRecentAlerts(limit);
        return NextResponse.json({ alerts });
    }

  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // CSRF Protection
    const isValidCSRF = await CSRFProtection.validateToken(request);
    if (!isValidCSRF) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, alertId } = body;

    switch (action) {
      case 'acknowledge':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          );
        }
        
        const acknowledged = await PerformanceAlerting.acknowledgeAlert(alertId);
        if (!acknowledged) {
          return NextResponse.json(
            { error: 'Failed to acknowledge alert' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Alert acknowledged' 
        });

      case 'resolve':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          );
        }
        
        const resolved = await PerformanceAlerting.resolveAlert(alertId);
        if (!resolved) {
          return NextResponse.json(
            { error: 'Failed to resolve alert' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Alert resolved' 
        });

      case 'cleanup':
        const hoursOld = parseInt(body.hoursOld || '24');
        const removedCount = await PerformanceAlerting.cleanupOldAlerts(hoursOld);
        
        return NextResponse.json({ 
          success: true, 
          message: `Cleaned up ${removedCount} old alerts` 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json(
      { error: 'Failed to process alert action' },
      { status: 500 }
    );
  }
}