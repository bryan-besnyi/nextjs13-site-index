import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { kv } from '@vercel/kv';

// Helper to format bytes to human readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper to estimate size of a value
function estimateSize(value: any): number {
  return new Blob([JSON.stringify(value)]).size;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all cache keys
    const keys = await kv.keys('*');
    
    // Get cache statistics
    const hits = Number(await kv.get('cache:stats:hits')) || 0;
    const misses = Number(await kv.get('cache:stats:misses')) || 0;
    const totalRequests = hits + misses;
    
    // Calculate rates
    const hitRate = totalRequests > 0 ? hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? misses / totalRequests : 0;

    // Get cache entries with details (optimized with batch operations)
    const entries = [];
    let totalSize = 0;
    
    // Limit to first 50 keys for better performance (reduced from 100)
    const keysToShow = keys.slice(0, 50);
    
    try {
      // Batch fetch values and TTLs
      const [values, ttls] = await Promise.all([
        Promise.allSettled(keysToShow.map(key => kv.get(key))),
        Promise.allSettled(keysToShow.map(key => kv.ttl(key)))
      ]);
      
      for (let i = 0; i < keysToShow.length; i++) {
        const key = keysToShow[i];
        const valueResult = values[i];
        const ttlResult = ttls[i];
        
        if (valueResult.status === 'fulfilled' && ttlResult.status === 'fulfilled') {
          const value = valueResult.value;
          const ttl = ttlResult.value;
          const size = estimateSize(value);
          totalSize += size;
          
          entries.push({
            key,
            value: JSON.stringify(value).substring(0, 100) + '...',
            ttl: ttl || -1,
            size: formatBytes(size)
          });
        }
      }
    } catch (err) {
      console.error('Error fetching cache entries:', err);
    }

    // Get eviction count (mock for now, as Vercel KV doesn't expose this)
    const evictions = Number(await kv.get('cache:stats:evictions')) || 0;

    const stats = {
      totalKeys: keys.length,
      memoryUsage: formatBytes(totalSize),
      hitRate,
      missRate,
      evictions
    };

    return NextResponse.json({
      stats,
      entries: entries.sort((a, b) => a.key.localeCompare(b.key))
    });
  } catch (error) {
    console.error('Cache API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cache data' },
      { status: 500 }
    );
  }
}