/**
 * Updated Integration Tests for /api/indexItems
 * Tests the complete API with new validation and security features
 */

import { NextRequest } from 'next/server'

// Mock environment for test
process.env.NODE_ENV = 'test'
process.env.JEST_WORKER_ID = '1'

// Mock Prisma singleton
const mockPrisma = {
  indexitem: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  }
}

jest.mock('@/lib/prisma-singleton', () => ({
  prisma: mockPrisma
}))

// Mock Vercel KV
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn().mockResolvedValue([])
  }
}))

// Mock rate limiting
jest.mock('@upstash/ratelimit', () => {
  const mockRatelimit = jest.fn().mockImplementation(() => ({
    limit: jest.fn().mockResolvedValue({
      success: true,
      limit: 20,
      remaining: 19,
    }),
  }))
  
  mockRatelimit.slidingWindow = jest.fn()
  
  return {
    Ratelimit: mockRatelimit,
  }
})

// Mock performance optimizer
jest.mock('@/lib/performance-optimizations', () => ({
  PerformanceOptimizer: {
    getWithCache: jest.fn((key, fetcher) => fetcher()),
  },
  QueryOptimizer: {
    getIndexItems: jest.fn(),
  },
  PERFORMANCE_TARGETS: {
    API_RESPONSE_TIME: 100,
  },
}))

// Mock performance monitor
jest.mock('@/lib/performance-monitor', () => ({
  PerformanceMonitor: jest.fn().mockImplementation(() => ({
    recordMetrics: jest.fn().mockReturnValue({
      responseTime: 50,
      timestamp: new Date().toISOString(),
    }),
  })),
  timeDbQuery: jest.fn((fn) => fn()),
  timeCacheOperation: jest.fn((fn) => ({ result: fn(), cacheTime: 10 })),
}))

// Import the API handlers after mocks
import { GET, POST, DELETE, PATCH } from '@/app/api/indexItems/route'

// Helper to create NextRequest objects
function createTestRequest(method: string, path: string, body?: any, searchParams?: URLSearchParams) {
  const url = new URL(`http://localhost:3000${path}`)
  if (searchParams) {
    searchParams.forEach((value, key) => url.searchParams.set(key, value))
  }

  const request = {
    method,
    url: url.toString(),
    nextUrl: url,
    headers: new Map([
      ['user-agent', 'jest-test-runner/1.0 Mozilla/5.0'],
      ['content-type', 'application/json'],
      ['x-forwarded-for', '127.0.0.1'],
      ['origin', 'http://localhost:3000'],
    ]),
    json: () => Promise.resolve(body || {}),
  } as NextRequest

  // Mock headers.get method
  request.headers.get = jest.fn((name: string) => {
    const headerMap: Record<string, string> = {
      'user-agent': 'jest-test-runner/1.0 Mozilla/5.0',
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      'origin': 'http://localhost:3000',
    }
    return headerMap[name.toLowerCase()] || null
  })

  return request
}

