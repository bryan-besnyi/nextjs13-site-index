import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../auth/[...nextauth]/options';
import { warmCache, getCacheStats } from '@/lib/indexItems-cached';
import { PerformanceOptimizer } from '@/lib/performance-optimizations';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔥 Starting enhanced cache warmup...');
    const startTime = performance.now();
    
    // Run both cache warming strategies
    const [legacyResult, enhancedWarming] = await Promise.all([
      warmCache(),
      PerformanceOptimizer.warmCache()
    ]);
    
    if (legacyResult.error) {
      console.warn('Legacy cache warming failed:', legacyResult.error);
    }
    
    // Get enhanced cache statistics
    const [legacyStats, enhancedStats] = await Promise.all([
      getCacheStats(),
      Promise.resolve(PerformanceOptimizer.getCacheStats())
    ]);
    
    const warmupTime = Math.round(performance.now() - startTime);
    
    return NextResponse.json({
      message: 'Enhanced cache warming completed successfully',
      warmupTime: `${warmupTime}ms`,
      legacyStats: legacyStats.stats,
      enhancedStats,
      recommendation: warmupTime < 5000 ? 
        'Cache warming performance is excellent' : 
        'Cache warming took longer than expected - consider optimization',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cache warmup error:', error);
    return NextResponse.json(
      { error: 'Failed to warm cache', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get enhanced cache statistics
    const [legacyStats, enhancedStats] = await Promise.all([
      getCacheStats(),
      Promise.resolve(PerformanceOptimizer.getCacheStats())
    ]);
    
    if (legacyStats.error) {
      return NextResponse.json(
        { error: 'Failed to get cache stats', details: legacyStats.error },
        { status: 500 }
      );
    }
    
    const totalCacheEntries = (legacyStats.stats?.totalKeys || 0) + enhancedStats.inMemoryEntries;
    
    return NextResponse.json({
      legacyStats: legacyStats.stats,
      enhancedStats,
      totalCacheEntries,
      recommendation: totalCacheEntries < 10 ? 
        'Cache is cold. Consider running warmup for better performance.' : 
        'Cache is warm and healthy. Performance should be optimal.',
      performanceTarget: '< 100ms response time',
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