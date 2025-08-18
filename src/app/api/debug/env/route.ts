import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Debug endpoint to see what environment variables we have
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    BYPASS_AUTH: process.env.BYPASS_AUTH,
    VERCEL_URL: process.env.VERCEL_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    isPreviewMode: process.env.VERCEL_ENV === 'preview' || process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV === 'development',
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(envInfo, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}