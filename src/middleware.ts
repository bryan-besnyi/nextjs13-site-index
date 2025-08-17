import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only apply in preview environments
  const isPreview = process.env.VERCEL_ENV === 'preview' || process.env.BYPASS_AUTH === 'true';
  
  if (isPreview && request.nextUrl.pathname.startsWith('/admin')) {
    // Check if user is already authenticated
    const sessionToken = request.cookies.get('next-auth.session-token')?.value || 
                       request.cookies.get('__Secure-next-auth.session-token')?.value;
    
    if (!sessionToken) {
      // Redirect to sign in page with automatic redirect back
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};