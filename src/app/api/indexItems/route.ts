import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { prisma } from '@/lib/prisma-singleton';
import { PerformanceMonitor, timeDbQuery, timeCacheOperation } from '@/lib/performance-monitor';
import { PerformanceCollector } from '@/lib/performance-collector';
import * as CachedIndexItems from '@/lib/indexItems-cached';
import { PerformanceOptimizer, QueryOptimizer, PERFORMANCE_TARGETS } from '@/lib/performance-optimizations';
import { CSRFProtection } from '@/lib/csrf';
import { QueryCache } from '@/lib/query-cache';
import { 
  CreateIndexItemSchema, 
  UpdateIndexItemSchema, 
  IndexItemQuerySchema, 
  IdQuerySchema 
} from '@/lib/validation-schemas';
import { validateQuery, validateBody, validateUserAgent } from '@/lib/validation-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

// Optimized caching strategy
const CACHE_TTL = 4 * 60 * 60; // 4 hours (more aggressive caching)
const CACHE_PREFIX = 'api:v2:index:';

// More permissive rate limiting for API consumers  
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, '60 s') // 20/minute instead of 5/10s
});

// Campus mapping for backward compatibility
const CAMPUS_MAP: Record<string, string> = {
  'CSM': 'College of San Mateo',
  'SKY': 'Skyline College', 
  'CAN': 'Cañada College',
  'CANADA': 'Cañada College',
  'DO': 'District Office',
  'DISTRICT': 'District Office'
};

// Allowed CORS origins for production security
const ALLOWED_ORIGINS = [
  'https://collegeofsanmateo.edu',
  'https://canadacollege.edu', 
  'https://skylinecollege.edu',
  process.env.NEXTAUTH_URL || 'https://localhost:3000', // Production site from env
  'https://site-index-git-develop-smcccd.vercel.app', // Preview deployment
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000'
  ] : [])
];

// CORS header helper
const getCORSHeaders = (origin: string | null): Record<string, string> => {
  // Check if origin is allowed
  const isAllowed = origin && ALLOWED_ORIGINS.some(allowed => 
    origin.startsWith(allowed) || origin === allowed
  );
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin'
  };
};

// User-Agent validation is now handled by validation middleware

