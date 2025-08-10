/**
 * @jest-environment node
 */
import { PerformanceMonitor } from '@/lib/performance-monitor';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Clear any existing metrics
    PerformanceMonitor.clearMetrics();
    jest.clearAllMocks();
  });

  describe('startRequest', () => {
    it('creates a new request tracker', () => {
      const tracker = PerformanceMonitor.startRequest('/api/test', 'GET', '127.0.0.1', 'test-user-agent');
      
      expect(tracker).toHaveProperty('end');
      expect(tracker).toHaveProperty('addMetadata');
      expect(typeof tracker.end).toBe('function');
      expect(typeof tracker.addMetadata).toBe('function');
    });

    it('handles missing optional parameters', () => {
      const tracker = PerformanceMonitor.startRequest('/api/test', 'GET');
      
      expect(tracker).toHaveProperty('end');
      expect(tracker).toHaveProperty('addMetadata');
    });
  });

  describe('request tracking lifecycle', () => {
    it('records successful request metrics', () => {
      const tracker = PerformanceMonitor.startRequest('/api/indexItems', 'GET', '127.0.0.1', 'Mozilla/5.0');
      tracker.addMetadata({ userId: 'test-user' });
      tracker.end(200);

      const metrics = PerformanceMonitor.getMetrics(10);
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        endpoint: '/api/indexItems',
        method: 'GET',
        statusCode: 200,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        metadata: { userId: 'test-user' },
      });
      expect(metrics[0]).toHaveProperty('responseTime');
      expect(metrics[0]).toHaveProperty('timestamp');
      expect(metrics[0]).toHaveProperty('id');
    });

    it('records error request metrics', () => {
      const tracker = PerformanceMonitor.startRequest('/api/indexItems', 'POST', '192.168.1.1');
      tracker.end(500, 'Internal server error');

      const metrics = PerformanceMonitor.getMetrics(10);
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        endpoint: '/api/indexItems',
        method: 'POST',
        statusCode: 500,
        error: 'Internal server error',
        ipAddress: '192.168.1.1',
      });
    });

    it('handles multiple concurrent requests', () => {
      const tracker1 = PerformanceMonitor.startRequest('/api/test1', 'GET');
      const tracker2 = PerformanceMonitor.startRequest('/api/test2', 'POST');
      
      tracker1.end(200);
      tracker2.end(201);

      const metrics = PerformanceMonitor.getMetrics(10);
      
      expect(metrics).toHaveLength(2);
      expect(metrics.map(m => m.endpoint)).toContain('/api/test1');
      expect(metrics.map(m => m.endpoint)).toContain('/api/test2');
    });
  });

  describe('getMetrics', () => {
    it('returns empty array when no metrics exist', () => {
      const metrics = PerformanceMonitor.getMetrics(10);
      expect(metrics).toEqual([]);
    });

    it('returns limited number of metrics', () => {
      // Create 5 requests
      for (let i = 0; i < 5; i++) {
        const tracker = PerformanceMonitor.startRequest(`/api/test${i}`, 'GET');
        tracker.end(200);
      }

      const metrics = PerformanceMonitor.getMetrics(3);
      expect(metrics).toHaveLength(3);
    });

    it('returns metrics in reverse chronological order (most recent first)', () => {
      const tracker1 = PerformanceMonitor.startRequest('/api/first', 'GET');
      tracker1.end(200);
      
      // Add small delay to ensure different timestamps
      setTimeout(() => {
        const tracker2 = PerformanceMonitor.startRequest('/api/second', 'GET');
        tracker2.end(200);
        
        const metrics = PerformanceMonitor.getMetrics(10);
        expect(metrics[0].endpoint).toBe('/api/second');
        expect(metrics[1].endpoint).toBe('/api/first');
      }, 1);
    });

    it('handles default limit', () => {
      // Create more than 100 requests to test default limit
      for (let i = 0; i < 150; i++) {
        const tracker = PerformanceMonitor.startRequest(`/api/test${i}`, 'GET');
        tracker.end(200);
      }

      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getAnalytics', () => {
    beforeEach(() => {
      // Create sample metrics data
      const endpoints = ['/api/indexItems', '/api/metrics', '/admin'];
      const methods = ['GET', 'POST'];
      const statusCodes = [200, 201, 400, 500];
      
      for (let i = 0; i < 20; i++) {
        const tracker = PerformanceMonitor.startRequest(
          endpoints[i % endpoints.length], 
          methods[i % methods.length]
        );
        // Simulate different response times
        setTimeout(() => {
          tracker.end(statusCodes[i % statusCodes.length]);
        }, Math.random() * 100);
      }
    });

    it('calculates total requests', () => {
      const analytics = PerformanceMonitor.getAnalytics();
      expect(analytics.totalRequests).toBe(20);
    });

    it('calculates average response time', () => {
      const analytics = PerformanceMonitor.getAnalytics();
      expect(analytics.averageResponseTime).toBeGreaterThan(0);
      expect(typeof analytics.averageResponseTime).toBe('number');
    });

    it('calculates error rate', () => {
      const analytics = PerformanceMonitor.getAnalytics();
      expect(analytics.errorRate).toBeGreaterThanOrEqual(0);
      expect(analytics.errorRate).toBeLessThanOrEqual(100);
      expect(typeof analytics.errorRate).toBe('number');
    });

    it('returns top endpoints', () => {
      const analytics = PerformanceMonitor.getAnalytics();
      expect(analytics.topEndpoints).toBeInstanceOf(Array);
      expect(analytics.topEndpoints.length).toBeLessThanOrEqual(10);
      
      analytics.topEndpoints.forEach(endpoint => {
        expect(endpoint).toHaveProperty('endpoint');
        expect(endpoint).toHaveProperty('count');
        expect(typeof endpoint.count).toBe('number');
      });
    });

    it('returns status code distribution', () => {
      const analytics = PerformanceMonitor.getAnalytics();
      expect(analytics.statusCodes).toBeInstanceOf(Object);
      
      Object.keys(analytics.statusCodes).forEach(statusCode => {
        expect(typeof analytics.statusCodes[statusCode]).toBe('number');
        expect(analytics.statusCodes[statusCode]).toBeGreaterThan(0);
      });
    });

    it('includes performance percentiles', () => {
      const analytics = PerformanceMonitor.getAnalytics();
      expect(analytics).toHaveProperty('p50');
      expect(analytics).toHaveProperty('p90');
      expect(analytics).toHaveProperty('p95');
      expect(analytics).toHaveProperty('p99');
      
      expect(typeof analytics.p50).toBe('number');
      expect(typeof analytics.p90).toBe('number');
      expect(typeof analytics.p95).toBe('number');
      expect(typeof analytics.p99).toBe('number');
    });

    it('handles empty metrics gracefully', () => {
      PerformanceMonitor.clearMetrics();
      const analytics = PerformanceMonitor.getAnalytics();
      
      expect(analytics.totalRequests).toBe(0);
      expect(analytics.averageResponseTime).toBe(0);
      expect(analytics.errorRate).toBe(0);
      expect(analytics.topEndpoints).toEqual([]);
      expect(analytics.statusCodes).toEqual({});
    });
  });

  describe('clearMetrics', () => {
    it('removes all stored metrics', () => {
      // Add some metrics
      const tracker = PerformanceMonitor.startRequest('/api/test', 'GET');
      tracker.end(200);
      
      expect(PerformanceMonitor.getMetrics(10)).toHaveLength(1);
      
      PerformanceMonitor.clearMetrics();
      expect(PerformanceMonitor.getMetrics(10)).toHaveLength(0);
    });
  });

  describe('memory management', () => {
    it('maintains reasonable memory usage with many requests', () => {
      // Simulate high load
      for (let i = 0; i < 1000; i++) {
        const tracker = PerformanceMonitor.startRequest(`/api/load-test-${i}`, 'GET');
        tracker.end(200);
      }
      
      const metrics = PerformanceMonitor.getMetrics(100);
      expect(metrics.length).toBeLessThanOrEqual(100);
      
      // Memory should be bounded by the internal limit
      const allMetrics = PerformanceMonitor.getMetrics(2000);
      expect(allMetrics.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('addMetadata', () => {
    it('accepts and stores custom metadata', () => {
      const tracker = PerformanceMonitor.startRequest('/api/test', 'GET');
      tracker.addMetadata({ 
        userId: 'test-user',
        feature: 'indexItems',
        version: '1.0.0'
      });
      tracker.end(200);

      const metrics = PerformanceMonitor.getMetrics(10);
      expect(metrics[0].metadata).toEqual({
        userId: 'test-user',
        feature: 'indexItems',
        version: '1.0.0'
      });
    });

    it('handles multiple metadata calls', () => {
      const tracker = PerformanceMonitor.startRequest('/api/test', 'GET');
      tracker.addMetadata({ step1: 'complete' });
      tracker.addMetadata({ step2: 'complete' });
      tracker.end(200);

      const metrics = PerformanceMonitor.getMetrics(10);
      expect(metrics[0].metadata).toEqual({
        step1: 'complete',
        step2: 'complete'
      });
    });
  });
});