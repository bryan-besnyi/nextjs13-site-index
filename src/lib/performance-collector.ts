import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-singleton';
import { kv } from '@vercel/kv';

interface PerformanceMetric {
  timestamp: Date;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  cacheHit: boolean;
  userAgent?: string;
  ipAddress?: string;
  dbQueryTime?: number;
  cacheQueryTime?: number;
  memoryUsage?: number;
  errorMessage?: string;
}

export class PerformanceCollector {
  private static metricsBuffer: PerformanceMetric[] = [];
  private static readonly BUFFER_SIZE = 100;
  private static readonly FLUSH_INTERVAL = 30000; // 30 seconds
  
  static {
    // Auto-flush metrics buffer periodically
    if (typeof window === 'undefined') { // Server-side only
      setInterval(() => {
        this.flushMetrics();
      }, this.FLUSH_INTERVAL);
    }
  }

  /**
   * Collect real performance metrics from actual requests
   */
  static async collectMetrics(req: NextRequest, res: NextResponse, startTime: number) {
    const responseTime = Math.round(performance.now() - startTime);
    
    const metric: PerformanceMetric = {
      timestamp: new Date(),
      endpoint: req.nextUrl.pathname,
      method: req.method,
      responseTime,
      statusCode: res.status,
      cacheHit: false, // Will be updated by cache operations
      userAgent: req.headers.get('user-agent') || undefined,
      ipAddress: this.getClientIP(req),
      memoryUsage: this.getMemoryUsage(),
    };

    this.metricsBuffer.push(metric);

    // Flush buffer if it's full
    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      await this.flushMetrics();
    }