export async function GET(req: NextRequest) {
  const perfMonitor = new PerformanceMonitor(req);
  let dbQueryTime: number | undefined;
  let cacheQueryTime: number | undefined;
  let cacheHit = false;
  
  try {
    // Get origin for CORS
    const origin = req.headers.get('origin');
    const corsHeaders = getCORSHeaders(origin);

    // Validate User-Agent
    const userAgentResult = validateUserAgent(req);
    if (!userAgentResult.valid) {
      return NextResponse.json(
        { error: 'Invalid User-Agent', timestamp: new Date().toISOString() }, 
        { 
          status: 403,
          headers: corsHeaders
        }
      );
    }

    // Validate query parameters
    const queryValidation = validateQuery(IndexItemQuerySchema)(req);
    if ('response' in queryValidation) {
      return queryValidation.response;
    }
    const { campus, letter, search } = queryValidation.data;

    // Rate limiting with better IP detection
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               '127.0.0.1';
    
    const { success, limit, remaining } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: 60 },
        { 
          status: 429,
          headers: { 
            ...corsHeaders,
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          }
        }
      );
    }

    // Parameters are now validated and normalized by the validation middleware

    // Smart cache key strategy - don't cache short searches to prevent pollution
    const shouldCache = !search || search.length >= 3;
    const cacheKey = shouldCache ? `${CACHE_PREFIX}${campus}:${letter}:${search}` : null;
    
    // Try cache first with timing (only if we should cache)
    let indexItems: any;
    if (cacheKey) {
      try {
        const { result: cached, cacheTime } = await timeCacheOperation(
          () => kv.get(cacheKey),
          'get'
        );
        cacheQueryTime = cacheTime;
        
        if (cached) {
          cacheHit = true;
          const metrics = await perfMonitor.recordMetrics(200, {
            cacheHit: true,
            cacheQueryTime,
            resultCount: Array.isArray(cached) ? cached.length : 0
          });
          
          // Log activity for cache hit
          await ActivityLogger.logApiRequest({
            request: req,
            action: 'VIEW_ITEMS',
            resource: 'indexItems',
            statusCode: 200,
            duration: metrics.responseTime,
            details: {
              campus,
              letter,
              search,
              resultCount: Array.isArray(cached) ? cached.length : 0,
              cacheHit: true
            }
          });
          
          return NextResponse.json(cached, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=14400, s-maxage=14400',
              'X-Cache': 'HIT',
              'X-Response-Time': `${metrics.responseTime}ms`,
              'X-Cache-Time': `${cacheQueryTime}ms`,
              'X-RateLimit-Remaining': remaining.toString()
            }
          });
        }
      } catch (cacheError) {
        console.warn('Cache read failed:', cacheError);
      }
    }

    // Optimized database query using performance optimizations
    const startTime = performance.now();
    
    // Use optimized query with multi-level caching (only if we should cache)
    if (cacheKey) {
      indexItems = await PerformanceOptimizer.getWithCache(
        cacheKey,
        () => QueryOptimizer.getIndexItems({
          campus,
          letter,
          search
        }),
        {
          priority: campus ? 'hot' : 'warm', // Campus queries are typically more popular
          redisTtl: search ? 1800 : CACHE_TTL, // Shorter TTL for search queries (30 min vs 4 hours)
          memoryTtl: 5 * 60 * 1000 // 5 minutes in memory for ultra-fast repeat requests
        }
      );
    } else {
      // Direct query without caching for short searches
      indexItems = await QueryOptimizer.getIndexItems({
        campus,
        letter,
        search
      });
    }
    
    dbQueryTime = performance.now() - startTime;

    // Cache the results asynchronously (don't wait) - only if we should cache
    if (cacheKey) {
      const cacheTTL = search ? 1800 : CACHE_TTL; // Shorter TTL for search queries
      timeCacheOperation(
        () => kv.set(cacheKey, indexItems, { ex: cacheTTL }),
        'set'
      ).catch(err => console.warn('Cache write failed:', err));
    }

    // Record final metrics
    const metrics = await perfMonitor.recordMetrics(200, {
      cacheHit: false,
      dbQueryTime,
      cacheQueryTime,
      resultCount: indexItems.length
    });
    
    // Performance alerting
    if (metrics.responseTime > PERFORMANCE_TARGETS.API_RESPONSE_TIME) {
      console.warn(`⚠️ Performance target missed: ${metrics.responseTime}ms > ${PERFORMANCE_TARGETS.API_RESPONSE_TIME}ms target`);
    }
    
    // Log activity
    await ActivityLogger.logApiRequest({
      request: req,
      action: 'VIEW_ITEMS',
      resource: 'indexItems',
      statusCode: 200,
      duration: metrics.responseTime,
      details: {
        campus,
        letter,
        search,
        resultCount: indexItems.length,
        cacheHit: false
      }
    });
    
    return NextResponse.json(indexItems, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': cacheKey 
          ? 'public, max-age=14400, s-maxage=14400, stale-while-revalidate=86400'
          : 'no-cache, no-store, must-revalidate', // Don't cache short searches in browser
        'X-Cache': cacheKey ? 'MISS' : 'SKIP',
        'X-Response-Time': `${metrics.responseTime}ms`,
        'X-DB-Time': `${dbQueryTime}ms`,
        'X-Cache-Time': cacheQueryTime ? `${cacheQueryTime}ms` : 'N/A',
        'X-Results-Count': indexItems.length.toString(),
        'X-Cache-Strategy': cacheKey ? 'cached' : 'uncached-short-search',
        'X-RateLimit-Remaining': remaining.toString()
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    
    const origin = req.headers.get('origin');
    const corsHeaders = getCORSHeaders(origin);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  }
}