describe('/api/indexItems', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { kv } = require('@vercel/kv')
    kv.get.mockResolvedValue(null) // Default to cache miss
  })

  describe('GET /api/indexItems', () => {
    const mockItems = [
      {
        id: 1,
        title: 'Test Item 1',
        letter: 'T',
        url: 'https://example.com/1',
        campus: 'College of San Mateo'
      },
      {
        id: 2,
        title: 'Another Item',
        letter: 'A',
        url: 'https://example.com/2',
        campus: 'Skyline College'
      }
    ]

    it('should return all items successfully', async () => {
      const { QueryOptimizer } = require('@/lib/performance-optimizations')
      QueryOptimizer.getIndexItems.mockResolvedValue(mockItems)

      const request = createTestRequest('GET', '/api/indexItems')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockItems)
      expect(QueryOptimizer.getIndexItems).toHaveBeenCalledWith({
        campus: undefined,
        letter: undefined,
        search: undefined,
      })
    })

    it('should filter by campus', async () => {
      const { QueryOptimizer } = require('@/lib/performance-optimizations')
      const filteredItems = [mockItems[0]]
      QueryOptimizer.getIndexItems.mockResolvedValue(filteredItems)

      const searchParams = new URLSearchParams({ campus: 'CSM' })
      const request = createTestRequest('GET', '/api/indexItems', undefined, searchParams)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(filteredItems)
      expect(QueryOptimizer.getIndexItems).toHaveBeenCalledWith({
        campus: 'College of San Mateo', // Should be normalized
        letter: undefined,
        search: undefined,
      })
    })

    it('should filter by letter', async () => {
      const { QueryOptimizer } = require('@/lib/performance-optimizations')
      const filteredItems = [mockItems[1]]
      QueryOptimizer.getIndexItems.mockResolvedValue(filteredItems)

      const searchParams = new URLSearchParams({ letter: 'a' })
      const request = createTestRequest('GET', '/api/indexItems', undefined, searchParams)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(filteredItems)
      expect(QueryOptimizer.getIndexItems).toHaveBeenCalledWith({
        campus: undefined,
        letter: 'A', // Should be normalized to uppercase
        search: undefined,
      })
    })

    it('should return cached data when available', async () => {
      const { kv } = require('@vercel/kv')
      kv.get.mockResolvedValue(mockItems)

      const request = createTestRequest('GET', '/api/indexItems')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockItems)
      expect(kv.get).toHaveBeenCalled()
    })

    it('should block invalid user agents', async () => {
      const request = createTestRequest('GET', '/api/indexItems')
      request.headers.get = jest.fn((name) => 
        name.toLowerCase() === 'user-agent' ? 'bot/scraper' : null
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Invalid User-Agent')
    })

    it('should validate search parameter length', async () => {
      const longSearch = 'a'.repeat(101) // Over 100 chars
      const searchParams = new URLSearchParams({ search: longSearch })
      const request = createTestRequest('GET', '/api/indexItems', undefined, searchParams)
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })
  })

  describe('POST /api/indexItems', () => {
    it('should create a new item successfully', async () => {
      const newItem = {
        title: 'New Test Item',
        letter: 'N',
        url: 'https://example.com/new',
        campus: 'College of San Mateo'
      }

      const createdItem = { id: 3, ...newItem }
      mockPrisma.indexitem.create.mockResolvedValue(createdItem)

      const request = createTestRequest('POST', '/api/indexItems', newItem)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(createdItem)
      expect(mockPrisma.indexitem.create).toHaveBeenCalledWith({
        data: newItem,
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true,
        },
      })
    })

    it('should validate required fields', async () => {
      const invalidItem = {
        title: 'Test Item',
        // Missing required fields
      }

      const request = createTestRequest('POST', '/api/indexItems', invalidItem)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('letter: Required')
    })

    it('should validate URL format', async () => {
      const invalidItem = {
        title: 'Test Item',
        letter: 'T',
        url: 'not-a-valid-url',
        campus: 'College of San Mateo'
      }

      const request = createTestRequest('POST', '/api/indexItems', invalidItem)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('url: Invalid URL format')
    })

    it('should validate campus enum', async () => {
      const invalidItem = {
        title: 'Test Item',
        letter: 'T',
        url: 'https://example.com',
        campus: 'Invalid Campus'
      }

      const request = createTestRequest('POST', '/api/indexItems', invalidItem)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('campus: Campus must be one of:')
    })
  })

  describe('DELETE /api/indexItems', () => {
    it('should delete an item successfully', async () => {
      const deletedItem = {
        id: 1,
        title: 'Deleted Item',
        letter: 'D',
        url: 'https://example.com/deleted',
        campus: 'College of San Mateo'
      }

      mockPrisma.indexitem.delete.mockResolvedValue(deletedItem)

      const searchParams = new URLSearchParams({ id: '1' })
      const request = createTestRequest('DELETE', '/api/indexItems', undefined, searchParams)
      const response = await DELETE(request)

      expect(response.status).toBe(204)
      expect(mockPrisma.indexitem.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      })
    })

    it('should require ID parameter', async () => {
      const request = createTestRequest('DELETE', '/api/indexItems')
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ID parameter is required')
    })

    it('should validate ID format', async () => {
      const searchParams = new URLSearchParams({ id: 'invalid' })
      const request = createTestRequest('DELETE', '/api/indexItems', undefined, searchParams)
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ID must be a positive number')
    })
  })

  describe('PATCH /api/indexItems', () => {
    it('should update an item successfully', async () => {
      const existingItem = {
        id: 1,
        title: 'Original Title',
        letter: 'O',
        url: 'https://example.com/original',
        campus: 'College of San Mateo'
      }

      const updateData = {
        title: 'Updated Title'
      }

      const updatedItem = { ...existingItem, ...updateData }

      mockPrisma.indexitem.findUnique.mockResolvedValue(existingItem)
      mockPrisma.indexitem.update.mockResolvedValue(updatedItem)

      const searchParams = new URLSearchParams({ id: '1' })
      const request = createTestRequest('PATCH', '/api/indexItems', updateData, searchParams)
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedItem)
      expect(mockPrisma.indexitem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true,
        },
      })
    })

    it('should validate partial update data', async () => {
      const searchParams = new URLSearchParams({ id: '1' })
      const request = createTestRequest('PATCH', '/api/indexItems', {}, searchParams)
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('At least one field must be provided for update')
    })
  })

  describe('Security and Validation', () => {
    it('should include proper CORS headers', async () => {
      const { QueryOptimizer } = require('@/lib/performance-optimizations')
      QueryOptimizer.getIndexItems.mockResolvedValue([])

      const request = createTestRequest('GET', '/api/indexItems')
      const response = await GET(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    })

    it('should include performance headers', async () => {
      const { QueryOptimizer } = require('@/lib/performance-optimizations')
      QueryOptimizer.getIndexItems.mockResolvedValue([])

      const request = createTestRequest('GET', '/api/indexItems')
      const response = await GET(request)

      expect(response.headers.get('X-Response-Time')).toMatch(/\d+ms/)
      expect(response.headers.get('X-Cache')).toBe('MISS')
    })
  })
})