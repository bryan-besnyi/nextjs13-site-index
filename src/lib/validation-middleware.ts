/**
 * Validation Middleware for Next.js API Routes
 * 
 * Provides middleware functions to validate request data using Zod schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation error response type
interface ValidationError {
  error: string;
  details: string[];
  timestamp: string;
}

/**
 * Creates a validation middleware for request body
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse: ValidationError = {
          error: 'Validation failed',
          details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
          timestamp: new Date().toISOString()
        };
        return {
          success: false,
          response: NextResponse.json(errorResponse, { status: 400 })
        };
      }
      // JSON parsing error
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Invalid JSON in request body', timestamp: new Date().toISOString() },
          { status: 400 }
        )
      };
    }
  };
}

/**
 * Creates a validation middleware for query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (request: NextRequest): { success: true; data: T } | { success: false; response: NextResponse } => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const queryObject: Record<string, string> = {};
      
      // Convert URLSearchParams to plain object
      searchParams.forEach((value, key) => {
        queryObject[key] = value;
      });
      
      const validatedData = schema.parse(queryObject);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse: ValidationError = {
          error: 'Invalid query parameters',
          details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
          timestamp: new Date().toISOString()
        };
        return {
          success: false,
          response: NextResponse.json(errorResponse, { status: 400 })
        };
      }
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Query parameter validation failed', timestamp: new Date().toISOString() },
          { status: 400 }
        )
      };
    }
  };
}

/**
 * Creates a validation middleware for path parameters
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (params: Record<string, string | string[]>): { success: true; data: T } | { success: false; response: NextResponse } => {
    try {
      const validatedData = schema.parse(params);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse: ValidationError = {
          error: 'Invalid path parameters',
          details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
          timestamp: new Date().toISOString()
        };
        return {
          success: false,
          response: NextResponse.json(errorResponse, { status: 400 })
        };
      }
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Path parameter validation failed', timestamp: new Date().toISOString() },
          { status: 400 }
        )
      };
    }
  };
}

/**
 * Validates User-Agent header
 */
export function validateUserAgent(request: NextRequest): { valid: boolean; response?: NextResponse } {
  const userAgent = request.headers.get('user-agent') || '';
  
  if (!userAgent || userAgent.length < 5) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Invalid User-Agent header', timestamp: new Date().toISOString() },
        { status: 403 }
      )
    };
  }
  
  const lower = userAgent.toLowerCase();
  const blockedPatterns = ['bot/', 'crawler/', 'scrapy', 'spider'];
  const isBlocked = blockedPatterns.some(pattern => lower.includes(pattern)) &&
                   !lower.includes('fetch') && !lower.includes('mozilla');
  
  if (isBlocked) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Blocked User-Agent', timestamp: new Date().toISOString() },
        { status: 403 }
      )
    };
  }
  
  return { valid: true };
}

/**
 * Validates Content-Type for requests with body
 */
export function validateContentType(request: NextRequest, expectedType: string = 'application/json'): { valid: boolean; response?: NextResponse } {
  const contentType = request.headers.get('content-type');
  
  if (!contentType || !contentType.includes(expectedType)) {
    return {
      valid: false,
      response: NextResponse.json(
        { 
          error: `Invalid Content-Type. Expected ${expectedType}`,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    };
  }
  
  return { valid: true };
}

/**
 * Comprehensive validation wrapper for API routes
 */
export function withValidation<TBody = any, TQuery = any, TParams = any>(options: {
  bodySchema?: z.ZodSchema<TBody>;
  querySchema?: z.ZodSchema<TQuery>;
  paramsSchema?: z.ZodSchema<TParams>;
  validateUserAgent?: boolean;
  validateContentType?: boolean;
}) {
  return function (
    handler: (
      request: NextRequest,
      validatedData: {
        body?: TBody;
        query?: TQuery;
        params?: TParams;
      },
      context?: any
    ) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest, context?: any): Promise<NextResponse> {
      const validatedData: { body?: TBody; query?: TQuery; params?: TParams } = {};
      
      // Validate User-Agent if required
      if (options.validateUserAgent) {
        const userAgentResult = validateUserAgent(request);
        if (!userAgentResult.valid) {
          return userAgentResult.response!;
        }
      }
      
      // Validate Content-Type for methods with body
      if (options.validateContentType && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentTypeResult = validateContentType(request);
        if (!contentTypeResult.valid) {
          return contentTypeResult.response!;
        }
      }
      
      // Validate query parameters
      if (options.querySchema) {
        const queryResult = validateQuery(options.querySchema)(request);
        if ('response' in queryResult) {
          return queryResult.response;
        }
        validatedData.query = queryResult.data;
      }
      
      // Validate request body
      if (options.bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const bodyResult = await validateBody(options.bodySchema)(request);
        if ('response' in bodyResult) {
          return bodyResult.response;
        }
        validatedData.body = bodyResult.data;
      }
      
      // Validate path parameters
      if (options.paramsSchema && context?.params) {
        const paramsResult = validateParams(options.paramsSchema)(await context.params);
        if ('response' in paramsResult) {
          return paramsResult.response;
        }
        validatedData.params = paramsResult.data;
      }
      
      // Call the handler with validated data
      return handler(request, validatedData, context);
    };
  };
}

// Export helper types
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; response: NextResponse };

export type ValidatedData<TBody, TQuery, TParams> = {
  body?: TBody;
  query?: TQuery;
  params?: TParams;
};