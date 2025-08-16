import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { prisma } from '@/lib/prisma-singleton';
import { PerformanceMonitor, timeDbQuery, timeCacheOperation } from '@/lib/performance-monitor';
import { PerformanceCollector } from '@/lib/performance-collector';
import * as CachedIndexItems from '@/lib/indexItems-cached';

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

// Optimized User-Agent validation
const BLOCKED_PATTERNS = ['bot/', 'crawler/', 'scrapy', 'spider'];
const isValidUserAgent = (ua: string): boolean => {
  if (!ua || ua.length < 5) return false;
  const lower = ua.toLowerCase();
  return !BLOCKED_PATTERNS.some(pattern => lower.includes(pattern)) ||
         lower.includes('fetch') || lower.includes('mozilla');
};

export async function GET(req: NextRequest) {
  const perfMonitor = new PerformanceMonitor(req);
  let dbQueryTime: number | undefined;
  let cacheQueryTime: number | undefined;
  let cacheHit = false;
  
  try {
    // Quick validation
    const userAgent = req.headers.get('user-agent') || '';
    if (!isValidUserAgent(userAgent)) {
      return NextResponse.json({ error: 'Invalid User-Agent' }, { status: 403 });
    }

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
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          }
        }
      );
    }

    // Parse and normalize parameters
    const params = req.nextUrl.searchParams;
    let campus = params.get('campus') || '';
    const letter = params.get('letter') || '';
    const search = params.get('search') || '';

    // Normalize campus codes
    if (campus && CAMPUS_MAP[campus.toUpperCase()]) {
      campus = CAMPUS_MAP[campus.toUpperCase()];
    }

    // Optimized cache key
    const cacheKey = `${CACHE_PREFIX}${campus}:${letter}:${search}`;
    
    // Try cache first with timing
    let indexItems;
    try {
      const { result: cached, cacheTime } = await timeCacheOperation(
        () => kv.get(cacheKey),
        'get'
      );
      cacheQueryTime = cacheTime;
      
      if (cached) {
        cacheHit = true;
        const metrics = perfMonitor.recordMetrics(200, {
          cacheHit: true,
          cacheQueryTime,
          resultCount: Array.isArray(cached) ? cached.length : 0
        });
        
        return NextResponse.json(cached, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
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

    // Optimized database query
    const whereConditions: any = {};
    if (campus) whereConditions.campus = campus;
    if (letter) whereConditions.letter = { contains: letter, mode: 'insensitive' };
    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Database query with timing
    const { result, queryTime } = await timeDbQuery(
      () => prisma.indexitem.findMany({
        where: whereConditions,
        orderBy: [
          { title: 'asc' }
        ],
        // Only select needed fields to reduce payload
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true
        }
      }),
      'indexItems-query'
    );
    
    indexItems = result;
    dbQueryTime = queryTime;

    // Cache the results asynchronously (don't wait)
    timeCacheOperation(
      () => kv.set(cacheKey, indexItems, { ex: CACHE_TTL }),
      'set'
    ).catch(err => console.warn('Cache write failed:', err));

    // Record final metrics
    const metrics = perfMonitor.recordMetrics(200, {
      cacheHit: false,
      dbQueryTime,
      cacheQueryTime,
      resultCount: indexItems.length
    });
    
    return NextResponse.json(indexItems, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=14400, s-maxage=14400, stale-while-revalidate=86400',
        'X-Cache': 'MISS',
        'X-Response-Time': `${metrics.responseTime}ms`,
        'X-DB-Time': `${dbQueryTime}ms`,
        'X-Cache-Time': cacheQueryTime ? `${cacheQueryTime}ms` : 'N/A',
        'X-Results-Count': indexItems.length.toString(),
        'X-RateLimit-Remaining': remaining.toString()
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Optimized POST with better cache invalidation
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { title, letter, url, campus } = await req.json();

    // Input validation
    if (!title || !letter || !url || !campus) {
      return NextResponse.json(
        { error: 'Missing required fields: title, letter, url, campus' },
        { status: 400 }
      );
    }

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

    return NextResponse.json(newItem, {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { error: 'Error creating item' },
      { status: 500 }
    );
  }
}

// Optimized DELETE
export async function DELETE(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const deletedItem = await prisma.indexitem.delete({
      where: { id: Number(id) }
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
    // User-Agent validation
    const userAgent = req.headers.get('user-agent') || '';
    if (!isValidUserAgent(userAgent)) {
      return NextResponse.json({ error: 'Invalid User-Agent' }, { status: 403 });
    }

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get ID from query params
    const id = req.nextUrl.searchParams.get('id');
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Valid ID required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { title, letter, url, campus } = body;

    // Validate at least one field is being updated
    if (!title && !letter && !url && !campus) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    // Build update data object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (letter !== undefined) updateData.letter = letter;
    if (url !== undefined) updateData.url = url;
    if (campus !== undefined) updateData.campus = campus;

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    // Validate letter if provided
    if (letter && letter.length !== 1) {
      return NextResponse.json(
        { error: 'Letter must be a single character' },
        { status: 400 }
      );
    }

    // Get the current item for cache invalidation
    const currentItem = await prisma.indexitem.findUnique({
      where: { id: Number(id) }
    });

    if (!currentItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Update the item
    const updatedItem = await prisma.indexitem.update({
      where: { id: Number(id) },
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
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('PATCH Error:', error);
    return NextResponse.json(
      { error: 'Error updating item' },
      { status: 500 }
    );
  }
}

// Support PUT as an alias for PATCH
export async function PUT(req: NextRequest) {
  return PATCH(req);
}