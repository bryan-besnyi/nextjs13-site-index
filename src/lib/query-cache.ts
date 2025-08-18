/**
 * Optimized Query Caching System
 * 
 * Provides aggressive caching for expensive database operations,
 * particularly count queries that are causing performance issues.
 */

import { kv } from '@vercel/kv';
import { prisma } from '@/lib/prisma-singleton';

// Cache TTL configurations
const CACHE_TTL = {
  // Count queries - cache aggressively since they change infrequently
  TOTAL_ITEMS: 30 * 60, // 30 minutes
  CAMPUS_COUNTS: 30 * 60, // 30 minutes
  RECENT_ITEMS: 5 * 60, // 5 minutes (more dynamic)
  HEALTH_CHECK: 5 * 60, // 5 minutes
  
  // Dashboard aggregations
  DASHBOARD_STATS: 15 * 60, // 15 minutes
  
  // Performance metrics
  PERFORMANCE_STATS: 2 * 60, // 2 minutes
};

// Cache keys
const CACHE_KEYS = {
  TOTAL_ITEMS: 'cache:count:total_items',
  CAMPUS_COUNTS: 'cache:count:campus_counts',
  RECENT_ITEMS: 'cache:count:recent_items',
  DASHBOARD_STATS: 'cache:dashboard:stats',
  HEALTH_RECORD_COUNT: 'health:record_count',
};

export class QueryCache {
  /**
   * Get total items count with caching
   */
  static async getTotalItemsCount(): Promise<number> {
    try {
      const cached = await kv.get(CACHE_KEYS.TOTAL_ITEMS);
      if (cached && typeof cached === 'number') {
        return cached;
      }
    } catch (error) {
      console.warn('Cache read failed for total items count:', error);
    }

    // Cache miss - query database
    const count = await prisma.indexitem.count();
    
    // Cache the result
    try {
      await kv.set(CACHE_KEYS.TOTAL_ITEMS, count, { ex: CACHE_TTL.TOTAL_ITEMS });
    } catch (error) {
      console.warn('Cache write failed for total items count:', error);
    }

    return count;
  }

  /**
   * Get items count by campus with caching
   */
  static async getCampusItemsCounts(): Promise<Array<{ campus: string; _count: { campus: number } }>> {
    try {
      const cached = await kv.get(CACHE_KEYS.CAMPUS_COUNTS);
      if (cached && Array.isArray(cached)) {
        return cached;
      }
    } catch (error) {
      console.warn('Cache read failed for campus counts:', error);
    }

    // Cache miss - query database
    const campuses = ['Cañada College', 'College of San Mateo', 'Skyline College', 'District Office'];
    const counts = await Promise.all(
      campuses.map(async (campus) => ({
        campus,
        _count: { campus: await prisma.indexitem.count({ where: { campus } }) }
      }))
    );

    // Cache the result
    try {
      await kv.set(CACHE_KEYS.CAMPUS_COUNTS, counts, { ex: CACHE_TTL.CAMPUS_COUNTS });
    } catch (error) {
      console.warn('Cache write failed for campus counts:', error);
    }

    return counts;
  }

  /**
   * Get recent items count (last 7 days) with caching
   */
  static async getRecentItemsCount(): Promise<number> {
    try {
      const cached = await kv.get(CACHE_KEYS.RECENT_ITEMS);
      if (cached && typeof cached === 'number') {
        return cached;
      }
    } catch (error) {
      console.warn('Cache read failed for recent items count:', error);
    }

    // Cache miss - query database
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const count = await prisma.indexitem.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    // Cache the result
    try {
      await kv.set(CACHE_KEYS.RECENT_ITEMS, count, { ex: CACHE_TTL.RECENT_ITEMS });
    } catch (error) {
      console.warn('Cache write failed for recent items count:', error);
    }

    return count;
  }

