/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/metrics/route';
import { PerformanceMonitor } from '@/lib/performance-monitor';

// Mock the performance monitor
jest.mock('@/lib/performance-monitor', () => ({
  PerformanceMonitor: {
    getMetrics: jest.fn(),
    getAnalytics: jest.fn(),
  },
}));

describe('/api/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/metrics', () => {
    it('returns analytics data by default', async () => {
      const mockAnalytics = {
        totalRequests: 1250,
        averageResponseTime: 145,
        errorRate: 2.3,
        topEndpoints: [
          { endpoint: '/api/indexItems', count: 800 },
          { endpoint: '/admin', count: 200 },
        ],
      };

      (PerformanceMonitor.getAnalytics as jest.Mock).mockReturnValue(mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        type: 'analytics',
        data: mockAnalytics,
        timestamp: expect.any(String),
      });
    });

    it('returns raw metrics when type=raw', async () => {
      const mockRawMetrics = [
        { id: '1', endpoint: '/api/indexItems', method: 'GET', responseTime: 120, timestamp: new Date() },
        { id: '2', endpoint: '/api/indexItems', method: 'POST', responseTime: 200, timestamp: new Date() },
      ];

      (PerformanceMonitor.getMetrics as jest.Mock).mockReturnValue(mockRawMetrics);

      const request = new NextRequest('http://localhost:3000/api/metrics?type=raw');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        type: 'raw',
        data: mockRawMetrics,
        count: 2,
        timestamp: expect.any(String),
      });
    });

    it('respects the limit parameter for raw metrics', async () => {
      const mockRawMetrics = [
        { id: '1', endpoint: '/api/indexItems', method: 'GET', responseTime: 120 },
      ];

      (PerformanceMonitor.getMetrics as jest.Mock).mockReturnValue(mockRawMetrics);

      const request = new NextRequest('http://localhost:3000/api/metrics?type=raw&limit=50');
      const response = await GET(request);

      expect(PerformanceMonitor.getMetrics).toHaveBeenCalledWith(50);
      expect(response.status).toBe(200);
    });

    it('returns 400 for invalid type parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/metrics?type=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid type. Use "raw" or "analytics"',
      });
    });

    it('handles no metrics data available', async () => {
      (PerformanceMonitor.getAnalytics as jest.Mock).mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        message: 'No metrics data available',
        timestamp: expect.any(String),
      });
    });

    it('logs access without authentication', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      (PerformanceMonitor.getAnalytics as jest.Mock).mockReturnValue({});

      const request = new NextRequest('http://localhost:3000/api/metrics', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      });
      
      await GET(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Metrics accessed without auth from:',
        '192.168.1.100'
      );
    });

    it('does not log when Bearer token is present', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      (PerformanceMonitor.getAnalytics as jest.Mock).mockReturnValue({});

      const request = new NextRequest('http://localhost:3000/api/metrics', {
        headers: {
          'authorization': 'Bearer some-token',
        },
      });
      
      await GET(request);

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Metrics accessed without auth')
      );
    });

    it('handles errors gracefully', async () => {
      (PerformanceMonitor.getAnalytics as jest.Mock).mockImplementation(() => {
        throw new Error('Internal metrics error');
      });

      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({
        error: 'Failed to retrieve metrics',
        timestamp: expect.any(String),
      });
    });

    it('sets correct cache headers', async () => {
      (PerformanceMonitor.getAnalytics as jest.Mock).mockReturnValue({});

      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });

    it('parses limit parameter correctly', async () => {
      (PerformanceMonitor.getMetrics as jest.Mock).mockReturnValue([]);

      const request = new NextRequest('http://localhost:3000/api/metrics?type=raw&limit=25');
      await GET(request);

      expect(PerformanceMonitor.getMetrics).toHaveBeenCalledWith(25);
    });

    it('uses default limit when not provided', async () => {
      (PerformanceMonitor.getMetrics as jest.Mock).mockReturnValue([]);

      const request = new NextRequest('http://localhost:3000/api/metrics?type=raw');
      await GET(request);

      expect(PerformanceMonitor.getMetrics).toHaveBeenCalledWith(100);
    });

    it('handles non-array raw data correctly', async () => {
      const mockObject = { message: 'No raw data' };
      (PerformanceMonitor.getMetrics as jest.Mock).mockReturnValue(mockObject);

      const request = new NextRequest('http://localhost:3000/api/metrics?type=raw');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toMatchObject({
        type: 'raw',
        data: mockObject,
        count: 0,
      });
    });
  });
});