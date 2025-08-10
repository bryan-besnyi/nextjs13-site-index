import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { kv } from '@vercel/kv';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Additional protection: only allow cache invalidation in development or for specific admin users
    if (process.env.NODE_ENV === 'production') {
      // In production, you might want additional role-based checks
      // For now, we allow all authenticated users but log the action
      console.log(`Cache invalidation requested by: ${session.user.email}`);
    }

    const body = await request.json();
    const { key, keys, pattern } = body;

    // Single key invalidation
    if (key) {
      await kv.del(key);
      return NextResponse.json({ 
        success: true, 
        message: 'Cache key invalidated',
        invalidated: 1
      });
    }

    // Multiple keys invalidation
    if (keys && Array.isArray(keys)) {
      if (keys.length > 0) {
        await kv.del(...keys);
      }
      return NextResponse.json({ 
        success: true, 
        message: `${keys.length} cache entries invalidated`,
        invalidated: keys.length
      });
    }

    // Pattern-based invalidation
    if (pattern) {
      // Convert pattern to regex (simple glob to regex conversion)
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]');
      
      const regex = new RegExp(`^${regexPattern}$`);
      
      // Get all keys and filter by pattern
      const allKeys = await kv.keys('*');
      const matchingKeys = allKeys.filter(k => regex.test(k));
      
      if (matchingKeys.length > 0) {
        await kv.del(...matchingKeys);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `${matchingKeys.length} cache entries invalidated`,
        invalidated: matchingKeys.length
      });
    }

    return NextResponse.json(
      { error: 'No invalidation criteria provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    );
  }
}