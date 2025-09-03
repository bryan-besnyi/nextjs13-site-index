import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const REQUESTS_PER_WINDOW = 20;
const WINDOW_SIZE_IN_SECONDS = 30;

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(
    REQUESTS_PER_WINDOW,
    `${WINDOW_SIZE_IN_SECONDS} s`
  )
});

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Prevent indexing of admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // Apply rate limiting to API and admin routes
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/admin')
  ) {
    // Try to get the real IP behind a proxy
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip =
      forwardedFor?.split(',')[0] || realIp || '127.0.0.1';

    console.log(`Request from IP: ${ip}`);

    // Skip rate limiting for localhost in development
    if (process.env.NODE_ENV === 'development' && ip === '127.0.0.1') {
      return response;
    }

    try {
      const { success, limit, reset, remaining } = await ratelimit.limit(
        `${ip}:${request.nextUrl.pathname}`
      );

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
