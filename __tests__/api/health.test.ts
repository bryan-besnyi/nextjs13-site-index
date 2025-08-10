/**
 * @jest-environment node
 */

import { createMocks } from 'node-mocks-http'
import { GET, HEAD } from '@/app/api/health/route'
import { prisma } from '@/lib/prisma-singleton'

// Mock Prisma
jest.mock('@/lib/prisma-singleton', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    indexitem: {
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

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockKv = require('@vercel/kv').kv

// Mock fetch for internal API calls
global.fetch = jest.fn()

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
      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/health',
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/health+json')
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      
      expect(data.status).toBe('pass')
      expect(data.serviceId).toBe('smcccd-site-index')
      expect(data.version).toBeDefined()
      expect(data.checks).toBeDefined()
      
      // Check database health
      expect(data.checks.database).toBeDefined()
      expect(data.checks.database[0].status).toBe('pass')
      expect(data.checks.database[0].observedValue).toBe(1524)
      expect(data.checks.database[0].componentType).toBe('datastore')
      
      // Check cache health
      expect(data.checks.cache).toBeDefined()
      expect(data.checks.cache[0].status).toBe('pass')
      expect(data.checks.cache[0].componentType).toBe('component')
      
      // Check API health
      expect(data.checks.api).toBeDefined()
      expect(data.checks.api[0].status).toBe('pass')
      expect(data.checks.api[0].observedValue).toBe(200)
      
      // Check system health
      expect(data.checks.system).toBeDefined()
      expect(data.checks.system[0].componentType).toBe('system')
    })

    it('should return warning status when record count is low', async () => {
      // Mock count to return less than 1000 records
      mockPrisma.indexitem.count.mockResolvedValue(500)
      
      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/health',
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200) // Warnings still return 2xx
      expect(data.status).toBe('warn')
      expect(data.checks.database[0].status).toBe('pass') // Database check itself passes
      expect(data.notes).toContain('Record count is below expected threshold')
    })

    it('should return warning status when no records exist', async () => {
      mockPrisma.indexitem.count.mockResolvedValue(0)

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/health',
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('warn')
      expect(data.checks.database[0].status).toBe('warn')
      expect(data.notes).toContain('Database is accessible but contains no records')
    })

    it('should return fail status when database is unreachable', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'))
      mockPrisma.indexitem.count.mockRejectedValue(new Error('Connection refused'))

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/health',
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(503) // Service Unavailable for failures
      expect(data.status).toBe('fail')
      expect(data.checks.database[0].status).toBe('fail')
      expect(data.checks.database[0].output).toContain('Database connection failed')
      expect(data.notes).toContain('Database connectivity failed')
    })

    it('should handle cache failures gracefully', async () => {
      mockKv.set.mockRejectedValue(new Error('Redis connection failed'))
      mockKv.get.mockRejectedValue(new Error('Redis connection failed'))
      mockKv.del.mockRejectedValue(new Error('Redis connection failed'))

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/health',
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200) // Cache failure is not critical
      expect(data.status).toBe('warn')
      expect(data.checks.cache[0].status).toBe('warn')
      expect(data.checks.cache[0].output).toContain('Cache unavailable')
      expect(data.notes).toContain('Cache service unavailable - API will work with degraded performance')
    })

    it('should return fail status when API endpoint fails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      })

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/health',
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('fail')
      expect(data.checks.api[0].status).toBe('fail')
      expect(data.checks.api[0].observedValue).toBe(500)
      expect(data.notes).toContain('Main API endpoint is not responding correctly')
    })

    it('should include performance metrics', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/health',
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.headers.get('X-Response-Time')).toMatch(/\d+ms/)
      expect(response.headers.get('X-Health-Check-Time')).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/)
      expect(data.output).toMatch(/Health check completed in \d+ms/)
    })

    it('should include proper RFC-compliant structure', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/health',
      })

      const response = await GET(req)
      const data = await response.json()

      // Required fields according to RFC
      expect(data.status).toBeDefined()
      
      // Optional fields
      expect(data.version).toBeDefined()
      expect(data.releaseId).toBeDefined()
      expect(data.serviceId).toBeDefined()
      expect(data.description).toBeDefined()
      expect(data.checks).toBeDefined()
      expect(data.links).toBeDefined()
      expect(data.output).toBeDefined()

      // Check structure of individual checks
      Object.values(data.checks).forEach((checkArray: any) => {
        checkArray.forEach((check: any) => {
          expect(check.componentId).toBeDefined()
          expect(check.componentType).toBeDefined()
          expect(check.status).toBeDefined()
          expect(['pass', 'fail', 'warn']).toContain(check.status)
          expect(check.time).toBeDefined()
          expect(check.output).toBeDefined()
        })
      })
    })

    it('should handle catastrophic failures gracefully', async () => {
      // Mock everything to fail
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database down'))
      mockKv.set.mockRejectedValue(new Error('Cache down'))
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/health',
      })

      const response = await GET(req)

      expect(response.status).toBe(503)
      expect(response.headers.get('Content-Type')).toBe('application/health+json')
    })
  })

  describe('HEAD /api/health', () => {
    it('should return 200 for successful lightweight check', async () => {
      const { req } = createMocks({
        method: 'HEAD',
        url: 'http://localhost:3000/api/health',
      })

      const response = await HEAD(req)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/health+json')
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      
      // HEAD request should not have body
      const text = await response.text()
      expect(text).toBe('')
    })

    it('should return 503 when database fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database down'))

      const { req } = createMocks({
        method: 'HEAD',
        url: 'http://localhost:3000/api/health',
      })

      const response = await HEAD(req)

      expect(response.status).toBe(503)
      expect(response.headers.get('Content-Type')).toBe('application/health+json')
    })
  })
})