import { kv } from '@vercel/kv';
import { dangerouslyDeleteByTag } from '@vercel/functions';
import { prisma } from './prisma';

/** CDN cache tag on /api/indexItems responses; purged together with KV. */
export const CACHE_TAG = 'index';
const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days; writes purge + re-warm, TTL is a safety net
const KEYS_SET = 'index:_keys'; // Redis Set of live keys, avoids kv.keys() SCAN

export type IndexItem = {
  id: string;
  title: string;
  letter: string;
  url: string;
  campus: string;
};

type Query = { campus: string; letter: string; search: string };

const keyFor = (q: Query) => `index:${JSON.stringify([q.campus, q.letter, q.search])}`;
const queryFor = (key: string): Query => {
  const [campus, letter, search] = JSON.parse(key.slice('index:'.length));
  return { campus, letter, search };
};

/** Cached read. Inputs must already be normalized (letter upper-cased, search trimmed). */
export async function getIndexItems(q: Query): Promise<IndexItem[]> {
  const key = keyFor(q);
  const cached = await kv.get<IndexItem[]>(key);
  if (Array.isArray(cached)) return cached;

  const items = await prisma.indexitem.findMany({
    where: {
      ...(q.campus && { campus: q.campus }),
      ...(q.letter && { letter: q.letter }),
      ...(q.search && { title: { contains: q.search, mode: 'insensitive' } })
    },
    orderBy: { title: 'asc' },
    select: { id: true, title: true, letter: true, url: true, campus: true }
  });

  await Promise.all([
    kv.set(key, items, { ex: CACHE_TTL }),
    kv.sadd(KEYS_SET, key)
  ]);
  return items;
}

/**
 * Call after any write. Purges KV and the CDN (by tag), then re-warms every
 * campus/letter key that was live so the next public request is a hit and
 * Neon is not woken again later. Search keys are purged but not re-warmed.
 */
export async function invalidateCache() {
  const keys = (await kv.smembers<string[]>(KEYS_SET)) ?? [];
  await kv.del(KEYS_SET, ...keys);

  // Hard delete, not stale-while-revalidate: admin expects to see their own write.
  // Throws outside the Vercel runtime (local dev), so never fail the write on it.
  await dangerouslyDeleteByTag(CACHE_TAG).catch((err) =>
    console.error('CDN purge failed:', err)
  );

  // ponytail: warms whatever was live; if the key set ever grows large, cap this list.
  const toWarm = keys.map(queryFor).filter((q) => !q.search);
  await Promise.all(toWarm.map(getIndexItems));
}
