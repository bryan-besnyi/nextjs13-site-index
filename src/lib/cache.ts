import { kv } from '@vercel/kv';
import prisma from './prisma';

const CACHE_TTL = 60 * 60; // 1 hour, matches route.ts

const CAMPUSES = [
  'College of San Mateo',
  'Cañada College',
  'District Office',
  'Skyline College',
];

/**
 * Purge all index:* KV keys, then warm cache for each campus.
 * Call revalidatePath() separately in the calling server action for ISR.
 */
export async function purgeAndWarmCache() {
  // 1. Flush all index:* keys
  const keys = await kv.keys('index:*');
  if (keys.length > 0) {
    await kv.del(...keys);
  }

  // 2. Warm: query each campus and cache the result
  await Promise.all(
    CAMPUSES.map(async (campus) => {
      const items = await prisma.indexitem.findMany({
        where: { campus },
        select: { id: true, title: true, url: true, letter: true, campus: true },
        orderBy: { title: 'asc' },
      });
      const cacheKey = `index:${campus}::`;
      await kv.set(cacheKey, JSON.stringify(items), { ex: CACHE_TTL });
    })
  );
}
