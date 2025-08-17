import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    // Generate and set CSRF token
    const tokenData = await CSRFProtection.getTokenForClient();
    
    return NextResponse.json({
      token: tokenData.token,
      headerName: tokenData.headerName,
      fieldName: tokenData.fieldName,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Same as GET - allows for flexibility in client implementation
  return GET(request);
}