  /**
   * Get optimized dashboard statistics with aggressive caching
   */
  static async getDashboardStats(): Promise<{
    totalItems: number;
    campusCounts: Array<{ campus: string; _count: { campus: number } }>;
    recentItems: number;
    lastUpdated: string;
  }> {
    try {
      const cached = await kv.get(CACHE_KEYS.DASHBOARD_STATS);
      if (cached && typeof cached === 'object' && cached !== null) {
        return cached as {
          totalItems: number;
          campusCounts: Array<{ campus: string; _count: { campus: number } }>;
          recentItems: number;
          lastUpdated: string;
        };
      }
    } catch (error) {
      console.warn('Cache read failed for dashboard stats:', error);
    }

    // Cache miss - compute stats
    const [totalItems, campusCounts, recentItems] = await Promise.all([
      this.getTotalItemsCount(),
      this.getCampusItemsCounts(),
      this.getRecentItemsCount()
    ]);

    const stats = {
      totalItems,
      campusCounts,
      recentItems,
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    try {
      await kv.set(CACHE_KEYS.DASHBOARD_STATS, stats, { ex: CACHE_TTL.DASHBOARD_STATS });
    } catch (error) {
      console.warn('Cache write failed for dashboard stats:', error);
    }

    return stats;
  }

  /**
   * Optimized count query for health checks
   */
  static async getHealthCheckCount(): Promise<number> {
    try {
      const cached = await kv.get(CACHE_KEYS.HEALTH_RECORD_COUNT);
      if (cached && typeof cached === 'number') {
        return cached;
      }
    } catch (error) {
      console.warn('Cache read failed for health check count:', error);
    }

    // Cache miss - query database
    const count = await prisma.indexitem.count();
    
    // Cache the result
    try {
      await kv.set(CACHE_KEYS.HEALTH_RECORD_COUNT, count, { ex: CACHE_TTL.HEALTH_CHECK });
    } catch (error) {
      console.warn('Cache write failed for health check count:', error);
    }

    return count;
  }

  /**
   * Invalidate all count-related caches
   * Call this when items are added/deleted
   */
  static async invalidateCountCaches(): Promise<void> {
    const keys = [
      CACHE_KEYS.TOTAL_ITEMS,
      CACHE_KEYS.CAMPUS_COUNTS,
      CACHE_KEYS.RECENT_ITEMS,
      CACHE_KEYS.DASHBOARD_STATS,
      CACHE_KEYS.HEALTH_RECORD_COUNT,
    ];

    await Promise.all(
      keys.map(key => 
        kv.del(key).catch(error => 
          console.warn(`Failed to invalidate cache key ${key}:`, error)
        )
      )
    );
  }

  /**
   * Warm up critical caches
   */
  static async warmUpCaches(): Promise<void> {
    try {
      console.log('🔥 Warming up count caches...');
      
      // Warm up in parallel
      await Promise.all([
        this.getTotalItemsCount(),
        this.getCampusItemsCounts(),
        this.getRecentItemsCount()
      ]);
      
      console.log('✅ Count caches warmed up successfully');
    } catch (error) {
      console.error('❌ Failed to warm up caches:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalItems: { cached: boolean; age?: number };
    campusCounts: { cached: boolean; age?: number };
    recentItems: { cached: boolean; age?: number };
  }> {
    const stats = {
      totalItems: { cached: false },
      campusCounts: { cached: false },
      recentItems: { cached: false }
    };

    try {
      const [totalItemsCache, campusCountsCache, recentItemsCache] = await Promise.all([
        kv.get(CACHE_KEYS.TOTAL_ITEMS),
        kv.get(CACHE_KEYS.CAMPUS_COUNTS),
        kv.get(CACHE_KEYS.RECENT_ITEMS)
      ]);

      stats.totalItems.cached = totalItemsCache !== null;
      stats.campusCounts.cached = campusCountsCache !== null;
      stats.recentItems.cached = recentItemsCache !== null;
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }

    return stats;
  }
}

// Auto-warm caches on server start (in production environments)
if (process.env.NODE_ENV === 'production') {
  // Warm caches after a short delay to allow server initialization
  setTimeout(() => {
    QueryCache.warmUpCaches().catch(console.error);
  }, 5000);
}