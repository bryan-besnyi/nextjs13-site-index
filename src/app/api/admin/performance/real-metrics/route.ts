import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PerformanceCollector } from '@/lib/performance-collector';

export async function GET(req: NextRequest) {
  try {
    // Check authentication (skip for now as requested)
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'api';
    const hours = parseInt(searchParams.get('hours') || '24');

    let data;

    switch (type) {
      case 'api':
        data = await PerformanceCollector.getActualApiMetrics(hours);
        break;
      
      case 'system':
        data = await PerformanceCollector.getSystemPerformance();
        break;
      
      case 'realtime':
        // Real-time snapshot of current performance
        data = {
          timestamp: new Date().toISOString(),
          memory: process.memoryUsage ? {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024),
          } : null,
          uptime: process.uptime ? Math.round(process.uptime()) : null,
          nodeVersion: process.version,
          platform: process.platform,
        };
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid type. Use "api", "system", or "realtime"' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      type,
      data,
      timestamp: new Date().toISOString(),
      collectionPeriod: type === 'api' ? `${hours} hours` : 'current',
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Real metrics API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve performance metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Endpoint to manually trigger performance data collection
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'benchmark':
        // Run performance benchmark
        const benchmarkStart = performance.now();
        
        // Simulate various operations
        const dbTest = await PerformanceCollector.measureDbOperation(
          async () => {
            // Simple count query
            const { prisma } = await import('@/lib/prisma-singleton');
            return await prisma.indexitem.count();
          },
          'benchmark-count'
        );

        const cacheTest = await PerformanceCollector.measureCacheOperation(
          async () => {
            const { kv } = await import('@vercel/kv');
            return await kv.get('benchmark-test');
          },
          'get'
        );

        const totalTime = Math.round(performance.now() - benchmarkStart);

        return NextResponse.json({
          benchmark: {
            totalTime,
            database: {
              queryTime: dbTest.queryTime,
              result: dbTest.result,
            },
            cache: {
              queryTime: cacheTest.cacheTime,
              hit: cacheTest.hit,
            },
            system: await PerformanceCollector.getSystemPerformance(),
          },
          timestamp: new Date().toISOString(),
        });

      case 'stress-test':
        // Simple stress test
        const iterations = parseInt(body.iterations || '100');
        const results: number[] = [];

        for (let i = 0; i < iterations; i++) {
          const start = performance.now();
          // Simulate API work
          await new Promise(resolve => setTimeout(resolve, 1));
          results.push(Math.round(performance.now() - start));
        }

        return NextResponse.json({
          stressTest: {
            iterations,
            avgTime: Math.round(results.reduce((a, b) => a + b, 0) / results.length),
            minTime: Math.min(...results),
            maxTime: Math.max(...results),
            p95Time: results.sort((a, b) => a - b)[Math.floor(results.length * 0.95)],
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "benchmark" or "stress-test"' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Performance test error:', error);
    return NextResponse.json(
      { error: 'Performance test failed', details: error.message },
      { status: 500 }
    );
  }
}