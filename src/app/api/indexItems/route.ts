import { kv } from '@vercel/kv';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';

const prisma = new PrismaClient();
const CACHE_TTL = 60 * 60; // 1 hour in seconds

// Create a new ratelimiter, that allows 5 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '10 s')
});

export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const ip = req.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      console.log(`Rate limit exceeded for IP: ${ip}`);
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

    console.log(`Attempting to fetch data for key: ${cacheKey}`);

    // Try to get data from Vercel KV
    let cachedData = await kv.get(cacheKey);
    console.log('Raw cached data:', cachedData);
    let indexItems;

    if (!cachedData) {
      console.log(`Cache miss for key: ${cacheKey}`);

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
        orderBy: {
          title: 'asc'
        }
      });

      console.log(`Fetched ${indexItems.length} items from database`);

      // Store in Vercel KV
      await kv.set(cacheKey, JSON.stringify(indexItems), { ex: CACHE_TTL });
      console.log(`Cached ${indexItems.length} items with key: ${cacheKey}`);
    } else {
      console.log(`Cache hit for key: ${cacheKey}`);
      if (typeof cachedData === 'string') {
        try {
          indexItems = JSON.parse(cachedData);
          console.log(`Retrieved ${indexItems.length} items from cache`);
        } catch (parseError) {
          console.error('Error parsing cached data:', parseError);
          indexItems = await prisma.indexitem.findMany({
            orderBy: {
              title: 'asc'
            }
          });
          console.log(
            `Fetched ${indexItems.length} items from database after cache parse error`
          );
          await kv.set(cacheKey, JSON.stringify(indexItems), { ex: CACHE_TTL });
          console.log(
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
          orderBy: {
            title: 'asc'
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

    return new NextResponse(JSON.stringify(indexItems), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    const ip = req.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      console.log(`Rate limit exceeded for IP: ${ip}`);
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

    console.log(`Created new index item: ${JSON.stringify(newIndexItem)}`);

    // Invalidate cache
    const cacheKey = `index:${campus}:${letter}:`;
    await kv.del(cacheKey);
    console.log(`Invalidated cache for key: ${cacheKey}`);

    // Re-cache with the new item
    const updatedItems = await prisma.indexitem.findMany({
      where: { campus, letter: { startsWith: letter } },
      orderBy: { title: 'asc' }
    });
    await kv.set(cacheKey, JSON.stringify(updatedItems), { ex: CACHE_TTL });
    console.log(`Re-cached ${updatedItems.length} items for key: ${cacheKey}`);

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
    const ip = req.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      console.log(`Rate limit exceeded for IP: ${ip}`);
      return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = req.nextUrl.searchParams.get('id');

    const deletedItem = await prisma.indexitem.delete({
      where: { id: Number(id) }
    });

    console.log(`Deleted index item: ${JSON.stringify(deletedItem)}`);

    // Invalidate cache
    const cacheKey = `index:${deletedItem.campus}:${deletedItem.letter}:`;
    await kv.del(cacheKey);
    console.log(`Invalidated cache for key: ${cacheKey}`);

    // Re-cache with updated items
    const updatedItems = await prisma.indexitem.findMany({
      where: {
        campus: deletedItem.campus,
        letter: { startsWith: deletedItem.letter }
      },
      orderBy: { title: 'asc' }
    });
    await kv.set(cacheKey, JSON.stringify(updatedItems), { ex: CACHE_TTL });
    console.log(`Re-cached ${updatedItems.length} items for key: ${cacheKey}`);

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
