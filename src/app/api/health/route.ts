import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Warm up the database connection with a simple query
    const count = await prisma.indexitem.count();

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      itemCount: count
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Database connection failed' },
      { status: 500 }
    );
  }
}
