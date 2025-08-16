import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { warmCache, getCacheStats } from '@/lib/indexItems-cached';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔥 Starting cache warmup...');
    const startTime = performance.now();
    
    // Warm up the cache
    const result = await warmCache();
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Cache warmup failed', details: result.error },
        { status: 500 }
      );
    }
    
    // Get cache statistics
    const statsResult = await getCacheStats();
    const warmupTime = Math.round(performance.now() - startTime);
    
    return NextResponse.json({
      message: 'Cache warmed up successfully',
      warmupTime: `${warmupTime}ms`,
      stats: statsResult.stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cache warmup error:', error);
    return NextResponse.json(
      { error: 'Failed to warm cache', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current cache statistics
    const statsResult = await getCacheStats();
    
    if (statsResult.error) {
      return NextResponse.json(
        { error: 'Failed to get cache stats', details: statsResult.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      stats: statsResult.stats,
      recommendation: statsResult.stats.totalKeys < 10 ? 
        'Cache is cold. Consider running warmup.' : 
        'Cache is warm and healthy.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get cache statistics' },
      { status: 500 }
    );
  }
}