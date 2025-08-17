/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from '@/app/api/indexItems/route'
import { prisma } from '@/lib/prisma-singleton'

// Helper function to create NextRequest-like objects for testing
function createMockRequest(method: string, url: string, body?: any) {
  const request = {
    method,
    url: `http://localhost:3000${url}`,
    headers: new Map([
      ['user-agent', 'jest-test-runner'],
      ['content-type', 'application/json']
    ]),
    nextUrl: new URL(`http://localhost:3000${url}`),
    json: () => Promise.resolve(body || {}),
  } as NextRequest

  // Mock headers.get method
  request.headers.get = jest.fn((name: string) => {
    const headerMap: Record<string, string> = {
      'user-agent': 'jest-test-runner',
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      'origin': 'http://localhost:3000'
    }
    return headerMap[name.toLowerCase()] || null
  })

  return request
}

// Mock Prisma
jest.mock('@/lib/prisma-singleton', () => ({
  prisma: {
    indexitem: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}))

// Mock Vercel KV
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
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
  
  // Add static method
  mockRatelimit.slidingWindow = jest.fn()
  
  return {
    Ratelimit: mockRatelimit,
  }
})

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockKv = require('@vercel/kv').kv

describe('/api/indexItems', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockKv.get.mockResolvedValue(null) // Default to cache miss
  })

  describe('GET /api/indexItems', () => {
    const mockIndexItems = [
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

    it('should return all items when no filters provided', async () => {
      mockPrisma.indexitem.findMany.mockResolvedValue(mockIndexItems)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/indexItems',
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible test browser)',
        }
      })

      // Add Next.js request properties
      req.nextUrl = new URL('http://localhost:3000/api/indexItems')

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockIndexItems)
      expect(mockPrisma.indexitem.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ title: 'asc' }],
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true
        }
      })
    })

    it('should filter by campus', async () => {
      const filteredItems = [mockIndexItems[0]]
      mockPrisma.indexitem.findMany.mockResolvedValue(filteredItems)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/indexItems?campus=College of San Mateo',
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible test browser)',
        }
      })

      // Add Next.js request properties
      req.nextUrl = new URL('http://localhost:3000/api/indexItems?campus=College of San Mateo')

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(filteredItems)
      expect(mockPrisma.indexitem.findMany).toHaveBeenCalledWith({
        where: { campus: 'College of San Mateo' },
        orderBy: [{ title: 'asc' }],
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true
        }
      })
    })

    it('should handle campus code mapping', async () => {
      mockPrisma.indexitem.findMany.mockResolvedValue([mockIndexItems[0]])

      const { req } = createMocks({
        method: 'GET',
        url: '/api/indexItems?campus=CSM',
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible test browser)',
        }
      })

      const response = await GET(req)
      
      expect(response.status).toBe(200)
      expect(mockPrisma.indexitem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { campus: 'College of San Mateo' }
        })
      )
    })

    it('should filter by letter', async () => {
      const filteredItems = [mockIndexItems[0]]
      mockPrisma.indexitem.findMany.mockResolvedValue(filteredItems)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/indexItems?letter=T',
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible test browser)',
        }
      })

      const response = await GET(req)

      expect(response.status).toBe(200)
      expect(mockPrisma.indexitem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { letter: { contains: 'T', mode: 'insensitive' } }
        })
      )
    })

    it('should filter by search query', async () => {
      mockPrisma.indexitem.findMany.mockResolvedValue([mockIndexItems[0]])

      const { req } = createMocks({
        method: 'GET',
        url: '/api/indexItems?search=test',
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible test browser)',
        }
      })

      const response = await GET(req)

      expect(response.status).toBe(200)
      expect(mockPrisma.indexitem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { contains: 'test', mode: 'insensitive' } },
              { url: { contains: 'test', mode: 'insensitive' } }
            ]
          }
        })
      )
    })

    it('should return cached data when available', async () => {
      mockKv.get.mockResolvedValue(mockIndexItems)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/indexItems',
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible test browser)',
        }
      })

      // Add Next.js request properties
      req.nextUrl = new URL('http://localhost:3000/api/indexItems')

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockIndexItems)
      expect(response.headers.get('X-Cache')).toBe('HIT')
      expect(mockPrisma.indexitem.findMany).not.toHaveBeenCalled()
    })

    it('should block invalid user agents', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/indexItems',
        headers: {
          'user-agent': 'bot/crawler',
        }
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Invalid User-Agent')
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.indexitem.findMany.mockRejectedValue(new Error('Database error'))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/indexItems',
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible test browser)',
        }
      })

      // Add Next.js request properties
      req.nextUrl = new URL('http://localhost:3000/api/indexItems')

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should include performance headers', async () => {
      mockPrisma.indexitem.findMany.mockResolvedValue(mockIndexItems)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/indexItems',
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible test browser)',
        }
      })

      // Add Next.js request properties
      req.nextUrl = new URL('http://localhost:3000/api/indexItems')

      const response = await GET(req)

      expect(response.headers.get('X-Response-Time')).toMatch(/\d+ms/)
      expect(response.headers.get('X-Results-Count')).toBe('2')
      expect(response.headers.get('X-Cache')).toBe('MISS')
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })
  })

  describe('POST /api/indexItems', () => {
    const newItem = {
      id: 3,
      title: 'New Test Item',
      letter: 'N',
      url: 'https://example.com/3',
      campus: 'Cañada College'
    }

    it('should create a new item', async () => {
      mockPrisma.indexitem.create.mockResolvedValue(newItem)

      const { req } = createMocks({
        method: 'POST',
        url: '/api/indexItems',
        body: {
          title: 'New Test Item',
          letter: 'N',
          url: 'https://example.com/3',
          campus: 'Cañada College'
        }
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(newItem)
      expect(mockPrisma.indexitem.create).toHaveBeenCalledWith({
        data: {
          title: 'New Test Item',
          letter: 'N',
          url: 'https://example.com/3',
          campus: 'Cañada College'
        },
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true
        }
      })
    })

    it('should validate required fields', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/indexItems',
        body: {
          title: 'New Test Item',
          // Missing required fields
        }
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields: title, letter, url, campus')
    })

    it('should handle database creation errors', async () => {
      mockPrisma.indexitem.create.mockRejectedValue(new Error('Unique constraint failed'))

      const { req } = createMocks({
        method: 'POST',
        url: '/api/indexItems',
        body: {
          title: 'New Test Item',
          letter: 'N',
          url: 'https://example.com/3',
          campus: 'Cañada College'
        }
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Error creating item')
    })
  })

  describe('DELETE /api/indexItems', () => {
    const itemToDelete = {
      id: 1,
      title: 'Item to Delete',
      letter: 'I',
      url: 'https://example.com/delete',
      campus: 'District Office'
    }

    it('should delete an item', async () => {
      mockPrisma.indexitem.delete.mockResolvedValue(itemToDelete)

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/indexItems?id=1',
      })

      const response = await DELETE(req)

      expect(response.status).toBe(204)
      expect(mockPrisma.indexitem.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      })
    })

    it('should require ID parameter', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/indexItems',
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ID required')
    })

    it('should handle deletion errors', async () => {
      mockPrisma.indexitem.delete.mockRejectedValue(new Error('Record not found'))

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/indexItems?id=999',
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Error deleting item')
    })
  })
})