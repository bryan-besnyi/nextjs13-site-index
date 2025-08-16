'use server';
import { prisma } from './prisma-singleton';
import { kv } from '@vercel/kv';
import { PerformanceCollector } from './performance-collector';
import { withRetry, CircuitBreaker } from './retry-utils';

// Cache configuration
const CACHE_TTL = 3600; // 1 hour in seconds
const CACHE_PREFIX = 'indexItems:';

// Circuit breakers for critical operations
const dbCircuitBreaker = new CircuitBreaker(5, 60000, 30000); // 5 failures, 1min timeout, 30s reset
const cacheCircuitBreaker = new CircuitBreaker(3, 30000, 15000); // 3 failures, 30s timeout, 15s reset

/**
 * Get all index items with caching
 */
export async function getAllIndexItems() {
  const cacheKey = `${CACHE_PREFIX}all`;
  
  try {
    // Try cache first with retry and circuit breaker
    const cacheResult = await cacheCircuitBreaker.execute(async () => 
      await withRetry(async () => 
        await PerformanceCollector.measureCacheOperation(
          async () => await kv.get(cacheKey),
          'get'
        )
      )
    );
    
    if (cacheResult.hit && cacheResult.result) {
      console.log('✅ Cache hit for all items');
      await trackCacheMetric('hit');
      return { indexItems: cacheResult.result, cacheHit: true };
    }
    
    // Cache miss - fetch from database with retry and circuit breaker
    console.log('❌ Cache miss for all items');
    await trackCacheMetric('miss');
    const dbResult = await dbCircuitBreaker.execute(async () =>
      await withRetry(async () =>
        await PerformanceCollector.measureDbOperation(
          async () => await prisma.indexitem.findMany({
            select: {
              id: true,
              title: true,
              url: true,
              letter: true,
              campus: true
            },
            orderBy: [
              { letter: 'asc' },
              { title: 'asc' }
            ]
          }),
          'getAllIndexItems'
        )
      )
    );
    
    // Store in cache with retry
    try {
      await withRetry(async () =>
        await PerformanceCollector.measureCacheOperation(
          async () => await kv.set(cacheKey, dbResult.result, { ex: CACHE_TTL }),
          'set'
        )
      );
    } catch (cacheError) {
      // Cache write failure shouldn't break the request
      console.warn('Failed to cache result:', cacheError);
    }
    
    return { indexItems: dbResult.result, cacheHit: false, queryTime: dbResult.queryTime };
  } catch (error) {
    console.error('Error in getAllIndexItems:', error);
    return { error };
  }
}

/**
 * Get items by letter with caching
 */
export async function getItemsByLetter(letter: string) {
  const cacheKey = `${CACHE_PREFIX}letter:${letter}`;
  
  try {
    // Try cache first
    const cached = await kv.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit for letter ${letter}`);
      return { items: cached, cacheHit: true };
    }
    
    // Cache miss
    console.log(`❌ Cache miss for letter ${letter}`);
    const items = await prisma.indexitem.findMany({
      where: { letter },
      select: {
        id: true,
        title: true,
        url: true,
        letter: true,
        campus: true
      },
      orderBy: { title: 'asc' }
    });
    
    // Store in cache
    await kv.set(cacheKey, items, { ex: CACHE_TTL });
    
    return { items, cacheHit: false };
  } catch (error) {
    console.error(`Error fetching items for letter ${letter}:`, error);
    return { error };
  }
}

/**
 * Get items by campus with caching
 */
export async function getItemsByCampus(campus: string) {
  const cacheKey = `${CACHE_PREFIX}campus:${campus}`;
  
  try {
    // Try cache first
    const cached = await kv.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit for campus ${campus}`);
      return { items: cached, cacheHit: true };
    }
    
    // Cache miss
    console.log(`❌ Cache miss for campus ${campus}`);
    const items = await prisma.indexitem.findMany({
      where: { campus },
      select: {
        id: true,
        title: true,
        url: true,
        letter: true,
        campus: true
      },
      orderBy: [
        { letter: 'asc' },
        { title: 'asc' }
      ]
    });
    
    // Store in cache
    await kv.set(cacheKey, items, { ex: CACHE_TTL });
    
    return { items, cacheHit: false };
  } catch (error) {
    console.error(`Error fetching items for campus ${campus}:`, error);
    return { error };
  }
}

/**
 * Search items with caching for common queries
 */
export async function searchItems(query: string, campus?: string) {
  const cacheKey = `${CACHE_PREFIX}search:${query.toLowerCase()}:${campus || 'all'}`;
  
  try {
    // Only cache common/short queries
    if (query.length <= 20) {
      const cached = await kv.get(cacheKey);
      if (cached) {
        console.log(`✅ Cache hit for search "${query}"`);
        return { results: cached, cacheHit: true };
      }
    }
    
    // Cache miss or uncacheable query
    console.log(`❌ Cache miss for search "${query}"`);
    const conditions: any = {
      title: {
        contains: query,
        mode: 'insensitive'
      }
    };
    
    if (campus) {
      conditions.campus = campus;
    }
    
    const results = await prisma.indexitem.findMany({
      where: conditions,
      select: {
        id: true,
        title: true,
        url: true,
        letter: true,
        campus: true
      },
      orderBy: [
        { letter: 'asc' },
        { title: 'asc' }
      ]
    });
    
    // Cache if it's a common query
    if (query.length <= 20) {
      await kv.set(cacheKey, results, { ex: CACHE_TTL });
    }
    
    return { results, cacheHit: false };
  } catch (error) {
    console.error(`Error searching for "${query}":`, error);
    return { error };
  }
}

/**
 * Create item and invalidate caches
 */
