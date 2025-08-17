/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock Prisma before importing the route
jest.mock('@/lib/prisma-singleton', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    indexitem: {
      count: jest.fn(),
    },
  }
}))

import { GET, HEAD } from '@/app/api/health/route'
import { prisma } from '@/lib/prisma-singleton'
import { kv } from '@vercel/kv'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockKv = kv as jest.Mocked<typeof kv>

// Mock Vercel KV before importing
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }
}))

// Mock fetch for internal API calls
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default successful mocks
    mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }])
    mockPrisma.indexitem.count.mockResolvedValue(1524)
    mockKv.set.mockResolvedValue('OK')
    mockKv.get.mockResolvedValue('test')
    mockKv.del.mockResolvedValue(1)
    
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    })
  })

  describe('GET /api/health', () => {
    it('should return healthy status when all checks pass', async () => {
      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      
      console.log('Response:', response)
      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      
      const data = await response.json()
      console.log('Response data:', data)

      expect(response.status).toBe(200)
      expect(data.status).toBe('pass')
      expect(data.serviceId).toBe('smcccd-site-index')
      expect(data.version).toBeDefined()
      expect(data.checks).toBeDefined()
      
      // Check database health
      expect(data.checks.database).toBeDefined()
      expect(data.checks.database[0].status).toBe('pass')
      expect(data.checks.database[0].observedValue).toBe(1524)
      expect(data.checks.database[0].componentType).toBe('datastore')
    })

    it('should return warning status when record count is low', async () => {
      // Mock count to return less than 1000 records
      mockPrisma.indexitem.count.mockResolvedValue(500)
      
      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200) // Warnings still return 2xx
      expect(data.status).toBe('warn')
      expect(data.checks.database[0].status).toBe('pass') // Database check itself passes
      expect(data.notes).toContain('Record count is below expected threshold')
    })

    it('should return warning status when no records exist', async () => {
      mockPrisma.indexitem.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('warn')
      expect(data.checks.database[0].status).toBe('warn')
      expect(data.notes).toContain('Database is accessible but contains no records')
    })

    it('should return fail status when database is unreachable', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'))
      mockPrisma.indexitem.count.mockRejectedValue(new Error('Connection refused'))

      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503) // Service Unavailable for failures
      expect(data.status).toBe('fail')
      expect(data.checks.database[0].status).toBe('fail')
      expect(data.checks.database[0].output).toContain('Database connection failed')
      expect(data.notes).toContain('Database connectivity failed')
    })
  })

  describe('HEAD /api/health', () => {
    it('should return 200 for successful lightweight check', async () => {
      const request = new NextRequest('http://localhost:3000/api/health', { method: 'HEAD' })
      const response = await HEAD(request)

      expect(response.status).toBe(200)
      
      // HEAD request should not have body
      const text = await response.text()
      expect(text).toBe('')
    })

    it('should return 503 when database fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database down'))

      const request = new NextRequest('http://localhost:3000/api/health', { method: 'HEAD' })
      const response = await HEAD(request)

      expect(response.status).toBe(503)
    })
  })
})