import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// No DB query here: any connection wakes Neon compute and defeats scale-to-zero.
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
