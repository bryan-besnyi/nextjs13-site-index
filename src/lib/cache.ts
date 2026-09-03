import { kv } from '@vercel/kv';

/**
 * Invalidate all tracked index cache keys.
 * Uses a Redis Set ('index:_keys') to track known cache keys instead of
 * kv.keys('index:*') which is an O(N) SCAN over the entire keyspace.
 *
 * Cache warming is intentionally skipped — the next GET request will
 * populate the cache on-demand (~10-50ms penalty on one request).
 *
 * Call revalidatePath() separately in the calling server action for ISR.
 */
export async function invalidateCache() {
  const keys = await kv.smembers<string[]>('index:_keys');
  if (keys && keys.length > 0) {
    await kv.del(...keys, 'index:_keys');
  } else {
    await kv.del('index:_keys');
  }
}
