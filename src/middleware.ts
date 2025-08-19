import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Disable middleware in development/bypass mode
  const bypassAuth = process.env.BYPASS_AUTH === 'true';
  
  if (bypassAuth) {
    return NextResponse.next();
  }
  
  // Production middleware logic here if needed
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};