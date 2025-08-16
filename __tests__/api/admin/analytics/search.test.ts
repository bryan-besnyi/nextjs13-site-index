/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/analytics/search/route';
import { prisma } from '@/lib/prisma-singleton';
import { kv } from '@vercel/kv';

// Mock dependencies
jest.mock('@/lib/prisma-singleton', () => ({
  prisma: {
    indexitem: {
      groupBy: jest.fn(),
    },
  },
}));

jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({ user: { email: 'test@smccd.edu' } })),
}));

describe('/api/admin/analytics/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/analytics/search', () => {
    it('returns search analytics from cache when available', async () => {
      const mockSearchData = {
        popularSearches: [
          { term: 'financial aid', count: 250 },
          { term: 'registration', count: 180 },
          { term: 'library', count: 150 },
        ],
        searchPatterns: {
          byLetter: { A: 300, B: 250, C: 200 },
          byCampus: { 'College of San Mateo': 400, 'Skyline College': 350 },
        },
        totalSearches: 1000,
      };

      (kv.get as jest.Mock).mockResolvedValue(mockSearchData);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/search');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSearchData);
      expect(kv.get).toHaveBeenCalledWith('search-analytics');
    });

    it('generates search analytics from database when cache miss', async () => {
      (kv.get as jest.Mock).mockResolvedValue(null);
      
      const mockGroupByResults = [
        { _count: { id: 150 }, letter: 'A' },
        { _count: { id: 120 }, letter: 'B' },
        { _count: { id: 100 }, letter: 'C' },
      ];

      (prisma.indexitem.groupBy as jest.Mock).mockResolvedValue(mockGroupByResults);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/search');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.indexitem.groupBy).toHaveBeenCalled();
      expect(kv.set).toHaveBeenCalledWith(
        'search-analytics',
        expect.any(Object),
        { ex: 3600 }
      );
    });

    it('returns search trends over time', async () => {
      const mockSearchData = {
        trends: {
          daily: [
            { date: '2024-01-15', searches: 150 },
            { date: '2024-01-16', searches: 180 },
            { date: '2024-01-17', searches: 200 },
          ],
          weekly: { currentWeek: 1200, previousWeek: 1000, change: '+20%' },
        },
      };

      (kv.get as jest.Mock).mockResolvedValue(mockSearchData);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/search?includeTrends=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.trends).toBeDefined();
      expect(data.trends.weekly.change).toBe('+20%');
    });

    it('filters search analytics by campus', async () => {
      const mockGroupByResults = [
        { _count: { id: 50 }, title: 'Financial Aid' },
        { _count: { id: 40 }, title: 'Library Services' },
      ];

      (kv.get as jest.Mock).mockResolvedValue(null);
      (prisma.indexitem.groupBy as jest.Mock).mockResolvedValue(mockGroupByResults);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/search?campus=College of San Mateo');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(prisma.indexitem.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { campus: 'College of San Mateo' },
        })
      );
    });

    it('returns top searched resources', async () => {
      const mockSearchData = {
        topResources: [
          { id: 1, title: 'Financial Aid Office', searchCount: 500 },
          { id: 2, title: 'Admissions', searchCount: 450 },
          { id: 3, title: 'Library', searchCount: 400 },
        ],
      };

      (kv.get as jest.Mock).mockResolvedValue(mockSearchData);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/search?limit=3');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.topResources).toHaveLength(3);
      expect(data.topResources[0].searchCount).toBe(500);
    });

    it('handles search analytics errors gracefully', async () => {
      (kv.get as jest.Mock).mockResolvedValue(null);
      (prisma.indexitem.groupBy as jest.Mock).mockRejectedValue(new Error('Database query failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/search');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Failed to retrieve search analytics');
    });

    it('returns empty search data gracefully', async () => {
      (kv.get as jest.Mock).mockResolvedValue(null);
      (prisma.indexitem.groupBy as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/search');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('No search data available');
    });

    it('includes search effectiveness metrics', async () => {
      const mockSearchData = {
        effectiveness: {
          avgResultsPerSearch: 12.5,
          zeroResultSearches: 50,
          clickThroughRate: 0.65,
          avgTimeToClick: 3.2,
        },
      };

      (kv.get as jest.Mock).mockResolvedValue(mockSearchData);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/search?includeEffectiveness=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.effectiveness).toBeDefined();
      expect(data.effectiveness.clickThroughRate).toBe(0.65);
    });
  });
});