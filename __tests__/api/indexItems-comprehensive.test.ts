/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/indexItems/route';
import { prisma } from '@/lib/prisma-singleton';

// Mock Prisma
jest.mock('@/lib/prisma-singleton', () => ({
  prisma: {
    indexitem: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock KV for caching
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
  },
}));

// Mock performance monitor
jest.mock('@/lib/performance-monitor', () => ({
  PerformanceMonitor: {
    startRequest: jest.fn(() => ({ 
      end: jest.fn(),
      addMetadata: jest.fn()
    })),
  },
}));

describe('/api/indexItems - Comprehensive API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/indexItems', () => {
    it('should return all items with no filters', async () => {
      const mockItems = [
        { id: 1, title: 'Test 1', campus: 'CSM', letter: 'A', url: 'http://test1.com' },
        { id: 2, title: 'Test 2', campus: 'Skyline', letter: 'B', url: 'http://test2.com' },
      ];

      (prisma.indexitem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const request = new NextRequest('http://localhost:3000/api/indexItems');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockItems);
      expect(prisma.indexitem.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true,
        },
        orderBy: [{ letter: 'asc' }, { title: 'asc' }],
      });
    });

    it('should filter by campus', async () => {
      const mockItems = [
        { id: 1, title: 'CSM Test', campus: 'College of San Mateo', letter: 'A', url: 'http://csm.com' },
      ];

      (prisma.indexitem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const request = new NextRequest('http://localhost:3000/api/indexItems?campus=College of San Mateo');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockItems);
      expect(prisma.indexitem.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true,
        },
        where: { campus: 'College of San Mateo' },
        orderBy: [{ letter: 'asc' }, { title: 'asc' }],
      });
    });

    it('should filter by letter', async () => {
      const mockItems = [
        { id: 1, title: 'Art Department', campus: 'CSM', letter: 'A', url: 'http://art.com' },
      ];

      (prisma.indexitem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const request = new NextRequest('http://localhost:3000/api/indexItems?letter=A');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockItems);
      expect(prisma.indexitem.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true,
        },
        where: { letter: 'A' },
        orderBy: [{ letter: 'asc' }, { title: 'asc' }],
      });
    });

    it('should search by title', async () => {
      const mockItems = [
        { id: 1, title: 'Financial Aid Office', campus: 'CSM', letter: 'F', url: 'http://finaid.com' },
      ];

      (prisma.indexitem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const request = new NextRequest('http://localhost:3000/api/indexItems?search=financial');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockItems);
      expect(prisma.indexitem.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true,
        },
        where: {
          title: {
            contains: 'financial',
            mode: 'insensitive',
          },
        },
        orderBy: [{ letter: 'asc' }, { title: 'asc' }],
      });
    });

    it('should handle multiple filters', async () => {
      const mockItems = [
        { id: 1, title: 'Academic Affairs', campus: 'Skyline College', letter: 'A', url: 'http://academic.com' },
      ];

      (prisma.indexitem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const request = new NextRequest('http://localhost:3000/api/indexItems?campus=Skyline College&letter=A&search=academic');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockItems);
      expect(prisma.indexitem.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true,
        },
        where: {
          campus: 'Skyline College',
          letter: 'A',
          title: {
            contains: 'academic',
            mode: 'insensitive',
          },
        },
        orderBy: [{ letter: 'asc' }, { title: 'asc' }],
      });
    });

    it('should handle database errors gracefully', async () => {
      (prisma.indexitem.findMany as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/indexItems');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Database error occurred' });
    });
  });

  describe('POST /api/indexItems', () => {
    it('should create a new index item', async () => {
      const newItem = {
        title: 'New Resource',
        letter: 'N',
        url: 'https://newresource.edu',
        campus: 'College of San Mateo',
      };

      const createdItem = { id: 123, ...newItem, createdAt: new Date(), updatedAt: new Date() };
      (prisma.indexitem.create as jest.Mock).mockResolvedValue(createdItem);

      const request = new NextRequest('http://localhost:3000/api/indexItems', {
        method: 'POST',
        body: JSON.stringify(newItem),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(createdItem);
      expect(prisma.indexitem.create).toHaveBeenCalledWith({
        data: newItem,
      });
    });

    it('should validate required fields', async () => {
      const invalidItem = {
        title: '',
        letter: '',
        url: '',
        campus: '',
      };

      const request = new NextRequest('http://localhost:3000/api/indexItems', {
        method: 'POST',
        body: JSON.stringify(invalidItem),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('validation');
    });

    it('should validate URL format', async () => {
      const invalidItem = {
        title: 'Test Resource',
        letter: 'T',
        url: 'not-a-url',
        campus: 'College of San Mateo',
      };

      const request = new NextRequest('http://localhost:3000/api/indexItems', {
        method: 'POST',
        body: JSON.stringify(invalidItem),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('should handle database errors on creation', async () => {
      const newItem = {
        title: 'New Resource',
        letter: 'N',
        url: 'https://newresource.edu',
        campus: 'College of San Mateo',
      };

      (prisma.indexitem.create as jest.Mock).mockRejectedValue(new Error('Unique constraint violation'));

      const request = new NextRequest('http://localhost:3000/api/indexItems', {
        method: 'POST',
        body: JSON.stringify(newItem),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });

  describe('DELETE /api/indexItems', () => {
    it('should delete an item by ID', async () => {
      const deletedItem = {
        id: 123,
        title: 'Deleted Item',
        letter: 'D',
        url: 'https://deleted.edu',
        campus: 'Skyline College',
      };

      (prisma.indexitem.delete as jest.Mock).mockResolvedValue(deletedItem);

      const request = new NextRequest('http://localhost:3000/api/indexItems?id=123', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: 'Item deleted successfully', deletedItem });
      expect(prisma.indexitem.delete).toHaveBeenCalledWith({
        where: { id: 123 },
      });
    });

    it('should return 400 for missing ID parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/indexItems', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'ID parameter is required' });
    });

    it('should return 400 for invalid ID parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/indexItems?id=invalid', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid ID parameter' });
    });

    it('should handle item not found', async () => {
      (prisma.indexitem.delete as jest.Mock).mockRejectedValue(new Error('Record to delete does not exist'));

      const request = new NextRequest('http://localhost:3000/api/indexItems?id=999', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Item not found' });
    });
  });

  describe('Rate Limiting & Performance', () => {
    it('should handle rate limiting', async () => {
      // This would need actual rate limiting mock setup
      // For now, we'll test that the performance monitoring is called
      const request = new NextRequest('http://localhost:3000/api/indexItems');
      await GET(request);

      // Verify performance monitoring was initialized
      const { PerformanceMonitor } = require('@/lib/performance-monitor');
      expect(PerformanceMonitor.startRequest).toHaveBeenCalled();
    });
  });

  describe('Content-Type Handling', () => {
    it('should accept JSON content type', async () => {
      const newItem = {
        title: 'JSON Test',
        letter: 'J',
        url: 'https://json.edu',
        campus: 'Cañada College',
      };

      (prisma.indexitem.create as jest.Mock).mockResolvedValue({ id: 1, ...newItem });

      const request = new NextRequest('http://localhost:3000/api/indexItems', {
        method: 'POST',
        body: JSON.stringify(newItem),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/indexItems', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });
});