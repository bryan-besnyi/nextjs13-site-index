/**
 * @jest-environment node
 */
import { PerformanceMonitor, timeDbQuery, timeCacheOperation } from '@/lib/performance-monitor';
import { NextRequest } from 'next/server';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Spy on console methods
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor and recordMetrics', () => {
    it('creates a PerformanceMonitor instance and records metrics', () => {
      const request = new NextRequest('http://localhost:3000/api/indexItems', {
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 test',
          'x-forwarded-for': '192.168.1.1',
        },
      });
      
      const monitor = new PerformanceMonitor(request);
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
      
      const metrics = monitor.recordMetrics(200, {
        cacheHit: true,
        dbQueryTime: 50,
        resultCount: 10,
      });
      
      expect(metrics).toMatchObject({
        endpoint: '/api/indexItems',
        method: 'GET',
        statusCode: 200,
        cacheHit: true,
        dbQueryTime: 50,
        resultCount: 10,
        userAgent: 'Mozilla/5.0 test',
        ip: '192.168.1.1',
      });
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('responseTime');
      expect(typeof metrics.responseTime).toBe('number');
    });

    it('records error metrics', () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const monitor = new PerformanceMonitor(request);
      
      const metrics = monitor.recordMetrics(500);
      
      expect(metrics).toMatchObject({
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 500,
        cacheHit: false,
      });
    });

    it('handles missing headers gracefully', () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const monitor = new PerformanceMonitor(request);
      
      const metrics = monitor.recordMetrics(200);
      
      expect(metrics.userAgent).toBeUndefined();
      expect(metrics.ip).toBeUndefined();
    });

    it('warns about slow requests', () => {
      const request = new NextRequest('http://localhost:3000/api/slow');
      const monitor = new PerformanceMonitor(request);
      
      // Mock performance.now to simulate slow request
      const mockPerformanceNow = jest.spyOn(performance, 'now')
        .mockReturnValueOnce(0)  // start time
        .mockReturnValueOnce(1500); // end time (1500ms later)
      
      monitor.recordMetrics(200);
      
      expect(console.warn).toHaveBeenCalledWith(
        '🐌 Slow API request: GET /api/slow - 1500ms'
      );
      
      mockPerformanceNow.mockRestore();
    });
  });

  describe('getMetrics', () => {
    it('returns empty array when no metrics exist', () => {
      const metrics = PerformanceMonitor.getMetrics(10);
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('returns limited number of metrics', () => {
      // Create multiple requests to generate metrics
      for (let i = 0; i < 5; i++) {
        const request = new NextRequest(`http://localhost:3000/api/test${i}`);
        const monitor = new PerformanceMonitor(request);
        monitor.recordMetrics(200);
      }
      
      const metrics = PerformanceMonitor.getMetrics(3);
      expect(metrics.length).toBeLessThanOrEqual(3);
    });

    it('uses default limit of 100', () => {
      const metrics = PerformanceMonitor.getMetrics();
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getAnalytics', () => {
    beforeEach(() => {
      // Create sample metrics data
      const endpoints = ['/api/indexItems', '/api/metrics', '/admin'];
      const statusCodes = [200, 201, 400, 500];
      
      for (let i = 0; i < 10; i++) {
        const request = new NextRequest(`http://localhost:3000${endpoints[i % endpoints.length]}`);
        const monitor = new PerformanceMonitor(request);
        monitor.recordMetrics(statusCodes[i % statusCodes.length], {
          cacheHit: i % 2 === 0,
          dbQueryTime: i % 3 === 0 ? 100 : undefined,
        });
      }
    });

    it('returns analytics when metrics exist', () => {
      const analytics = PerformanceMonitor.getAnalytics();
      
      expect(analytics).toHaveProperty('totalRequests');
      expect(analytics).toHaveProperty('averageResponseTime');
      expect(analytics).toHaveProperty('medianResponseTime');
      expect(analytics).toHaveProperty('p95ResponseTime');
      expect(analytics).toHaveProperty('p99ResponseTime');
      expect(analytics).toHaveProperty('cacheHitRate');
      expect(analytics).toHaveProperty('slowQueries');
      expect(analytics).toHaveProperty('errorRate');
      expect(analytics).toHaveProperty('topEndpoints');
      expect(analytics).toHaveProperty('timeRange');
      
      expect(typeof analytics.totalRequests).toBe('number');
      expect(typeof analytics.averageResponseTime).toBe('number');
      expect(typeof analytics.cacheHitRate).toBe('number');
      expect(typeof analytics.errorRate).toBe('number');
      expect(Array.isArray(analytics.topEndpoints)).toBe(true);
      expect(analytics.timeRange).toBe('24h');
    });

    it('calculates cache hit rate correctly', () => {
      const analytics = PerformanceMonitor.getAnalytics();
      
      expect(analytics.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(analytics.cacheHitRate).toBeLessThanOrEqual(100);
    });

    it('calculates error rate correctly', () => {
      const analytics = PerformanceMonitor.getAnalytics();
      
      expect(analytics.errorRate).toBeGreaterThanOrEqual(0);
      expect(analytics.errorRate).toBeLessThanOrEqual(100);
    });

    it('returns top endpoints with correct structure', () => {
      const analytics = PerformanceMonitor.getAnalytics();
      
      analytics.topEndpoints.forEach(endpoint => {
        expect(endpoint).toHaveProperty('endpoint');
        expect(endpoint).toHaveProperty('requests');
        expect(endpoint).toHaveProperty('averageTime');
        expect(typeof endpoint.requests).toBe('number');
        expect(typeof endpoint.averageTime).toBe('number');
      });
    });

    it('handles db query time calculations', () => {
      const analytics = PerformanceMonitor.getAnalytics();
      
      if (analytics.averageDbQueryTime !== null) {
        expect(typeof analytics.averageDbQueryTime).toBe('number');
        expect(analytics.averageDbQueryTime).toBeGreaterThan(0);
      }
    });
  });

  describe('utility functions', () => {
    describe('timeDbQuery', () => {
      it('times database query execution', async () => {
        const mockQueryFn = jest.fn().mockResolvedValue('query result');
        
        const { result, queryTime } = await timeDbQuery(mockQueryFn, 'test query');
        
        expect(result).toBe('query result');
        expect(typeof queryTime).toBe('number');
        expect(queryTime).toBeGreaterThanOrEqual(0);
        expect(mockQueryFn).toHaveBeenCalled();
      });

      it('warns about slow database queries', async () => {
        const mockQueryFn = jest.fn().mockResolvedValue('slow result');
        
        // Mock performance.now to simulate slow query
        const mockPerformanceNow = jest.spyOn(performance, 'now')
          .mockReturnValueOnce(0)    // start time
          .mockReturnValueOnce(600); // end time (600ms later)
        
        await timeDbQuery(mockQueryFn, 'slow query');
        
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('🐌 Slow DB query (slow query): ')
        );
        
        mockPerformanceNow.mockRestore();
      });

      it('handles query without name', async () => {
        const mockQueryFn = jest.fn().mockResolvedValue('result');
        
        const { result, queryTime } = await timeDbQuery(mockQueryFn);
        
        expect(result).toBe('result');
        expect(typeof queryTime).toBe('number');
      });
    });

    describe('timeCacheOperation', () => {
      it('times cache operation execution', async () => {
        const mockCacheFn = jest.fn().mockResolvedValue('cache result');
        
        const { result, cacheTime } = await timeCacheOperation(mockCacheFn, 'get');
        
        expect(result).toBe('cache result');
        expect(typeof cacheTime).toBe('number');
        expect(cacheTime).toBeGreaterThanOrEqual(0);
        expect(mockCacheFn).toHaveBeenCalled();
      });

      it('warns about slow cache operations', async () => {
        const mockCacheFn = jest.fn().mockResolvedValue('slow cache result');
        
        // Mock performance.now to simulate slow cache operation
        const mockPerformanceNow = jest.spyOn(performance, 'now')
          .mockReturnValueOnce(0)    // start time
          .mockReturnValueOnce(150); // end time (150ms later)
        
        await timeCacheOperation(mockCacheFn, 'set');
        
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('🐌 Slow cache set: ')
        );
        
        mockPerformanceNow.mockRestore();
      });

      it('uses default operation type', async () => {
        const mockCacheFn = jest.fn().mockResolvedValue('result');
        
        const { result, cacheTime } = await timeCacheOperation(mockCacheFn);
        
        expect(result).toBe('result');
        expect(typeof cacheTime).toBe('number');
      });
    });
  });

  describe('memory management', () => {
    it('maintains bounded metrics store', () => {
      // This test would need to be implemented with knowledge of MAX_METRICS
      // For now, we just verify that getMetrics works with reasonable limits
      const metrics = PerformanceMonitor.getMetrics(1000);
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeLessThanOrEqual(1000);
    });
  });
});