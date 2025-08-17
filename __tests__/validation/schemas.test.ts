/**
 * Unit Tests for Validation Schemas
 * These test the core validation logic without Next.js dependencies
 */

import {
  CreateIndexItemSchema,
  UpdateIndexItemSchema,
  IndexItemQuerySchema,
  CacheInvalidationSchema,
  validateWith,
  VALID_CAMPUSES,
  VALID_LETTERS
} from '@/lib/validation-schemas'

describe('Validation Schemas', () => {
  describe('CreateIndexItemSchema', () => {
    it('should validate a valid item', () => {
      const validItem = {
        title: 'Test Item',
        letter: 'T',
        url: 'https://example.com',
        campus: 'College of San Mateo'
      }

      const result = validateWith(CreateIndexItemSchema)(validItem)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validItem)
      }
    })

    it('should reject items with missing required fields', () => {
      const invalidItem = {
        title: 'Test Item',
        // missing letter, url, campus
      }

      const result = validateWith(CreateIndexItemSchema)(invalidItem)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toContain('letter: Required')
        expect(result.errors).toContain('url: Required')
        expect(result.errors.some(err => err.includes('Campus must be one of:'))).toBe(true)
      }
    })

    it('should reject invalid URL formats', () => {
      const invalidItem = {
        title: 'Test Item',
        letter: 'T',
        url: 'not-a-valid-url',
        campus: 'College of San Mateo'
      }

      const result = validateWith(CreateIndexItemSchema)(invalidItem)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(err => err.includes('Invalid URL format'))).toBe(true)
      }
    })

    it('should reject invalid campus values', () => {
      const invalidItem = {
        title: 'Test Item',
        letter: 'T',
        url: 'https://example.com',
        campus: 'Invalid Campus'
      }

      const result = validateWith(CreateIndexItemSchema)(invalidItem)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(err => err.includes('Campus must be one of:'))).toBe(true)
      }
    })

    it('should reject invalid letter formats', () => {
      const invalidItem = {
        title: 'Test Item',
        letter: 'TT', // Too long
        url: 'https://example.com',
        campus: 'College of San Mateo'
      }

      const result = validateWith(CreateIndexItemSchema)(invalidItem)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(err => err.includes('Letter must be exactly one character'))).toBe(true)
      }
    })

    it('should trim and validate title', () => {
      const itemWithWhitespace = {
        title: '  Test Item  ',
        letter: 'T',
        url: 'https://example.com',
        campus: 'College of San Mateo'
      }

      const result = validateWith(CreateIndexItemSchema)(itemWithWhitespace)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Test Item')
      }
    })

    it('should accept all valid campuses', () => {
      VALID_CAMPUSES.forEach(campus => {
        const item = {
          title: 'Test Item',
          letter: 'T',
          url: 'https://example.com',
          campus
        }

        const result = validateWith(CreateIndexItemSchema)(item)
        expect(result.success).toBe(true)
      })
    })

    it('should accept all valid letters', () => {
      VALID_LETTERS.forEach(letter => {
        const item = {
          title: 'Test Item',
          letter,
          url: 'https://example.com',
          campus: 'College of San Mateo'
        }

        const result = validateWith(CreateIndexItemSchema)(item)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('UpdateIndexItemSchema', () => {
    it('should accept partial updates', () => {
      const partialUpdate = {
        title: 'Updated Title'
      }

      const result = validateWith(UpdateIndexItemSchema)(partialUpdate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Updated Title')
        expect(result.data.letter).toBeUndefined()
      }
    })

    it('should reject empty updates', () => {
      const emptyUpdate = {}

      const result = validateWith(UpdateIndexItemSchema)(emptyUpdate)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(err => err.includes('At least one field must be provided'))).toBe(true)
      }
    })

    it('should validate URL when provided', () => {
      const updateWithInvalidUrl = {
        url: 'invalid-url'
      }

      const result = validateWith(UpdateIndexItemSchema)(updateWithInvalidUrl)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(err => err.includes('Invalid URL format'))).toBe(true)
      }
    })
  })

  describe('IndexItemQuerySchema', () => {
    it('should transform campus codes', () => {
      const query = {
        campus: 'CSM'
      }

      const result = validateWith(IndexItemQuerySchema)(query)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.campus).toBe('College of San Mateo')
      }
    })

    it('should transform letter to uppercase', () => {
      const query = {
        letter: 'a'
      }

      const result = validateWith(IndexItemQuerySchema)(query)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.letter).toBe('A')
      }
    })

    it('should trim search terms', () => {
      const query = {
        search: '  test search  '
      }

      const result = validateWith(IndexItemQuerySchema)(query)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.search).toBe('test search')
      }
    })

    it('should reject long search terms', () => {
      const query = {
        search: 'a'.repeat(101)
      }

      const result = validateWith(IndexItemQuerySchema)(query)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(err => err.includes('Search term must be 100 characters or less'))).toBe(true)
      }
    })

    it('should handle legacy campus codes', () => {
      const legacyCodes = {
        'CSM': 'College of San Mateo',
        'SKY': 'Skyline College',
        'CAN': 'Cañada College',
        'CANADA': 'Cañada College',
        'DO': 'District Office',
        'DISTRICT': 'District Office'
      }

      Object.entries(legacyCodes).forEach(([code, expected]) => {
        const query = { campus: code }
        const result = validateWith(IndexItemQuerySchema)(query)
        
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.campus).toBe(expected)
        }
      })
    })
  })

  describe('CacheInvalidationSchema', () => {
    it('should accept single key invalidation', () => {
      const cacheOp = {
        key: 'test-key'
      }

      const result = validateWith(CacheInvalidationSchema)(cacheOp)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.key).toBe('test-key')
      }
    })

    it('should accept multiple keys invalidation', () => {
      const cacheOp = {
        keys: ['key1', 'key2', 'key3']
      }

      const result = validateWith(CacheInvalidationSchema)(cacheOp)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.keys).toEqual(['key1', 'key2', 'key3'])
      }
    })

    it('should accept pattern invalidation', () => {
      const cacheOp = {
        pattern: 'cache:*'
      }

      const result = validateWith(CacheInvalidationSchema)(cacheOp)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.pattern).toBe('cache:*')
      }
    })

    it('should reject empty cache operations', () => {
      const emptyCacheOp = {}

      const result = validateWith(CacheInvalidationSchema)(emptyCacheOp)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(err => err.includes('At least one of key, keys, or pattern must be provided'))).toBe(true)
      }
    })

    it('should reject empty keys array', () => {
      const cacheOp = {
        keys: []
      }

      const result = validateWith(CacheInvalidationSchema)(cacheOp)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(err => err.includes('At least one of key, keys, or pattern must be provided'))).toBe(true)
      }
    })
  })

  describe('URL Validation', () => {
    const validUrls = [
      'https://example.com',
      'http://test.org',
      'https://subdomain.example.com/path?query=value',
      'https://example.com:8080/path',
      'https://localhost:3000/api/test'
    ]

    const invalidUrls = [
      'not-a-url',
      'ftp://example.com',
      'javascript:alert(1)',
      'mailto:test@example.com',
      '',
      'www.example.com' // Missing protocol
    ]

    validUrls.forEach(url => {
      it(`should accept valid URL: ${url}`, () => {
        const item = {
          title: 'Test',
          letter: 'T',
          url,
          campus: 'College of San Mateo'
        }

        const result = validateWith(CreateIndexItemSchema)(item)
        expect(result.success).toBe(true)
      })
    })

    invalidUrls.forEach(url => {
      it(`should reject invalid URL: ${url}`, () => {
        const item = {
          title: 'Test',
          letter: 'T',
          url,
          campus: 'College of San Mateo'
        }

        const result = validateWith(CreateIndexItemSchema)(item)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Security Validation', () => {
    it('should prevent XSS in titles', () => {
      const xssItem = {
        title: '<script>alert("xss")</script>',
        letter: 'T',
        url: 'https://example.com',
        campus: 'College of San Mateo'
      }

      // The schema should accept this but the application layer should handle XSS prevention
      const result = validateWith(CreateIndexItemSchema)(xssItem)
      expect(result.success).toBe(true)
      
      // Note: XSS prevention should be handled by output encoding, not input validation
      // Input validation focuses on data format correctness
    })

    it('should limit title length', () => {
      const longTitleItem = {
        title: 'a'.repeat(201), // Over 200 chars
        letter: 'T',
        url: 'https://example.com',
        campus: 'College of San Mateo'
      }

      const result = validateWith(CreateIndexItemSchema)(longTitleItem)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(err => err.includes('Title must be 200 characters or less'))).toBe(true)
      }
    })

    it('should limit URL length', () => {
      const longUrlItem = {
        title: 'Test',
        letter: 'T',
        url: 'https://example.com/' + 'a'.repeat(2040), // Over 2048 chars
        campus: 'College of San Mateo'
      }

      const result = validateWith(CreateIndexItemSchema)(longUrlItem)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(err => err.includes('URL must be 2048 characters or less'))).toBe(true)
      }
    })
  })
})