import { NextRequest } from 'next/server';
import crypto from 'crypto';

// CSRF token generation and validation
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(request: NextRequest, token: string | null): boolean {
  // Skip CSRF validation in development for easier testing
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_CSRF === 'true') {
    return true;
  }

  if (!token) {
    return false;
  }

  // Get the token from the request headers or body
  const requestToken = request.headers.get('x-csrf-token') || 
                      request.headers.get('csrf-token');

  return requestToken === token;
}

// Middleware helper to check CSRF for mutating operations
export function requireCSRF(handler: Function) {
  return async function(request: NextRequest, ...args: any[]) {
    // Skip CSRF for GET and HEAD requests
    if (['GET', 'HEAD'].includes(request.method)) {
      return handler(request, ...args);
    }

    // In production, always validate CSRF tokens
    if (process.env.NODE_ENV === 'production') {
      const token = request.headers.get('x-csrf-token');
      
      // For now, we'll use a simplified approach where the client
      // must include a valid session-based token
      // In a full implementation, this would validate against stored tokens
      if (!token || token.length < 32) {
        return new Response(
          JSON.stringify({ error: 'Invalid CSRF token' }), 
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return handler(request, ...args);
  };
}