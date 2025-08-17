/**
 * Comprehensive Input Validation Schemas with Zod
 * 
 * This module provides validation schemas for all API endpoints to ensure
 * data integrity and security.
 */

import { z } from 'zod';

// Common validation patterns - more permissive URL pattern
const urlPattern = /^https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.?[-a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=/]*)$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Campus validation - exact values only
const VALID_CAMPUSES = [
  'College of San Mateo',
  'Skyline College', 
  'Cañada College',
  'District Office'
] as const;

// Letter validation - single alphabetic character
const VALID_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// IndexItem validation schemas
export const CreateIndexItemSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim()
    .refine(val => val.length > 0, 'Title cannot be empty after trimming'),
  
  letter: z.string()
    .length(1, 'Letter must be exactly one character')
    .regex(/^[A-Z]$/, 'Letter must be a single uppercase letter A-Z')
    .refine(val => VALID_LETTERS.includes(val), 'Invalid letter provided'),
  
  url: z.string()
    .min(1, 'URL is required')
    .max(2048, 'URL must be 2048 characters or less')
    .refine(val => {
      try {
        const urlObj = new URL(val);
        return ['http:', 'https:'].includes(urlObj.protocol);
      } catch {
        return false;
      }
    }, 'Invalid URL format'),
  
  campus: z.enum(VALID_CAMPUSES, {
    errorMap: () => ({ message: `Campus must be one of: ${VALID_CAMPUSES.join(', ')}` })
  })
});

export const UpdateIndexItemSchema = CreateIndexItemSchema.partial().refine(
  data => Object.keys(data).length > 0,
  'At least one field must be provided for update'
);

// Query parameter validation schemas
export const IndexItemQuerySchema = z.object({
  campus: z.string()
    .optional()
    .transform(val => {
      if (!val) return undefined;
      // Handle legacy campus codes
      const campusMap: Record<string, string> = {
        'CSM': 'College of San Mateo',
        'SKY': 'Skyline College', 
        'CAN': 'Cañada College',
        'CANADA': 'Cañada College',
        'DO': 'District Office',
        'DISTRICT': 'District Office'
      };
      return campusMap[val.toUpperCase()] || val;
    })
    .refine(val => !val || VALID_CAMPUSES.includes(val as any), 
      `Campus must be one of: ${VALID_CAMPUSES.join(', ')}`),
  
  letter: z.string()
    .optional()
    .transform(val => val?.toUpperCase())
    .refine(val => !val || VALID_LETTERS.includes(val), 
      'Letter must be A-Z'),
  
  search: z.string()
    .optional()
    .transform(val => val?.trim())
    .refine(val => !val || val.length <= 100, 
      'Search term must be 100 characters or less')
});

// ID validation for query parameters
export const IdQuerySchema = z.object({
  id: z.string()
    .regex(/^\d+$/, 'ID must be a valid number')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'ID must be a positive number')
});

// ID validation for path parameters
export const IdParamSchema = z.object({
  id: z.number()
    .int()
    .positive('ID must be a positive number')
});

// Cache validation schemas
export const CacheInvalidationSchema = z.object({
  key: z.string().min(1).optional(),
  keys: z.array(z.string().min(1)).min(1, 'Keys array must not be empty').optional(),
  pattern: z.string().min(1).optional()
}).refine(
  data => !!(data.key || (data.keys && data.keys.length > 0) || data.pattern),
  'At least one of key, keys, or pattern must be provided'
);

// Analytics validation schemas
export const AnalyticsQuerySchema = z.object({
  range: z.enum(['week', 'month', 'year'], {
    errorMap: () => ({ message: 'Range must be one of: week, month, year' })
  }).default('month'),
  
  startDate: z.string()
    .datetime()
    .optional()
    .transform(val => val ? new Date(val) : undefined),
  
  endDate: z.string()
    .datetime()
    .optional()
    .transform(val => val ? new Date(val) : undefined)
}).refine(
  data => !data.startDate || !data.endDate || data.startDate <= data.endDate,
  'Start date must be before or equal to end date'
);

