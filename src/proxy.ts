import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const isDev = process.env.NODE_ENV === 'development';

// Two rate limit tiers: standard for reads, strict for writes
const readLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, '30 s'),
  prefix: 'rl:read',
});

const writeLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '10 s'),
  prefix: 'rl:write',
});

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Prevent indexing of admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // Exempt health check cron from rate limiting
  if (request.nextUrl.pathname === '/api/health') {
    return response;
  }

  // Apply rate limiting to API and admin routes
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/admin')
  ) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || '127.0.0.1';

    if (isDev) console.log(`Request from IP: ${ip}`);

    // Skip rate limiting for localhost in development
    if (process.env.NODE_ENV === 'development' && ip === '127.0.0.1') {
      return response;
    }

    // Use stricter limiter for write operations (POST/PUT/DELETE)
    const method = request.method;
    const isWrite = method === 'POST' || method === 'PUT' || method === 'DELETE';
    const limiter = isWrite ? writeLimiter : readLimiter;

    try {
      const { success, limit, reset, remaining } = await limiter.limit(ip);

      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', reset.toString());

      if (!success) {
        return new NextResponse(
          JSON.stringify({ error: 'Too Many Requests' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString()
            }
          }
        );
      }
    } catch (error) {
      console.error('Rate limiting error:', error);
      // If rate limiting fails, allow the request to proceed
    }
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*']
};
