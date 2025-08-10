import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import UsageStatsPage from '@/app/admin/analytics/usage/page';
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
  BarChart: () => null,
  Bar: () => null,
  PieChart: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

// Mock fetch
global.fetch = jest.fn();

describe('Usage Stats Page', () => {
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } }
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      refresh: jest.fn()
    });
    (usePathname as jest.Mock).mockReturnValue('/admin/analytics/usage');
    jest.clearAllMocks();
  });

  it('should render the usage stats page', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        overview: {
          totalCalls: 125000,
          uniqueUsers: 450,
          avgCallsPerDay: 4166,
          peakHour: 14
        },
        campusMetrics: [
          { campus: 'Skyline College', calls: 45000, growth: 0.15 },
          { campus: 'College of San Mateo', calls: 40000, growth: 0.08 },
          { campus: 'Cañada College', calls: 30000, growth: 0.22 },
          { campus: 'District Office', calls: 10000, growth: -0.05 }
        ],
        popularEndpoints: [
          { endpoint: '/api/indexItems', calls: 80000, avgTime: 120 },
          { endpoint: '/api/health', calls: 25000, avgTime: 45 },
          { endpoint: '/api/metrics', calls: 20000, avgTime: 80 }
        ],
        timeSeriesData: {
          daily: Array(30).fill(null).map((_, i) => ({
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            calls: Math.floor(3000 + Math.random() * 2000)
          }))
        }
      })
    });

    render(<UsageStatsPage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Usage Statistics')).toBeInTheDocument();
      expect(screen.getByText('API usage analytics and system utilization metrics')).toBeInTheDocument();
      expect(screen.getByText('125,000')).toBeInTheDocument(); // Total calls
      expect(screen.getByText('450')).toBeInTheDocument(); // Unique users
      expect(screen.getByText('4,166')).toBeInTheDocument(); // Avg calls per day
      expect(screen.getByText('2:00 PM')).toBeInTheDocument(); // Peak hour
    });
  });

  it('should display campus-specific metrics', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        overview: {
          totalCalls: 100000,
          uniqueUsers: 400,
          avgCallsPerDay: 3333,
          peakHour: 13
        },
        campusMetrics: [
          { campus: 'Skyline College', calls: 40000, growth: 0.10 },
          { campus: 'College of San Mateo', calls: 35000, growth: 0.05 }
        ],
        popularEndpoints: [],
        timeSeriesData: { daily: [] }
      })
    });

    render(<UsageStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Skyline College')).toBeInTheDocument();
      expect(screen.getByText('40,000')).toBeInTheDocument();
      expect(screen.getByText('+10%')).toBeInTheDocument();
      expect(screen.getByText('College of San Mateo')).toBeInTheDocument();
      expect(screen.getByText('35,000')).toBeInTheDocument();
      expect(screen.getByText('+5%')).toBeInTheDocument();
    });
  });

  it('should handle date range changes', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          overview: { totalCalls: 100000, uniqueUsers: 400, avgCallsPerDay: 3333, peakHour: 13 },
          campusMetrics: [],
          popularEndpoints: [],
          timeSeriesData: { daily: [] }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          overview: { totalCalls: 25000, uniqueUsers: 300, avgCallsPerDay: 3571, peakHour: 14 },
          campusMetrics: [],
          popularEndpoints: [],
          timeSeriesData: { daily: [] }
        })
      });

    render(<UsageStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('100,000')).toBeInTheDocument();
    });

    // Change date range to week
    const weekButton = screen.getByText('7 Days');
    fireEvent.click(weekButton);

    await waitFor(() => {
      expect(screen.getByText('25,000')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith('/api/admin/analytics/usage?range=week');
  });

  it('should export data as CSV', async () => {
    const mockCreateObjectURL = jest.fn();
    const mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock createElement and click
    const mockClick = jest.fn();
    const mockAnchor = { click: mockClick, href: '', download: '' };
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        overview: { totalCalls: 100000, uniqueUsers: 400, avgCallsPerDay: 3333, peakHour: 13 },
        campusMetrics: [],
        popularEndpoints: [],
        timeSeriesData: { daily: [] }
      })
    });

    render(<UsageStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Usage Statistics')).toBeInTheDocument();
    });

    // Click export button
    const exportButton = screen.getByText('Export CSV');
    fireEvent.click(exportButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockAnchor.download).toContain('usage-stats');
  });

  it('should display popular endpoints', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        overview: { totalCalls: 100000, uniqueUsers: 400, avgCallsPerDay: 3333, peakHour: 13 },
        campusMetrics: [],
        popularEndpoints: [
          { endpoint: '/api/indexItems', calls: 50000, avgTime: 100 },
          { endpoint: '/api/health', calls: 30000, avgTime: 20 },
          { endpoint: '/api/metrics', calls: 20000, avgTime: 50 }
        ],
        timeSeriesData: { daily: [] }
      })
    });

    render(<UsageStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('/api/indexItems')).toBeInTheDocument();
      expect(screen.getByText('50,000')).toBeInTheDocument();
      expect(screen.getByText('100ms')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<UsageStatsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load usage statistics/i)).toBeInTheDocument();
    });
  });

  it('should refresh data when refresh button is clicked', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          overview: { totalCalls: 100000, uniqueUsers: 400, avgCallsPerDay: 3333, peakHour: 13 },
          campusMetrics: [],
          popularEndpoints: [],
          timeSeriesData: { daily: [] }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          overview: { totalCalls: 105000, uniqueUsers: 410, avgCallsPerDay: 3500, peakHour: 14 },
          campusMetrics: [],
          popularEndpoints: [],
          timeSeriesData: { daily: [] }
        })
      });

    render(<UsageStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('100,000')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByLabelText('Refresh data');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText('105,000')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});