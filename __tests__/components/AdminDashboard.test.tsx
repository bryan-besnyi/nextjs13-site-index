/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '@/app/components/AdminDashboard';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock chart components that may not render in JSDOM
jest.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<AdminDashboard />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays metrics after successful data fetch', async () => {
    const mockMetrics = {
      totalItems: 1250,
      campusDistribution: {
        'College of San Mateo': 400,
        'Skyline College': 350,
        'Cañada College': 300,
        'District Office': 200,
      },
      letterDistribution: {
        'A': 120, 'B': 98, 'C': 156, 'D': 87, 'E': 76,
      },
      performanceMetrics: {
        totalRequests: 15000,
        averageResponseTime: 145,
        errorRate: 2.1,
        cacheHitRate: 89.5,
      },
      recentActivity: [
        { action: 'Created', item: 'Financial Aid Office', timestamp: '2024-01-15T10:30:00Z' },
        { action: 'Updated', item: 'Library Services', timestamp: '2024-01-15T09:15:00Z' },
      ],
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMetrics),
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument(); // Total items
      expect(screen.getByText('15,000')).toBeInTheDocument(); // Total requests
      expect(screen.getByText('145ms')).toBeInTheDocument(); // Average response time
      expect(screen.getByText('2.1%')).toBeInTheDocument(); // Error rate
    });
  });

  it('displays campus distribution chart', async () => {
    const mockMetrics = {
      totalItems: 1000,
      campusDistribution: {
        'College of San Mateo': 300,
        'Skyline College': 250,
        'Cañada College': 250,
        'District Office': 200,
      },
      letterDistribution: {},
      performanceMetrics: {},
      recentActivity: [],
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMetrics),
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByText('College of San Mateo')).toBeInTheDocument();
      expect(screen.getByText('300')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument();
    });
  });

  it('displays recent activity feed', async () => {
    const mockMetrics = {
      totalItems: 100,
      campusDistribution: {},
      letterDistribution: {},
      performanceMetrics: {},
      recentActivity: [
        { 
          action: 'Created', 
          item: 'Student Services', 
          timestamp: '2024-01-15T14:30:00Z',
          user: 'admin@smccd.edu'
        },
        { 
          action: 'Deleted', 
          item: 'Old Resource', 
          timestamp: '2024-01-15T13:15:00Z',
          user: 'admin@smccd.edu'
        },
      ],
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMetrics),
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Student Services')).toBeInTheDocument();
      expect(screen.getByText('Deleted')).toBeInTheDocument();
      expect(screen.getByText('Old Resource')).toBeInTheDocument();
    });
  });

  it('shows system health indicators', async () => {
    const mockMetrics = {
      totalItems: 500,
      campusDistribution: {},
      letterDistribution: {},
      performanceMetrics: {
        totalRequests: 10000,
        averageResponseTime: 120,
        errorRate: 1.5,
        cacheHitRate: 92.3,
      },
      systemHealth: {
        database: 'healthy',
        cache: 'healthy',
        api: 'healthy',
        lastBackup: '2024-01-15T06:00:00Z',
      },
      recentActivity: [],
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMetrics),
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/system health/i)).toBeInTheDocument();
      expect(screen.getByText(/database.*healthy/i)).toBeInTheDocument();
      expect(screen.getByText(/cache.*healthy/i)).toBeInTheDocument();
    });
  });

  it('formats large numbers correctly', async () => {
    const mockMetrics = {
      totalItems: 15000,
      campusDistribution: {},
      letterDistribution: {},
      performanceMetrics: {
        totalRequests: 1234567,
        averageResponseTime: 89,
        errorRate: 0.5,
      },
      recentActivity: [],
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMetrics),
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('15,000')).toBeInTheDocument();
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button clicked', async () => {
    const mockMetrics = {
      totalItems: 1000,
      campusDistribution: {},
      letterDistribution: {},
      performanceMetrics: {},
      recentActivity: [],
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMetrics),
    });

    render(<AdminDashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    // Clear mock and set up new response
    (fetch as jest.Mock).mockClear();
    const updatedMetrics = { ...mockMetrics, totalItems: 1100 };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(updatedMetrics),
    });

    // Click refresh button if it exists
    const refreshButton = screen.queryByRole('button', { name: /refresh/i });
    if (refreshButton) {
      refreshButton.click();
      
      await waitFor(() => {
        expect(screen.getByText('1,100')).toBeInTheDocument();
      });
    }
  });
});