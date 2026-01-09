import { kv } from '@vercel/kv';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';

const isDev = process.env.NODE_ENV === 'development';
const CACHE_TTL = 60 * 60; // 1 hour in seconds

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '10 s')
});

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
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || '127.0.0.1';
    const compositeKey = `${ip}:${userAgent}`;
    const origin = req.headers.get('origin');
    const isTrustedOrigin = origin && TRUSTED_ORIGINS.includes(origin);

    // Skip user-agent checks for trusted origins
    if (!isTrustedOrigin) {
      // Block outdated/suspicious User-Agent
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
      // Block empty or suspicious User-Agents
      if (
        !userAgent ||
        blockedUserAgents.some((ua) => userAgent.toLowerCase().includes(ua))
      ) {
        if (isDev) console.log(`Blocked IP: ${ip}, User-Agent: ${userAgent}`);
        return new NextResponse(JSON.stringify({ error: 'Blocked User-Agent' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Apply rate limiting
    const { success } = await ratelimit.limit(compositeKey);

    if (!success) {
      if (isDev) console.log(`Rate limit exceeded for IP: ${ip} and UA: ${userAgent}`);
      return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = req.nextUrl;
    const campus = url.searchParams.get('campus') || '';
    const letter = url.searchParams.get('letter') || '';
    const search = url.searchParams.get('search') || '';

    const cacheKey = `index:${campus}:${letter}:${search}`;

    if (isDev) console.log(`Attempting to fetch data for key: ${cacheKey}`);

    // Try to get data from Vercel KV
    let cachedData = await kv.get(cacheKey);
    if (isDev) console.log('Raw cached data:', cachedData);
    let indexItems;

    if (!cachedData) {
      if (isDev) console.log(`Cache miss for key: ${cacheKey}`);

      const conditions: {
        campus?: string;
        letter?: { contains: string; mode: 'insensitive' };
        OR?: { title: { contains: string; mode: 'insensitive' } }[];
      } = {};
      if (campus) conditions.campus = campus;
      if (letter) conditions.letter = { contains: letter, mode: 'insensitive' };
      if (search)
        conditions.OR = [{ title: { contains: search, mode: 'insensitive' } }];

      indexItems = await prisma.indexitem.findMany({
        where: conditions,
        orderBy: { title: 'asc' },
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true
        }
      });

      if (isDev) console.log(`Fetched ${indexItems.length} items from database`);

      // Store in Vercel KV
      await kv.set(cacheKey, JSON.stringify(indexItems), { ex: CACHE_TTL });
      if (isDev) console.log(`Cached ${indexItems.length} items with key: ${cacheKey}`);
    } else {
      if (isDev) console.log(`Cache hit for key: ${cacheKey}`);
      if (typeof cachedData === 'string') {
        try {
          indexItems = JSON.parse(cachedData);
          if (isDev) console.log(`Retrieved ${indexItems.length} items from cache`);
        } catch (parseError) {
          console.error('Error parsing cached data:', parseError);
          indexItems = await prisma.indexitem.findMany({
            orderBy: { title: 'asc' },
            select: {
              id: true,
              title: true,
              letter: true,
              url: true,
              campus: true
            }
          });
          console.log(
            `Fetched ${indexItems.length} items from database after cache parse error`
          );
          await kv.set(cacheKey, JSON.stringify(indexItems), { ex: CACHE_TTL });
          if (isDev) console.log(
            `Re-cached ${indexItems.length} items with key: ${cacheKey}`
          );
        }
      } else if (Array.isArray(cachedData)) {
        indexItems = cachedData;
        console.log(
          `Retrieved ${indexItems.length} items from cache (already parsed)`
        );
      } else {
        console.error('Unexpected cache data type:', typeof cachedData);
        indexItems = await prisma.indexitem.findMany({
          orderBy: { title: 'asc' },
          select: {
            id: true,
            title: true,
            letter: true,
            url: true,
            campus: true
          }
        });
        console.log(
          `Fetched ${indexItems.length} items from database due to unexpected cache data`
        );
        await kv.set(cacheKey, JSON.stringify(indexItems), { ex: CACHE_TTL });
        console.log(
          `Re-cached ${indexItems.length} items with key: ${cacheKey}`
        );
      }
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

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      if (isDev) console.log(`Rate limit exceeded for IP: ${ip}`);
      return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { title, letter, url, campus } = await req.json();

    const newIndexItem = await prisma.indexitem.create({
      data: {
        title: title,
        letter: letter,
        url: url,
        campus: campus
      }
    });

    if (isDev) console.log(`Created new index item: ${JSON.stringify(newIndexItem)}`);

    // Invalidate all related cache keys using pattern matching
    const cachePattern = `index:${campus}:*`;
    const keysToInvalidate = await kv.keys(cachePattern);
    if (keysToInvalidate.length > 0) {
      await kv.del(...keysToInvalidate);
      if (isDev) console.log(`Invalidated ${keysToInvalidate.length} cache keys matching: ${cachePattern}`);
    }

    return new NextResponse(JSON.stringify(newIndexItem), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating index item', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error creating new index item' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Apply rate limiting
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      if (isDev) console.log(`Rate limit exceeded for IP: ${ip}`);
      return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = req.nextUrl.searchParams.get('id');

    const deletedItem = await prisma.indexitem.delete({
      where: { id: Number(id) }
    });

    if (isDev) console.log(`Deleted index item: ${JSON.stringify(deletedItem)}`);

    // Invalidate all related cache keys using pattern matching
    const cachePattern = `index:${deletedItem.campus}:*`;
    const keysToInvalidate = await kv.keys(cachePattern);
    if (keysToInvalidate.length > 0) {
      await kv.del(...keysToInvalidate);
      if (isDev) console.log(`Invalidated ${keysToInvalidate.length} cache keys matching: ${cachePattern}`);
    }

    return new NextResponse(null, {
      status: 204
    });
  } catch (error) {
    console.error('Error deleting index item', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error deleting index item' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
