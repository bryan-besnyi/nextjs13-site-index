/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/cache/invalidate/route';
import { kv } from '@vercel/kv';

// Mock Vercel KV
jest.mock('@vercel/kv', () => ({
  kv: {
    del: jest.fn(),
    keys: jest.fn(),
  },
}));

// Mock getServerSession to avoid auth issues
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({ user: { email: 'test@smccd.edu' } })),
}));

describe('/api/admin/cache/invalidate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/admin/cache/invalidate', () => {
    it('invalidates specific cache key', async () => {
      (kv.del as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/cache/invalidate', {
        method: 'POST',
        body: JSON.stringify({ key: 'all-index-items' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(kv.del).toHaveBeenCalledWith('all-index-items');
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('invalidated');
    });

    it('invalidates multiple cache keys', async () => {
      (kv.del as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/cache/invalidate', {
        method: 'POST',
        body: JSON.stringify({ 
          keys: ['all-index-items', 'items-letter-A', 'items-campus-CSM'] 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(kv.del).toHaveBeenCalledTimes(3);
      expect(data.invalidated).toBe(3);
    });

    it('invalidates all cache keys with pattern', async () => {
      const mockKeys = [
        'items-letter-A',
        'items-letter-B',
        'items-campus-CSM',
        'all-index-items',
      ];
      
      (kv.keys as jest.Mock).mockResolvedValue(mockKeys);
      (kv.del as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/cache/invalidate', {
        method: 'POST',
        body: JSON.stringify({ pattern: 'items-letter-*' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(kv.keys).toHaveBeenCalledWith('items-letter-*');
      expect(kv.del).toHaveBeenCalledTimes(2); // Only letter keys
    });

    it('clears all cache when pattern is *', async () => {
      const mockKeys = ['key1', 'key2', 'key3'];
      
      (kv.keys as jest.Mock).mockResolvedValue(mockKeys);
      (kv.del as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/cache/invalidate', {
        method: 'POST',
        body: JSON.stringify({ pattern: '*' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(kv.del).toHaveBeenCalledTimes(3);
      expect(data.message).toContain('All cache cleared');
    });

    it('handles invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/cache/invalidate', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('handles cache deletion errors', async () => {
      (kv.del as jest.Mock).mockRejectedValue(new Error('Redis connection failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/cache/invalidate', {
        method: 'POST',
        body: JSON.stringify({ key: 'test-key' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });
});