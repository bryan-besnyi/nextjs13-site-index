import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/options';
import { kv } from '@vercel/kv';
import { prisma } from '@/lib/prisma-singleton';

// Helper to get performance metrics from KV store
async function getMetricsFromKV() {
  const keys = [
    'metrics:api:calls:today',
    'metrics:api:response_time:avg',
    'metrics:cache:hit_rate',
    'metrics:api:error_rate',
    'metrics:db:queries:today',
    'metrics:db:response_time:avg'
  ];

  const values = await kv.mget(...keys);
  
  return {
    apiCalls: Number(values[0]) || 0,
    avgResponseTime: Number(values[1]) || 0,
    cacheHitRate: Number(values[2]) || 0,
    errorRate: Number(values[3]) || 0,
    dbQueries: Number(values[4]) || 0,
    avgDbTime: Number(values[5]) || 0,
    activeConnections: await getActiveDBConnections(),
    memoryUsage: getMemoryUsage()
  };
}

// Get active database connections (SQLite specific)
async function getActiveDBConnections() {
  try {
    // For SQLite, we can't get real connection count, so return a simulated value
    // In production with PostgreSQL, this would query pg_stat_activity
    return 1; // SQLite typically uses 1 connection
  } catch {
    return 0;
  }
}

// Get memory usage percentage
function getMemoryUsage() {
  const used = process.memoryUsage();
  const total = process.env.NODE_ENV === 'production' ? 512 * 1024 * 1024 : 256 * 1024 * 1024; // 512MB prod, 256MB dev
  return (used.heapUsed / total);
}

// Get endpoint-specific metrics (optimized with batch operations)
async function getEndpointMetrics() {
  const endpoints = ['/api/indexItems', '/api/health', '/api/metrics'];
  
  // Batch all endpoint metrics in one call
  const keys = endpoints.flatMap(endpoint => [
    `metrics:endpoint:${endpoint}:calls`,
    `metrics:endpoint:${endpoint}:total_time`,
    `metrics:endpoint:${endpoint}:errors`
  ]);
  
  const values = await kv.mget(...keys);
  const endpointMetrics = [];
  
  for (let i = 0; i < endpoints.length; i++) {
    const calls = Number(values[i * 3]) || 0;
    const totalTime = Number(values[i * 3 + 1]) || 0;
    const errors = Number(values[i * 3 + 2]) || 0;
    
    endpointMetrics.push({
      endpoint: endpoints[i],
      calls,
      avgTime: calls > 0 ? Math.round(totalTime / calls) : 0,
      errors
    });
  }

  return endpointMetrics.sort((a, b) => b.calls - a.calls);
}

// Generate time series data for the last 24 hours (optimized with batch operations)
async function getTimeSeriesData() {
  const now = new Date();
  const keys = [];
  const hours = [];
  
  // Prepare all keys for batch fetch
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now);
    hour.setHours(hour.getHours() - i);
    const hourKey = hour.getHours();
    hours.push(hourKey);
    keys.push(`metrics:hourly:${hourKey}:calls`);
    keys.push(`metrics:hourly:${hourKey}:avg_time`);
  }
  
  // Batch fetch all hourly metrics
  const values = await kv.mget(...keys);
  const data = [];
  
  for (let i = 0; i < hours.length; i++) {
    const calls = Number(values[i * 2]) || 0;
    const avgTime = Number(values[i * 2 + 1]) || 0;
    
    data.push({
      time: `${hours[i].toString().padStart(2, '0')}:00`,
      responseTime: avgTime,
      requests: calls
    });
  }

  return data;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all metrics in parallel
    const [metrics, endpoints, timeSeries] = await Promise.all([
      getMetricsFromKV(),
      getEndpointMetrics(),
      getTimeSeriesData()
    ]);

    return NextResponse.json({
      metrics,
      endpoints,
      timeSeries
    });
  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}