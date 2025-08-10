import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import CachePage from '@/app/admin/tools/cache/page';
import '@testing-library/jest-dom';

// Mock modules
jest.mock('next-auth/react');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn()
}));
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  }
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />
}));

// Mock fetch
global.fetch = jest.fn();

describe('Cache Manager Page', () => {
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } }
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      refresh: jest.fn()
    });
    (usePathname as jest.Mock).mockReturnValue('/admin/tools/cache');
    jest.clearAllMocks();
  });

  it('should render the cache manager page', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stats: {
          totalKeys: 150,
          memoryUsage: '45.2 MB',
          hitRate: 0.92,
          missRate: 0.08,
          evictions: 23
        },
        entries: [
          { key: 'api:indexItems:all', value: '[...]', ttl: 3600, size: '2.1 KB' },
          { key: 'api:indexItems:A', value: '[...]', ttl: 3600, size: '1.5 KB' }
        ]
      })
    });

    render(<CachePage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Cache Manager')).toBeInTheDocument();
      expect(screen.getByText('Manage Vercel KV cache entries and monitor cache performance')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument(); // Total keys
      expect(screen.getByText('45.2 MB')).toBeInTheDocument(); // Memory usage
      expect(screen.getByText('92%')).toBeInTheDocument(); // Hit rate
      expect(screen.getByText('23')).toBeInTheDocument(); // Evictions
    });
  });

  it('should display cache entries table', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stats: {
          totalKeys: 2,
          memoryUsage: '3.6 KB',
          hitRate: 0.9,
          missRate: 0.1,
          evictions: 0
        },
        entries: [
          { key: 'api:indexItems:all', value: '[...]', ttl: 3600, size: '2.1 KB' },
          { key: 'api:indexItems:A', value: '[...]', ttl: 1800, size: '1.5 KB' }
        ]
      })
    });

    render(<CachePage />);

    await waitFor(() => {
      expect(screen.getByText('api:indexItems:all')).toBeInTheDocument();
      expect(screen.getByText('api:indexItems:A')).toBeInTheDocument();
      expect(screen.getByText('2.1 KB')).toBeInTheDocument();
      expect(screen.getByText('1.5 KB')).toBeInTheDocument();
    });
  });

  it('should handle cache invalidation for single key', async () => {
    const toast = require('react-hot-toast').toast;
    
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: { totalKeys: 1, memoryUsage: '2.1 KB', hitRate: 0.9, missRate: 0.1, evictions: 0 },
          entries: [{ key: 'api:indexItems:all', value: '[...]', ttl: 3600, size: '2.1 KB' }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Cache key invalidated' })
      });

    render(<CachePage />);

    await waitFor(() => {
      expect(screen.getByText('api:indexItems:all')).toBeInTheDocument();
    });

    // Click invalidate button
    const invalidateButton = screen.getByLabelText('Invalidate api:indexItems:all');
    fireEvent.click(invalidateButton);

    // Confirm in modal
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to invalidate/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Invalidate');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Cache key invalidated');
    });
  });

  it('should handle bulk cache invalidation', async () => {
    const toast = require('react-hot-toast').toast;
    
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: { totalKeys: 2, memoryUsage: '3.6 KB', hitRate: 0.9, missRate: 0.1, evictions: 0 },
          entries: [
            { key: 'api:indexItems:all', value: '[...]', ttl: 3600, size: '2.1 KB' },
            { key: 'api:indexItems:A', value: '[...]', ttl: 1800, size: '1.5 KB' }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, invalidated: 2 })
      });

    render(<CachePage />);

    await waitFor(() => {
      expect(screen.getByText('api:indexItems:all')).toBeInTheDocument();
    });

    // Select all entries
    const selectAllCheckbox = screen.getByLabelText('Select all entries');
    fireEvent.click(selectAllCheckbox);

    // Click bulk invalidate button
    const bulkInvalidateButton = screen.getByText('Invalidate Selected (2)');
    fireEvent.click(bulkInvalidateButton);

    // Confirm in modal
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to invalidate 2 cache entries/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Invalidate All');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('2 cache entries invalidated');
    });
  });

  it('should handle pattern-based cache invalidation', async () => {
    const toast = require('react-hot-toast').toast;
    
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: { totalKeys: 10, memoryUsage: '15 KB', hitRate: 0.9, missRate: 0.1, evictions: 0 },
          entries: []
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, invalidated: 5 })
      });

    render(<CachePage />);

    await waitFor(() => {
      expect(screen.getByText('Cache Manager')).toBeInTheDocument();
    });

    // Click pattern invalidate button
    const patternButton = screen.getByText('Invalidate by Pattern');
    fireEvent.click(patternButton);

    // Enter pattern
    const patternInput = screen.getByPlaceholderText('e.g., api:indexItems:*');
    fireEvent.change(patternInput, { target: { value: 'api:indexItems:*' } });

    // Submit pattern
    const invalidateButton = screen.getByText('Invalidate Pattern');
    fireEvent.click(invalidateButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('5 cache entries invalidated');
    });
  });

  it('should handle cache search/filter', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stats: { totalKeys: 3, memoryUsage: '5 KB', hitRate: 0.9, missRate: 0.1, evictions: 0 },
        entries: [
          { key: 'api:indexItems:all', value: '[...]', ttl: 3600, size: '2 KB' },
          { key: 'api:indexItems:A', value: '[...]', ttl: 1800, size: '1.5 KB' },
          { key: 'api:health:status', value: '[...]', ttl: 300, size: '1.5 KB' }
        ]
      })
    });

    render(<CachePage />);

    await waitFor(() => {
      expect(screen.getByText('api:indexItems:all')).toBeInTheDocument();
      expect(screen.getByText('api:health:status')).toBeInTheDocument();
    });

    // Search for indexItems
    const searchInput = screen.getByPlaceholderText('Search cache keys...');
    fireEvent.change(searchInput, { target: { value: 'indexItems' } });

    await waitFor(() => {
      expect(screen.getByText('api:indexItems:all')).toBeInTheDocument();
      expect(screen.getByText('api:indexItems:A')).toBeInTheDocument();
      expect(screen.queryByText('api:health:status')).not.toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<CachePage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load cache data/i)).toBeInTheDocument();
    });
  });

  it('should refresh cache data', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: { totalKeys: 1, memoryUsage: '1 KB', hitRate: 0.9, missRate: 0.1, evictions: 0 },
          entries: []
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: { totalKeys: 2, memoryUsage: '2 KB', hitRate: 0.91, missRate: 0.09, evictions: 0 },
          entries: []
        })
      });

    render(<CachePage />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Initial total keys
    });

    // Click refresh button
    const refreshButton = screen.getByLabelText('Refresh cache data');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Updated total keys
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});