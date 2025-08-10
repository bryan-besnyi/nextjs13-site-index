/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/cache/route';
import { kv } from '@vercel/kv';

// Mock Vercel KV
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  },
}));

describe('/api/admin/cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/cache', () => {
    it('returns cache statistics', async () => {
      const mockCacheKeys = [
        'all-index-items',
        'items-letter-A', 
        'items-campus-College of San Mateo',
      ];
      
      (kv.keys as jest.Mock).mockResolvedValue(mockCacheKeys);
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'all-index-items') {
          return Promise.resolve([{ id: 1, title: 'Test' }]);
        }
        return Promise.resolve(null);
      });

      const request = new NextRequest('http://localhost:3000/api/admin/cache');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('totalKeys');
      expect(data).toHaveProperty('keysByPattern');
      expect(data).toHaveProperty('cacheSize');
      expect(data.totalKeys).toBe(3);
    });

    it('handles empty cache', async () => {
      (kv.keys as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/admin/cache');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalKeys).toBe(0);
      expect(data.keysByPattern).toEqual({});
    });

    it('handles cache errors gracefully', async () => {
      (kv.keys as jest.Mock).mockRejectedValue(new Error('Redis connection failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/cache');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });

    it('categorizes cache keys by pattern', async () => {
      const mockCacheKeys = [
        'all-index-items',
        'items-letter-A',
        'items-letter-B', 
        'items-campus-CSM',
        'items-campus-Skyline',
        'other-cache-key',
      ];
      
      (kv.keys as jest.Mock).mockResolvedValue(mockCacheKeys);
      (kv.get as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/cache');
      const response = await GET(request);
      const data = await response.json();

      expect(data.keysByPattern).toHaveProperty('letter');
      expect(data.keysByPattern).toHaveProperty('campus');
      expect(data.keysByPattern.letter).toBe(2);
      expect(data.keysByPattern.campus).toBe(2);
    });
  });
});