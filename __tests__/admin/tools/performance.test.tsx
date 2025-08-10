import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import PerformancePage from '@/app/admin/tools/performance/page';
import '@testing-library/jest-dom';

// Mock modules
jest.mock('next-auth/react');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn()
}));
jest.mock('recharts', () => ({
  LineChart: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: () => null,
  Bar: () => null,
}));

// Mock fetch
global.fetch = jest.fn();

describe('Performance Monitor Page', () => {
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } }
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      refresh: jest.fn()
    });
    (usePathname as jest.Mock).mockReturnValue('/admin/tools/performance');
    jest.clearAllMocks();
  });

  it('should render the performance monitor page', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        metrics: {
          apiCalls: 1500,
          avgResponseTime: 145,
          cacheHitRate: 0.89,
          errorRate: 0.02
        },
        endpoints: [
          { endpoint: '/api/indexItems', calls: 1000, avgTime: 120, errors: 5 },
          { endpoint: '/api/health', calls: 500, avgTime: 50, errors: 0 }
        ],
        timeSeries: [
          { time: '00:00', responseTime: 140, requests: 50 },
          { time: '01:00', responseTime: 145, requests: 45 }
        ]
      })
    });

    render(<PerformancePage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Performance Monitor')).toBeInTheDocument();
      expect(screen.getByText('Real-time API and system performance metrics')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument(); // API calls
      expect(screen.getByText('145ms')).toBeInTheDocument(); // Avg response time
      expect(screen.getByText('89%')).toBeInTheDocument(); // Cache hit rate
      expect(screen.getByText('2%')).toBeInTheDocument(); // Error rate
    });
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<PerformancePage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load performance data/i)).toBeInTheDocument();
    });
  });

  it('should display endpoint performance table', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        metrics: {
          apiCalls: 1000,
          avgResponseTime: 100,
          cacheHitRate: 0.9,
          errorRate: 0.01
        },
        endpoints: [
          { endpoint: '/api/indexItems', calls: 800, avgTime: 110, errors: 8 },
          { endpoint: '/api/health', calls: 200, avgTime: 60, errors: 0 }
        ],
        timeSeries: []
      })
    });

    render(<PerformancePage />);

    await waitFor(() => {
      expect(screen.getByText('/api/indexItems')).toBeInTheDocument();
      expect(screen.getByText('800')).toBeInTheDocument();
      expect(screen.getByText('110ms')).toBeInTheDocument();
      expect(screen.getAllByText('1%')[0]).toBeInTheDocument(); // Error rate for indexItems
    });
  });

  it('should auto-refresh data every 30 seconds', async () => {
    jest.useFakeTimers();

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          metrics: { apiCalls: 1000, avgResponseTime: 100, cacheHitRate: 0.9, errorRate: 0.01 },
          endpoints: [],
          timeSeries: []
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          metrics: { apiCalls: 1100, avgResponseTime: 105, cacheHitRate: 0.91, errorRate: 0.01 },
          endpoints: [],
          timeSeries: []
        })
      });

    render(<PerformancePage />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    // Fast-forward 30 seconds
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(screen.getByText('1,100')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('should display loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<PerformancePage />);

    expect(screen.getByText(/Loading performance data/i)).toBeInTheDocument();
  });

  it('should show cache and database metrics when available', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        metrics: {
          apiCalls: 1500,
          avgResponseTime: 145,
          cacheHitRate: 0.89,
          errorRate: 0.02,
          dbQueries: 450,
          avgDbTime: 25,
          activeConnections: 5,
          memoryUsage: 0.75
        },
        endpoints: [],
        timeSeries: []
      })
    });

    render(<PerformancePage />);

    await waitFor(() => {
      expect(screen.getByText('Database Performance')).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument(); // DB queries
      expect(screen.getByText('25ms')).toBeInTheDocument(); // Avg DB time
      expect(screen.getByText('5')).toBeInTheDocument(); // Active connections
      expect(screen.getByText('75%')).toBeInTheDocument(); // Memory usage
    });
  });
});