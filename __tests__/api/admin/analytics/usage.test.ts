/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/analytics/usage/route';
import { PerformanceMonitor } from '@/lib/performance-monitor';

// Mock performance monitor
jest.mock('@/lib/performance-monitor', () => ({
  PerformanceMonitor: {
    getAnalytics: jest.fn(),
    getMetrics: jest.fn(),
  },
}));

// Mock getServerSession
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({ user: { email: 'test@smccd.edu' } })),
}));

describe('/api/admin/analytics/usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/analytics/usage', () => {
    it('returns usage analytics data', async () => {
      const mockAnalytics = {
        totalRequests: 10000,
        averageResponseTime: 145,
        errorRate: 2.1,
        cacheHitRate: 89.5,
        topEndpoints: [
          { endpoint: '/api/indexItems', requests: 5000, averageTime: 120 },
          { endpoint: '/api/health', requests: 3000, averageTime: 50 },
        ],
      };

      (PerformanceMonitor.getAnalytics as jest.Mock).mockReturnValue(mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/usage');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('analytics');
      expect(data.analytics).toEqual(mockAnalytics);
      expect(data.analytics.totalRequests).toBe(10000);
    });

    it('returns raw metrics when type=raw', async () => {
      const mockRawMetrics = [
        { endpoint: '/api/indexItems', method: 'GET', responseTime: 120, timestamp: new Date() },
        { endpoint: '/api/health', method: 'GET', responseTime: 45, timestamp: new Date() },
      ];

      (PerformanceMonitor.getMetrics as jest.Mock).mockReturnValue(mockRawMetrics);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/usage?type=raw&limit=50');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('metrics');
      expect(Array.isArray(data.metrics)).toBe(true);
      expect(PerformanceMonitor.getMetrics).toHaveBeenCalledWith(50);
    });

    it('handles time range filtering', async () => {
      const mockAnalytics = {
        totalRequests: 5000,
        averageResponseTime: 100,
        timeRange: '24h',
      };

      (PerformanceMonitor.getAnalytics as jest.Mock).mockReturnValue(mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/usage?timeRange=24h');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.timeRange).toBe('24h');
    });

    it('calculates usage trends', async () => {
      const mockAnalytics = {
        totalRequests: 15000,
        averageResponseTime: 150,
        errorRate: 1.5,
        trends: {
          requestsChange: '+15%',
          responseTimeChange: '-5%',
          errorRateChange: '-20%',
        },
      };

      (PerformanceMonitor.getAnalytics as jest.Mock).mockReturnValue(mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/usage');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analytics.trends).toBeDefined();
    });

    it('handles empty analytics data', async () => {
      (PerformanceMonitor.getAnalytics as jest.Mock).mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/usage');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('No usage data available');
    });

    it('handles analytics errors gracefully', async () => {
      (PerformanceMonitor.getAnalytics as jest.Mock).mockImplementation(() => {
        throw new Error('Analytics processing failed');
      });

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/usage');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Failed to retrieve usage analytics');
    });

    it('includes cache hit rate in analytics', async () => {
      const mockAnalytics = {
        totalRequests: 10000,
        cacheHitRate: 92.3,
        cacheStats: {
          hits: 9230,
          misses: 770,
          avgCacheTime: 5,
        },
      };

      (PerformanceMonitor.getAnalytics as jest.Mock).mockReturnValue(mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/usage');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analytics.cacheHitRate).toBe(92.3);
      expect(data.analytics.cacheStats).toBeDefined();
    });

    it('returns correct status code distribution', async () => {
      const mockAnalytics = {
        totalRequests: 10000,
        statusCodes: {
          '200': 9200,
          '404': 500,
          '500': 300,
        },
      };

      (PerformanceMonitor.getAnalytics as jest.Mock).mockReturnValue(mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/usage');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analytics.statusCodes).toBeDefined();
      expect(data.analytics.statusCodes['200']).toBe(9200);
    });
  });
});