import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/options';
import { CacheWarmer } from '@/lib/cache-warmer';

export async function POST(request: NextRequest) {
  try {
    // Authentication check - admin only
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Start cache warming (non-blocking)
    CacheWarmer.warmAllCaches().catch(error => {
      console.error('Cache warming error:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Cache warming started',
      status: CacheWarmer.getStatus()
    });

  } catch (error) {
    console.error('Cache warm API error:', error);
    return NextResponse.json(
      { error: 'Failed to start cache warming' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      status: CacheWarmer.getStatus()
    });

  } catch (error) {
    console.error('Cache status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get cache status' },
      { status: 500 }
    );
  }
}