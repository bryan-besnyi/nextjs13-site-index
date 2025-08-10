import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMonitor } from '@/lib/performance-monitor';

export async function GET(req: NextRequest) {
  try {
    // Simple auth check (you might want to add proper authentication)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      // For now, allow access but log it
      console.log('Metrics accessed without auth from:', req.headers.get('x-forwarded-for'));
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'analytics';
    const limit = parseInt(searchParams.get('limit') || '100');

    let data;
    
    switch (type) {
      case 'raw':
        data = PerformanceMonitor.getMetrics(limit);
        break;
      case 'analytics':
        data = PerformanceMonitor.getAnalytics();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type. Use "raw" or "analytics"' },
          { status: 400 }
        );
    }

    if (!data) {
      return NextResponse.json({
        message: 'No metrics data available',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      type,
      data,
      timestamp: new Date().toISOString(),
      ...(type === 'raw' && { count: Array.isArray(data) ? data.length : 0 })
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve metrics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}