// Click tracking validation
export const ClickTrackingSchema = z.object({
  itemId: z.number()
    .int()
    .positive('Item ID must be a positive integer'),
  
  url: z.string()
    .min(1, 'URL is required')
    .regex(urlPattern, 'Invalid URL format'),
  
  referrer: z.string()
    .optional()
    .refine(val => !val || urlPattern.test(val), 'Invalid referrer URL format'),
  
  userAgent: z.string()
    .min(1, 'User agent is required')
    .max(500, 'User agent too long'),
  
  timestamp: z.string()
    .datetime()
    .optional()
    .transform(val => val ? new Date(val) : new Date())
});

// Backup validation schemas
export const BackupQuerySchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .regex(/^[a-zA-Z0-9._-]+\.json$/, 'Filename must be a valid JSON file')
    .refine(val => val.length <= 255, 'Filename too long')
});

// Link checking validation
export const LinkCheckSchema = z.object({
  url: z.string()
    .min(1, 'URL is required')
    .regex(urlPattern, 'Invalid URL format'),
  
  timeout: z.number()
    .int()
    .min(1000, 'Timeout must be at least 1000ms')
    .max(30000, 'Timeout must be at most 30000ms')
    .default(10000),
  
  followRedirects: z.boolean().default(true)
});

// Performance metrics validation
export const PerformanceMetricsSchema = z.object({
  endpoint: z.string().min(1, 'Endpoint is required'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  responseTime: z.number().min(0, 'Response time must be non-negative'),
  statusCode: z.number().int().min(100).max(599, 'Invalid HTTP status code'),
  cacheHit: z.boolean(),
  dbQueryTime: z.number().min(0).optional(),
  resultCount: z.number().int().min(0).optional(),
  timestamp: z.string().datetime().transform(val => new Date(val))
});

// User Agent validation (for bot detection)
export const UserAgentSchema = z.string()
  .min(5, 'User agent too short')
  .max(500, 'User agent too long')
  .refine(ua => {
    const lower = ua.toLowerCase();
    const blockedPatterns = ['bot/', 'crawler/', 'scrapy', 'spider'];
    return !blockedPatterns.some(pattern => lower.includes(pattern)) ||
           lower.includes('fetch') || lower.includes('mozilla');
  }, 'Invalid or blocked user agent');

// System settings validation
export const SystemSettingsSchema = z.object({
  maxCacheSize: z.number()
    .int()
    .min(1000000, 'Cache size must be at least 1MB')
    .max(1000000000, 'Cache size must be at most 1GB')
    .optional(),
  
  rateLimitWindow: z.number()
    .int()
    .min(60, 'Rate limit window must be at least 60 seconds')
    .max(3600, 'Rate limit window must be at most 1 hour')
    .optional(),
  
  rateLimitRequests: z.number()
    .int()
    .min(1, 'Rate limit must allow at least 1 request')
    .max(1000, 'Rate limit cannot exceed 1000 requests')
    .optional(),
  
  enableMetrics: z.boolean().optional(),
  enableCaching: z.boolean().optional()
});

// Bulk operations validation
export const BulkOperationSchema = z.object({
  operation: z.enum(['delete', 'update'], {
    errorMap: () => ({ message: 'Operation must be either delete or update' })
  }),
  
  items: z.array(z.number().int().positive())
    .min(1, 'At least one item must be selected')
    .max(100, 'Cannot process more than 100 items at once'),
  
  updateData: UpdateIndexItemSchema.optional()
}).refine(
  data => data.operation !== 'update' || data.updateData,
  'Update data is required for update operations'
);

// Export validation helper functions
export const validateWith = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { success: false, errors: ['Validation failed'] };
    }
  };
};

// Validation middleware helper
export const createValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): T => {
    return schema.parse(data);
  };
};

// Export all schemas
export {
  VALID_CAMPUSES,
  VALID_LETTERS,
  urlPattern,
  emailPattern
};