export async function createIndexItem(
  title: string,
  url: string,
  letter: string,
  campus: string
) {
  try {
    const newItem = await prisma.indexitem.create({
      data: { title, url, letter, campus }
    });
    
    // Invalidate relevant caches
    await invalidateCaches(letter, campus);
    
    return { newIndexItem: newItem };
  } catch (error) {
    console.error('Error creating index item:', error);
    return { error };
  }
}

/**
 * Update item and invalidate caches
 */
export async function updateIndexItem(
  id: number,
  title: string,
  url: string,
  letter: string,
  campus: string
) {
  try {
    // Get old item to know which caches to invalidate
    const oldItem = await prisma.indexitem.findUnique({
      where: { id },
      select: { letter: true, campus: true }
    });
    
    const updatedItem = await prisma.indexitem.update({
      where: { id },
      data: { title, url, letter, campus }
    });
    
    // Invalidate caches for both old and new values
    if (oldItem) {
      await invalidateCaches(oldItem.letter, oldItem.campus);
    }
    await invalidateCaches(letter, campus);
    
    return { updatedItem };
  } catch (error) {
    console.error('Error updating index item:', error);
    return { error };
  }
}

/**
 * Partially update item and invalidate caches
 */
export async function updateIndexItemPartial(
  id: number,
  data: {
    title?: string;
    url?: string;
    letter?: string;
    campus?: string;
  }
) {
  try {
    // Get old item to know which caches to invalidate
    const oldItem = await prisma.indexitem.findUnique({
      where: { id },
      select: { letter: true, campus: true }
    });
    
    if (!oldItem) {
      return { error: 'Item not found' };
    }
    
    const updatedItem = await prisma.indexitem.update({
      where: { id },
      data
    });
    
    // Invalidate caches for both old and new values
    await invalidateCaches(oldItem.letter, oldItem.campus);
    if (data.letter || data.campus) {
      await invalidateCaches(
        data.letter || oldItem.letter,
        data.campus || oldItem.campus
      );
    }
    
    return { updatedItem };
  } catch (error) {
    console.error('Error partially updating index item:', error);
    return { error };
  }
}

/**
 * Delete item and invalidate caches
 */
export async function deleteIndexItem(id: number) {
  try {
    const deletedItem = await prisma.indexitem.delete({
      where: { id }
    });
    
    // Invalidate relevant caches
    await invalidateCaches(deletedItem.letter, deletedItem.campus);
    
    return { deletedItem };
  } catch (error) {
    console.error('Error deleting index item:', error);
    return { error };
  }
}

/**
 * Invalidate relevant caches
 */
async function invalidateCaches(letter: string, campus: string) {
  const keysToDelete = [
    `${CACHE_PREFIX}all`,
    `${CACHE_PREFIX}letter:${letter}`,
    `${CACHE_PREFIX}campus:${campus}`,
  ];
  
  // Also invalidate search caches that might contain this item
  const searchKeys = await kv.keys(`${CACHE_PREFIX}search:*`);
  keysToDelete.push(...searchKeys);
  
  // Delete all keys in parallel
  await Promise.all(keysToDelete.map(key => kv.del(key)));
  
  console.log(`🗑️ Invalidated ${keysToDelete.length} cache keys`);
}

/**
 * Warm up cache with common queries
 */
export async function warmCache() {
  console.log('🔥 Warming up cache...');
  
  try {
    // Warm up main queries
    await getAllIndexItems();
    
    // Warm up letter queries (common letters)
    const commonLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'L', 'P', 'S'];
    await Promise.all(commonLetters.map(letter => getItemsByLetter(letter)));
    
    // Warm up campus queries
    const campuses = [
      'College of San Mateo',
      'Skyline College',
      'Cañada College',
      'District Office'
    ];
    await Promise.all(campuses.map(campus => getItemsByCampus(campus)));
    
    // Warm up common searches
    const commonSearches = ['financial aid', 'library', 'admissions', 'registration'];
    await Promise.all(commonSearches.map(query => searchItems(query)));
    
    console.log('✅ Cache warmed up successfully');
    return { success: true };
  } catch (error) {
    console.error('Error warming cache:', error);
    return { error };
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const allKeys = await kv.keys(`${CACHE_PREFIX}*`);
    
    // Get hit/miss stats from performance metrics
    const dateKey = new Date().toISOString().split('T')[0];
    const hits = await kv.hget('cache:stats:hits', dateKey) || 0;
    const misses = await kv.hget('cache:stats:misses', dateKey) || 0;
    
    const totalHits = Number(hits);
    const totalMisses = Number(misses);
    const totalRequests = totalHits + totalMisses;
    
    const stats = {
      totalKeys: allKeys.length,
      totalRequests,
      cachedRequests: totalHits,
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
      byType: {
        all: 0,
        letter: 0,
        campus: 0,
        search: 0
      }
    };
    
    allKeys.forEach(key => {
      if (key.includes(':letter:')) stats.byType.letter++;
      else if (key.includes(':campus:')) stats.byType.campus++;
      else if (key.includes(':search:')) stats.byType.search++;
      else if (key === `${CACHE_PREFIX}all`) stats.byType.all++;
    });
    
    return { stats };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { error };
  }
}

/**
 * Track cache hit/miss for statistics
 */
async function trackCacheMetric(type: 'hit' | 'miss') {
  try {
    const dateKey = new Date().toISOString().split('T')[0];
    await kv.hincrby(`cache:stats:${type}s`, dateKey, 1);
    
    // Expire after 30 days
    await kv.expire(`cache:stats:${type}s`, 30 * 24 * 60 * 60);
  } catch (error) {
    // Don't throw - metrics shouldn't break the app
    console.warn('Failed to track cache metric:', error);
  }
}