// Optimized POST with better cache invalidation
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    const corsHeaders = getCORSHeaders(origin);

    // CSRF Protection
    const csrfResult = await CSRFProtection.middleware(req);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: csrfResult.error || 'CSRF validation failed' },
        { 
          status: 403,
          headers: { 
            ...corsHeaders,
            'X-CSRF-Required': 'true' 
          }
        }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: corsHeaders
        }
      );
    }

    // Validate request body
    const bodyValidation = await validateBody(CreateIndexItemSchema)(req);
    if ('response' in bodyValidation) {
      return bodyValidation.response;
    }
    const { title, letter, url, campus } = bodyValidation.data;

    const newItem = await prisma.indexitem.create({
      data: { title, letter, url, campus },
      select: {
        id: true,
        title: true,
        letter: true,
        url: true,
        campus: true
      }
    });

    // Smart cache invalidation - clear related cache patterns
    const patterns = [
      `${CACHE_PREFIX}${campus}:${letter}:`,
      `${CACHE_PREFIX}${campus}::`,
      `${CACHE_PREFIX}:${letter}:`,
      `${CACHE_PREFIX}::`
    ];
    
    // Invalidate in parallel (don't wait)
    patterns.forEach(pattern => {
      kv.del(pattern).catch(err => console.warn('Cache invalidation failed:', err));
    });

    // Invalidate count caches since we added an item
    QueryCache.invalidateCountCaches().catch(err => console.warn('Count cache invalidation failed:', err));

    return NextResponse.json(newItem, {
      status: 201,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    });

  } catch (error) {
    console.error('POST Error:', error);
    const origin = req.headers.get('origin');
    const corsHeaders = getCORSHeaders(origin);
    
    return NextResponse.json(
      { error: 'Error creating item' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

// Optimized DELETE
export async function DELETE(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    const corsHeaders = getCORSHeaders(origin);

    // CSRF Protection
    const csrfResult = await CSRFProtection.middleware(req);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: csrfResult.error || 'CSRF validation failed' },
        { 
          status: 403,
          headers: { 
            ...corsHeaders,
            'X-CSRF-Required': 'true' 
          }
        }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' }, 
        { 
          status: 429,
          headers: corsHeaders
        }
      );
    }

    // Validate ID parameter
    const idParam = req.nextUrl.searchParams.get('id');
    if (!idParam) {
      return NextResponse.json(
        { error: 'ID parameter is required', timestamp: new Date().toISOString() }, 
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'ID must be a positive number', timestamp: new Date().toISOString() }, 
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    const deletedItem = await prisma.indexitem.delete({
      where: { id }
    });

    // Clear all related cache patterns
    const patterns = [
      `${CACHE_PREFIX}${deletedItem.campus}:${deletedItem.letter}:`,
      `${CACHE_PREFIX}${deletedItem.campus}::`,
      `${CACHE_PREFIX}:${deletedItem.letter}:`,
      `${CACHE_PREFIX}::`
    ];
    
    patterns.forEach(pattern => {
      kv.del(pattern).catch(err => console.warn('Cache invalidation failed:', err));
    });

    // Invalidate count caches since we deleted an item
    QueryCache.invalidateCountCaches().catch(err => console.warn('Count cache invalidation failed:', err));

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { error: 'Error deleting item' },
      { status: 500 }
    );
  }
}

// UPDATE/PATCH endpoint for modifying existing items
export async function PATCH(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    const corsHeaders = getCORSHeaders(origin);

    // CSRF Protection
    const csrfResult = await CSRFProtection.middleware(req);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: csrfResult.error || 'CSRF validation failed' },
        { 
          status: 403,
          headers: { 'X-CSRF-Required': 'true' }
        }
      );
    }

    // Validate User-Agent
    const userAgentResult = validateUserAgent(req);
    if (!userAgentResult.valid) {
      return NextResponse.json(
        { error: 'Invalid User-Agent', timestamp: new Date().toISOString() }, 
        { 
          status: 403,
          headers: corsHeaders
        }
      );
    }

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: corsHeaders
        }
      );
    }

    // Validate ID parameter
    const idParam = req.nextUrl.searchParams.get('id');
    if (!idParam) {
      return NextResponse.json(
        { error: 'ID parameter is required', timestamp: new Date().toISOString() }, 
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'ID must be a positive number', timestamp: new Date().toISOString() }, 
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Validate request body
    const bodyValidation = await validateBody(UpdateIndexItemSchema)(req);
    if ('response' in bodyValidation) {
      return bodyValidation.response;
    }
    const updateData = bodyValidation.data;

    // updateData is already validated by the schema

    // Get the current item for cache invalidation
    const currentItem = await prisma.indexitem.findUnique({
      where: { id }
    });

    if (!currentItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }

    // Update the item
    const updatedItem = await prisma.indexitem.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        letter: true,
        url: true,
        campus: true
      }
    });

    // Smart cache invalidation - clear both old and new cache patterns
    const patterns = new Set([
      // Old patterns
      `${CACHE_PREFIX}${currentItem.campus}:${currentItem.letter}:`,
      `${CACHE_PREFIX}${currentItem.campus}::`,
      `${CACHE_PREFIX}:${currentItem.letter}:`,
      // New patterns (if campus or letter changed)
      `${CACHE_PREFIX}${updatedItem.campus}:${updatedItem.letter}:`,
      `${CACHE_PREFIX}${updatedItem.campus}::`,
      `${CACHE_PREFIX}:${updatedItem.letter}:`,
      // Always clear the "all" cache
      `${CACHE_PREFIX}::`
    ]);
    
    // Invalidate in parallel (don't wait)
    Array.from(patterns).forEach(pattern => {
      kv.del(pattern).catch(err => console.warn('Cache invalidation failed:', err));
    });

    return NextResponse.json(updatedItem, {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    });

  } catch (error) {
    console.error('PATCH Error:', error);
    const origin = req.headers.get('origin');
    const corsHeaders = getCORSHeaders(origin);
    
    return NextResponse.json(
      { error: 'Error updating item' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

// Support PUT as an alias for PATCH
export async function PUT(req: NextRequest) {
  return PATCH(req);
}

// Handle CORS preflight requests
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  const corsHeaders = getCORSHeaders(origin);
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Access-Control-Max-Age': '86400' // Cache preflight for 24 hours
    }
  });
}