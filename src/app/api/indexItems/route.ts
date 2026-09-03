import { kv } from '@vercel/kv';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';
const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days; writes call invalidateCache(), so TTL is only a safety net

// Trusted origins whitelist
const TRUSTED_ORIGINS = [
  'https://smccd.edu',
  'https://www.smccd.edu',
  'https://smccd.edu/portal',
  'https://collegeofsanmateo.edu',
  'https://canadacollege.edu',
  'https://skylinecollege.edu',
  process.env.NEXTAUTH_URL || 'http://localhost:3000'
];

export async function GET(req: NextRequest) {
  try {
    const userAgent = req.headers.get('user-agent') || '';
    const origin = req.headers.get('origin');
    const isTrustedOrigin = origin && TRUSTED_ORIGINS.includes(origin);

    // Skip user-agent checks for trusted origins
    if (!isTrustedOrigin) {
      const blockedUserAgents = [
        'MSIE 7.0',
        'Windows NT 5.1',
        'MSIE 6.0',
        'Windows NT 5.0',
        'Mozilla/4.0',
        'curl',
        'wget',
        'python-requests',
        'httpclient',
        'libwww-perl',
        'Go-http-client',
        'Java/',
        'Apache-HttpClient',
        'Scrapy',
        'bot',
        'crawler',
        'spider'
      ];
      if (
        !userAgent ||
        blockedUserAgents.some((ua) => userAgent.toLowerCase().includes(ua))
      ) {
        if (isDev) console.log(`Blocked User-Agent: ${userAgent}`);
        return new NextResponse(JSON.stringify({ error: 'Blocked User-Agent' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Rate limiting is handled by middleware — no per-route limiter needed

    const url = req.nextUrl;
    const campus = url.searchParams.get('campus') || '';
    // Normalize before building the key so ?letter=a and ?letter=A share one cache entry
    const letter = (url.searchParams.get('letter') || '').toUpperCase();
    const search = (url.searchParams.get('search') || '').trim();

    const cacheKey = `index:${campus}:${letter}:${search}`;

    if (isDev) console.log(`Attempting to fetch data for key: ${cacheKey}`);

    // Build query conditions up front so they're available for cache miss AND fallback
    const conditions: {
      campus?: string;
      letter?: string;
      OR?: { title: { contains: string; mode: 'insensitive' } }[];
    } = {};
    if (campus) conditions.campus = campus;
    if (letter) conditions.letter = letter;
    if (search)
      conditions.OR = [{ title: { contains: search, mode: 'insensitive' } }];

    const selectFields = {
      id: true,
      title: true,
      letter: true,
      url: true,
      campus: true
    };

    // Try to get data from Vercel KV
    const cachedData = await kv.get(cacheKey);
    let indexItems;

    if (cachedData && Array.isArray(cachedData)) {
      if (isDev) console.log(`Cache hit for key: ${cacheKey} (${cachedData.length} items)`);
      indexItems = cachedData;
    } else {
      if (isDev) console.log(`Cache miss for key: ${cacheKey}`);

      indexItems = await prisma.indexitem.findMany({
        where: conditions,
        orderBy: { title: 'asc' },
        select: selectFields
      });

      if (isDev) console.log(`Fetched ${indexItems.length} items from database`);

      // Store in KV and track the key for efficient invalidation
      await Promise.all([
        kv.set(cacheKey, JSON.stringify(indexItems), { ex: CACHE_TTL }),
        kv.sadd('index:_keys', cacheKey)
      ]);
    }

    // Get origin and check against whitelist
    const requestOrigin = req.headers.get('origin');
    const allowedOrigin = requestOrigin && TRUSTED_ORIGINS.includes(requestOrigin) ? requestOrigin : '*';

    return new NextResponse(JSON.stringify(indexItems), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control':
          'public, max-age=3600, s-maxage=3600, stale-while-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Request error', error);
    return new NextResponse(JSON.stringify({ error: 'Error fetching data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
