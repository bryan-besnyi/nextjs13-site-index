import { CACHE_TAG, getIndexItems } from '@/lib/cache';
import { NextRequest, NextResponse } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';

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

    // Rate limiting is handled by proxy.ts

    const url = req.nextUrl;
    // Normalize so ?letter=a and ?letter=A share one cache entry
    const indexItems = await getIndexItems({
      campus: url.searchParams.get('campus') || '',
      letter: (url.searchParams.get('letter') || '').toUpperCase(),
      search: (url.searchParams.get('search') || '').trim()
    });

    const allowedOrigin = isTrustedOrigin ? origin : '*';

    return new NextResponse(JSON.stringify(indexItems), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control':
          'public, max-age=3600, s-maxage=3600, stale-while-revalidate',
        'Vercel-Cache-Tag': CACHE_TAG,
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
