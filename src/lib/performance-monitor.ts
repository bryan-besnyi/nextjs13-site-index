import { NextRequest } from 'next/server';

// Performance metrics collection
export interface PerformanceMetrics {
  timestamp: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  cacheHit: boolean;
  dbQueryTime?: number;
  cacheQueryTime?: number;
  userAgent?: string;
  ip?: string;
  resultCount?: number;
}

// In-memory metrics store (consider Redis for production)
const metricsStore: PerformanceMetrics[] = [];
const MAX_METRICS = 10000; // Keep last 10k requests

export class PerformanceMonitor {
  private startTime: number;
  private endpoint: string;
  private method: string;
  private req: NextRequest;

  constructor(req: NextRequest) {
    this.startTime = performance.now();
    this.endpoint = req.nextUrl.pathname;
    this.method = req.method;
    this.req = req;
  }

  recordMetrics(
    statusCode: number,
    options: {
      cacheHit?: boolean;
      dbQueryTime?: number;
      cacheQueryTime?: number;
      resultCount?: number;
    } = {}
  ) {
    const responseTime = Math.round(performance.now() - this.startTime);
    
    const metrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      endpoint: this.endpoint,
      method: this.method,
      responseTime,
      statusCode,
      cacheHit: options.cacheHit || false,
      dbQueryTime: options.dbQueryTime,
      cacheQueryTime: options.cacheQueryTime,
      userAgent: this.req.headers.get('user-agent') || undefined,
      ip: this.req.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
      resultCount: options.resultCount
    };

    // Add to store
    metricsStore.push(metrics);
    
    // Trim if needed
    if (metricsStore.length > MAX_METRICS) {
      metricsStore.splice(0, metricsStore.length - MAX_METRICS);
    }

    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`🐌 Slow API request: ${this.method} ${this.endpoint} - ${responseTime}ms`);
    }

    return metrics;
  }

  static getMetrics(limit = 100): PerformanceMetrics[] {
    return metricsStore.slice(-limit);
  }

  static getAnalytics() {
    if (metricsStore.length === 0) return null;

    const last24h = metricsStore.filter(
      m => Date.now() - new Date(m.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    const responseTimes = last24h.map(m => m.responseTime);
    const cacheHits = last24h.filter(m => m.cacheHit).length;
    const dbQueries = last24h.filter(m => m.dbQueryTime !== undefined);
    
    return {
      totalRequests: last24h.length,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      medianResponseTime: responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)],
      p95ResponseTime: responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)],
      p99ResponseTime: responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.99)],
      cacheHitRate: (cacheHits / last24h.length) * 100,
      averageDbQueryTime: dbQueries.length > 0 
        ? dbQueries.reduce((sum, m) => sum + (m.dbQueryTime || 0), 0) / dbQueries.length 
        : null,
      slowQueries: last24h.filter(m => m.responseTime > 1000).length,
      errorRate: (last24h.filter(m => m.statusCode >= 400).length / last24h.length) * 100,
      topEndpoints: this.getTopEndpoints(last24h),
      timeRange: '24h'
    };
  }

  private static getTopEndpoints(metrics: PerformanceMetrics[]) {
    const endpointStats: Record<string, { count: number; avgTime: number; total: number }> = {};
    
    metrics.forEach(m => {
      if (!endpointStats[m.endpoint]) {
        endpointStats[m.endpoint] = { count: 0, avgTime: 0, total: 0 };
      }
      endpointStats[m.endpoint].count++;
      endpointStats[m.endpoint].total += m.responseTime;
    });

    Object.keys(endpointStats).forEach(endpoint => {
      endpointStats[endpoint].avgTime = 
        endpointStats[endpoint].total / endpointStats[endpoint].count;
    });

    return Object.entries(endpointStats)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([endpoint, stats]) => ({
        endpoint,
        requests: stats.count,
        averageTime: Math.round(stats.avgTime)
      }));
  }
}

// Database query timing utility
export async function timeDbQuery<T>(
  queryFn: () => Promise<T>,
  queryName?: string
): Promise<{ result: T; queryTime: number }> {
  const start = performance.now();
  const result = await queryFn();
  const queryTime = Math.round(performance.now() - start);
  
  if (queryTime > 500) {
    console.warn(`🐌 Slow DB query${queryName ? ` (${queryName})` : ''}: ${queryTime}ms`);
  }
  
  return { result, queryTime };
}

// Cache operation timing utility
export async function timeCacheOperation<T>(
  cacheFn: () => Promise<T>,
  operationType: 'get' | 'set' | 'del' = 'get'
): Promise<{ result: T; cacheTime: number }> {
  const start = performance.now();
  const result = await cacheFn();
  const cacheTime = Math.round(performance.now() - start);
  
  if (cacheTime > 100) {
    console.warn(`🐌 Slow cache ${operationType}: ${cacheTime}ms`);
  }
  
  return { result, cacheTime };
}