import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import SearchInsightsPage from '@/app/admin/analytics/search/page';
import '@testing-library/jest-dom';

// Mock modules
jest.mock('next-auth/react');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn()
}));
jest.mock('recharts', () => ({
  BarChart: () => null,
  Bar: () => null,
  LineChart: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

// Mock fetch
global.fetch = jest.fn();

describe('Search Insights Page', () => {
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } }
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      refresh: jest.fn()
    });
    (usePathname as jest.Mock).mockReturnValue('/admin/analytics/search');
    jest.clearAllMocks();
  });

  it('should render the search insights page', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        overview: {
          totalSearches: 15000,
          uniqueSearchers: 1200,
          avgSearchesPerUser: 12.5,
          noResultsRate: 0.15
        },
        topSearchTerms: [
          { term: 'financial aid', count: 2500, clickThrough: 0.85 },
          { term: 'registration', count: 2000, clickThrough: 0.90 },
          { term: 'counseling', count: 1800, clickThrough: 0.75 },
          { term: 'library', count: 1500, clickThrough: 0.95 },
          { term: 'parking', count: 1200, clickThrough: 0.88 }
        ],
        noResultsSearches: [
          { term: 'meal plan', count: 150 },
          { term: 'dormitory', count: 120 },
          { term: 'sports teams', count: 100 }
        ],
        searchPatterns: {
          avgSearchLength: 2.3,
          refinementRate: 0.35,
          exitRate: 0.20
        },
        recommendations: [
          { type: 'missing_content', suggestion: 'Add content for "meal plan" - searched 150 times with no results' },
          { type: 'low_clickthrough', suggestion: 'Improve results for "counseling" - only 75% click-through rate' },
          { type: 'popular_path', suggestion: 'Create direct link for "financial aid → forms" path' }
        ]
      })
    });

    render(<SearchInsightsPage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Search Insights')).toBeInTheDocument();
      expect(screen.getByText('Analyze search patterns and improve content discoverability')).toBeInTheDocument();
      expect(screen.getByText('15,000')).toBeInTheDocument(); // Total searches
      expect(screen.getAllByText('1,200')[0]).toBeInTheDocument(); // Unique searchers
      expect(screen.getByText('12.5')).toBeInTheDocument(); // Avg searches per user
      expect(screen.getByText('15%')).toBeInTheDocument(); // No results rate
    });
  });

  it('should display top search terms with click-through rates', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        overview: {
          totalSearches: 10000,
          uniqueSearchers: 1000,
          avgSearchesPerUser: 10,
          noResultsRate: 0.10
        },
        topSearchTerms: [
          { term: 'financial aid', count: 1000, clickThrough: 0.80 },
          { term: 'registration', count: 800, clickThrough: 0.85 }
        ],
        noResultsSearches: [],
        searchPatterns: {},
        recommendations: []
      })
    });

    render(<SearchInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText('financial aid')).toBeInTheDocument();
      expect(screen.getAllByText('1,000')[0]).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('registration')).toBeInTheDocument();
      expect(screen.getByText('800')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  it('should display no-results searches', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        overview: {
          totalSearches: 10000,
          uniqueSearchers: 1000,
          avgSearchesPerUser: 10,
          noResultsRate: 0.10
        },
        topSearchTerms: [],
        noResultsSearches: [
          { term: 'cafeteria menu', count: 50 },
          { term: 'gym hours', count: 30 },
          { term: 'tutoring schedule', count: 20 }
        ],
        searchPatterns: {},
        recommendations: []
      })
    });

    render(<SearchInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText('No Results Searches')).toBeInTheDocument();
      expect(screen.getByText('cafeteria menu')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('gym hours')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
    });
  });

  it('should display recommendations', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        overview: {
          totalSearches: 10000,
          uniqueSearchers: 1000,
          avgSearchesPerUser: 10,
          noResultsRate: 0.10
        },
        topSearchTerms: [],
        noResultsSearches: [],
        searchPatterns: {},
        recommendations: [
          { type: 'missing_content', suggestion: 'Add content for "student housing"' },
          { type: 'low_clickthrough', suggestion: 'Improve search results for "transfer requirements"' }
        ]
      })
    });

    render(<SearchInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.getByText(/Add content for "student housing"/)).toBeInTheDocument();
      expect(screen.getByText(/Improve search results for "transfer requirements"/)).toBeInTheDocument();
    });
  });

  it('should handle time range changes', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          overview: { totalSearches: 15000, uniqueSearchers: 1200, avgSearchesPerUser: 12.5, noResultsRate: 0.15 },
          topSearchTerms: [],
          noResultsSearches: [],
          searchPatterns: {},
          recommendations: []
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          overview: { totalSearches: 3000, uniqueSearchers: 500, avgSearchesPerUser: 6, noResultsRate: 0.12 },
          topSearchTerms: [],
          noResultsSearches: [],
          searchPatterns: {},
          recommendations: []
        })
      });

    render(<SearchInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText('15,000')).toBeInTheDocument();
    });

    // Change time range to week
    const weekButton = screen.getByText('7 Days');
    fireEvent.click(weekButton);

    await waitFor(() => {
      expect(screen.getByText('3,000')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith('/api/admin/analytics/search?range=week');
  });

  it('should export search insights data', async () => {
    const mockCreateObjectURL = jest.fn();
    const mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const mockClick = jest.fn();
    const mockAnchor = { click: mockClick, href: '', download: '' };
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        overview: { totalSearches: 10000, uniqueSearchers: 1000, avgSearchesPerUser: 10, noResultsRate: 0.10 },
        topSearchTerms: [],
        noResultsSearches: [],
        searchPatterns: null,
        recommendations: []
      })
    });

    render(<SearchInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText('10,000')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockAnchor.download).toContain('search-insights');
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<SearchInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load search insights')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('should display search patterns', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        overview: {
          totalSearches: 10000,
          uniqueSearchers: 1000,
          avgSearchesPerUser: 10,
          noResultsRate: 0.10
        },
        topSearchTerms: [],
        noResultsSearches: [],
        searchPatterns: {
          avgSearchLength: 2.5,
          refinementRate: 0.30,
          exitRate: 0.15,
          filterUsage: {
            campus: 0.45,
            letter: 0.20
          }
        },
        recommendations: []
      })
    });

    render(<SearchInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText('10,000')).toBeInTheDocument();
    });

    // Check that Search Behavior section appears
    expect(screen.getByText('Search Behavior')).toBeInTheDocument();
    expect(screen.getByText('2.5 words')).toBeInTheDocument();
    expect(screen.getAllByText('30%')[0]).toBeInTheDocument(); // There might be multiple 30%
    expect(screen.getAllByText('15%')[0]).toBeInTheDocument(); // There might be multiple 15%
  });
});