    return metric;
  }

  /**
   * Measure database operation performance
   */
  static async measureDbOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ result: T; queryTime: number }> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const queryTime = Math.round(performance.now() - startTime);
      
      // Log slow queries
      if (queryTime > 500) {
        console.warn(`🐌 Slow DB operation (${operationName}): ${queryTime}ms`);
      }
      
      return { result, queryTime };
    } catch (error) {
      const queryTime = Math.round(performance.now() - startTime);
      console.error(`❌ DB operation failed (${operationName}): ${queryTime}ms`, error);
      throw error;
    }
  }

  /**
   * Measure cache operation performance
   */
  static async measureCacheOperation<T>(
    operation: () => Promise<T>,
    operationType: 'get' | 'set' | 'del' = 'get'
  ): Promise<{ result: T; cacheTime: number; hit: boolean }> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const cacheTime = Math.round(performance.now() - startTime);
      const hit = operationType === 'get' && result !== null && result !== undefined;
      
      // Log slow cache operations
      if (cacheTime > 100) {
        console.warn(`🐌 Slow cache ${operationType}: ${cacheTime}ms`);
      }
      
      return { result, cacheTime, hit };
    } catch (error) {
      const cacheTime = Math.round(performance.now() - startTime);
      console.error(`❌ Cache operation failed (${operationType}): ${cacheTime}ms`, error);
      throw error;
    }
  }

  /**
   * Get comprehensive system performance snapshot
   */
  static async getSystemPerformance(): Promise<{
    database: { status: string; avgResponseTime: number; connectionCount: number };
    cache: { status: string; hitRate: number; keyCount: number };
    memory: { usage: number; limit: number; percentage: number };
    api: { totalRequests: number; avgResponseTime: number; errorRate: number };
    uptime: number;
  }> {
    try {
      // Test database performance
      const dbStart = performance.now();
      await prisma.indexitem.count();
      const dbResponseTime = Math.round(performance.now() - dbStart);

      // Get cache statistics
      const cacheKeys = await kv.keys('*').catch(() => []);
      const cacheHitRate = await this.calculateCacheHitRate();

      // Get memory usage
      const memoryUsage = this.getMemoryUsage();

      // Get API metrics from last hour
      const apiMetrics = await this.getRecentApiMetrics(60); // Last 60 minutes

      return {
        database: {
          status: dbResponseTime < 500 ? 'healthy' : 'degraded',
          avgResponseTime: dbResponseTime,
          connectionCount: 1, // Prisma connection pool
        },
        cache: {
          status: cacheKeys.length > 0 ? 'healthy' : 'warning',
          hitRate: cacheHitRate,
          keyCount: cacheKeys.length,
        },
        memory: {
          usage: memoryUsage,
          limit: 512, // MB - typical Vercel limit
          percentage: (memoryUsage / 512) * 100,
        },
        api: {
          totalRequests: apiMetrics.totalRequests,
          avgResponseTime: apiMetrics.avgResponseTime,
          errorRate: apiMetrics.errorRate,
        },
        uptime: process.uptime(),
      };
    } catch (error) {
      console.error('Failed to get system performance:', error);
      throw error;
    }
  }

  /**
   * Get actual API performance metrics from collected data
   */
  static async getActualApiMetrics(hours: number = 24): Promise<{
    totalRequests: number;
    avgResponseTime: number;
    medianResponseTime: number;
    p90ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    slowestEndpoints: Array<{ endpoint: string; avgTime: number }>;
    fastestEndpoints: Array<{ endpoint: string; avgTime: number }>;
    cacheHitRate: number;
  }> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const metrics = this.metricsBuffer.filter(m => m.timestamp >= cutoffTime);

    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        medianResponseTime: 0,
        p90ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        slowestEndpoints: [],
        fastestEndpoints: [],
        cacheHitRate: 0,
      };
    }

    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const errors = metrics.filter(m => m.statusCode >= 400);
    const cacheHits = metrics.filter(m => m.cacheHit);

    // Calculate endpoint performance
    const endpointStats: Record<string, { times: number[]; count: number }> = {};
    metrics.forEach(m => {
      if (!endpointStats[m.endpoint]) {
        endpointStats[m.endpoint] = { times: [], count: 0 };
      }
      endpointStats[m.endpoint].times.push(m.responseTime);
      endpointStats[m.endpoint].count++;
    });

    const endpointAvgs = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        avgTime: Math.round(stats.times.reduce((a, b) => a + b, 0) / stats.times.length),
        count: stats.count,
      }))
      .filter(ep => ep.count >= 5); // Only include endpoints with significant traffic

    return {
      totalRequests: metrics.length,
      avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
      medianResponseTime: responseTimes[Math.floor(responseTimes.length * 0.5)],
      p90ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.9)],
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
      errorRate: (errors.length / metrics.length) * 100,
      slowestEndpoints: endpointAvgs
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 5),
      fastestEndpoints: endpointAvgs
        .sort((a, b) => a.avgTime - b.avgTime)
        .slice(0, 5),
      cacheHitRate: (cacheHits.length / metrics.length) * 100,
    };
  }

  /**
   * Store metrics to persistent storage
   */
  private static async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metricsToFlush = [...this.metricsBuffer];
      this.metricsBuffer = [];

      // Store in KV for quick access (last 1000 metrics)
      const existingMetrics = await kv.get<PerformanceMetric[]>('performance-metrics') || [];
      const allMetrics = [...existingMetrics, ...metricsToFlush].slice(-1000);
      
      await kv.set('performance-metrics', allMetrics, { ex: 7 * 24 * 3600 }); // 7 days

      console.log(`📊 Flushed ${metricsToFlush.length} performance metrics`);
    } catch (error) {
      console.error('Failed to flush performance metrics:', error);
      // Keep metrics in buffer if flush fails
      this.metricsBuffer.unshift(...this.metricsBuffer);
    }
  }

  private static async calculateCacheHitRate(): Promise<number> {
    const recentMetrics = this.metricsBuffer.slice(-100);
    const cacheHits = recentMetrics.filter(m => m.cacheHit);
    return recentMetrics.length > 0 ? (cacheHits.length / recentMetrics.length) * 100 : 0;
  }

  private static async getRecentApiMetrics(minutes: number) {
    const cutoff = Date.now() - minutes * 60 * 1000;
    const recentMetrics = this.metricsBuffer.filter(m => m.timestamp.getTime() > cutoff);
    
    if (recentMetrics.length === 0) {
      return { totalRequests: 0, avgResponseTime: 0, errorRate: 0 };
    }

    const errors = recentMetrics.filter(m => m.statusCode >= 400);
    const avgResponseTime = Math.round(
      recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
    );

    return {
      totalRequests: recentMetrics.length,
      avgResponseTime,
      errorRate: (errors.length / recentMetrics.length) * 100,
    };
  }

  private static getClientIP(req: NextRequest): string | undefined {
    return (
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      undefined
    );
  }

  private static getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return Math.round(usage.heapUsed / 1024 / 1024); // Convert to MB
    }
    return 0;
  }
}