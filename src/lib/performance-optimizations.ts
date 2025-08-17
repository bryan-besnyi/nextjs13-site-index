/**
 * Advanced Performance Optimizations
 * 
 * This module provides additional optimizations to achieve sub-100ms API response times
 * including connection pooling, query optimization, and advanced caching strategies.
 */

import { prisma } from '@/lib/prisma-singleton';
import { kv } from '@vercel/kv';

// Performance targets
export const PERFORMANCE_TARGETS = {
  API_RESPONSE_TIME: 100, // ms
  CACHE_HIT_RATE: 95, // %
  DB_QUERY_TIME: 50, // ms
  CACHE_OPERATION_TIME: 10, // ms
};

// Enhanced cache configuration
export const CACHE_CONFIG = {
  // Aggressive caching for frequently accessed data
  HOT_DATA_TTL: 8 * 60 * 60, // 8 hours for popular queries
  WARM_DATA_TTL: 4 * 60 * 60, // 4 hours for normal queries
  COLD_DATA_TTL: 1 * 60 * 60, // 1 hour for rare queries
  
  // Cache warming intervals
  WARM_CACHE_INTERVAL: 30 * 60, // 30 minutes
  
  // Pre-computed aggregations TTL
  AGGREGATION_TTL: 24 * 60 * 60, // 24 hours
};

// In-memory cache for ultra-fast access
const inMemoryCache = new Map<string, {
  data: any;
  expires: number;
  hits: number;
}>();

export class PerformanceOptimizer {
  /**
   * Get data with multi-level caching strategy
   */
  static async getWithCache<T>(
    key: string,
    dataFetcher: () => Promise<T>,
    options: {
      memoryTtl?: number;
      redisTtl?: number;
      priority?: 'hot' | 'warm' | 'cold';
    } = {}
  ): Promise<T> {
    const {
      memoryTtl = 5 * 60 * 1000, // 5 minutes in memory
      redisTtl = CACHE_CONFIG.WARM_DATA_TTL,
      priority = 'warm'
    } = options;

    const now = Date.now();
    
    // Level 1: In-memory cache (fastest)
    const memCached = inMemoryCache.get(key);
    if (memCached && memCached.expires > now) {
      memCached.hits++;
      return memCached.data;
    }

    // Level 2: Redis cache
    try {
      const cached = await kv.get(key);
      if (cached) {
        // Store in memory for next time
        inMemoryCache.set(key, {
          data: cached,
          expires: now + memoryTtl,
          hits: 1
        });
        return cached as T;
      }
    } catch (error) {
      console.warn('Redis cache miss:', error);
    }

    // Level 3: Database/computation (slowest)
    const data = await dataFetcher();
    
    // Store in both caches
    try {
      await kv.set(key, data, { ex: redisTtl });
    } catch (error) {
      console.warn('Redis cache write failed:', error);
    }
    
    inMemoryCache.set(key, {
      data,
      expires: now + memoryTtl,
      hits: 1
    });

    return data;
  }

  /**
   * Optimized database query with connection reuse
   */
  static async optimizedQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    cacheKey?: string
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      let result: T;
      
      if (cacheKey) {
        result = await this.getWithCache(cacheKey, queryFn);
      } else {
        result = await queryFn();
      }
      
      const duration = performance.now() - startTime;
      
      // Log slow queries for optimization
      if (duration > PERFORMANCE_TARGETS.DB_QUERY_TIME) {
        console.warn(`🐌 Slow query "${queryName}": ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ Query failed "${queryName}" after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Pre-warm frequently accessed cache entries
   */
  static async warmCache() {
    console.log('🔥 Starting cache warming...');
    
    const warmupTasks = [
      // Warm up popular campus queries
      this.warmCampusData(),
      // Warm up common letter queries
      this.warmLetterData(),
      // Warm up aggregated statistics
      this.warmAggregations(),
    ];

    try {
      await Promise.all(warmupTasks);
      console.log('✅ Cache warming completed');
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    }
  }

  private static async warmCampusData() {
    const campuses = [
      'College of San Mateo',
      'Skyline College', 
      'Cañada College',
      'District Office'
    ];

    for (const campus of campuses) {
      const cacheKey = `api:v2:index:${campus}::`;
      
      await this.getWithCache(
        cacheKey,
        () => prisma.indexitem.findMany({
          where: { campus },
          select: {
            id: true,
            title: true,
            letter: true,
            url: true,
            campus: true
          },
          orderBy: { title: 'asc' }
        }),
        { priority: 'hot', redisTtl: CACHE_CONFIG.HOT_DATA_TTL }
      );
    }
  }

  private static async warmLetterData() {
    const popularLetters = ['A', 'B', 'C', 'D', 'S', 'M', 'P'];
    
    for (const letter of popularLetters) {
      const cacheKey = `api:v2:index::${letter}:`;
      
      await this.getWithCache(
        cacheKey,
        () => prisma.indexitem.findMany({
          where: { 
            letter: { contains: letter, mode: 'insensitive' } 
          },
          select: {
            id: true,
            title: true,
            letter: true,
            url: true,
            campus: true
          },
          orderBy: { title: 'asc' }
        }),
        { priority: 'warm', redisTtl: CACHE_CONFIG.WARM_DATA_TTL }
      );
    }
  }

  private static async warmAggregations() {
    // Campus counts
    await this.getWithCache(
      'aggregation:campus_counts',
      async () => {
        const campuses = await (prisma.indexitem as any).groupBy({
          by: ['campus'],
          _count: { campus: true }
        });
        return campuses;
      },
      { priority: 'hot', redisTtl: CACHE_CONFIG.AGGREGATION_TTL }
    );

    // Total items count
    await this.getWithCache(
      'aggregation:total_items',
      () => prisma.indexitem.count(),
      { priority: 'hot', redisTtl: CACHE_CONFIG.AGGREGATION_TTL }
    );
  }

  /**
   * Cleanup old in-memory cache entries
   */
  static cleanupMemoryCache() {
    const now = Date.now();
    let cleaned = 0;
    
    Array.from(inMemoryCache.entries()).forEach(([key, entry]) => {
      if (entry.expires <= now) {
        inMemoryCache.delete(key);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    const memEntries = Array.from(inMemoryCache.values());
    const totalHits = memEntries.reduce((sum, entry) => sum + entry.hits, 0);
    const avgHits = memEntries.length > 0 ? totalHits / memEntries.length : 0;
    
    return {
      inMemoryEntries: inMemoryCache.size,
      totalHits,
      averageHitsPerEntry: avgHits,
      memoryUsage: process.memoryUsage(),
    };
  }
}

/**
 * Database query optimizations
 */
export class QueryOptimizer {
  /**
   * Get optimized index items with smart field selection
   */
  static async getIndexItems(filters: {
    campus?: string;
    letter?: string;
    search?: string;
    includeCreatedAt?: boolean;
  }) {
    const { campus, letter, search, includeCreatedAt = false } = filters;
    
    // Build where conditions
    const whereConditions: any = {};
    if (campus) whereConditions.campus = campus;
    if (letter) whereConditions.letter = letter; // Exact match for letter
    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Optimized field selection based on use case
    const selectFields: any = {
      id: true,
      title: true,
      letter: true,
      url: true,
      campus: true
    };
    
    if (includeCreatedAt) {
      selectFields.createdAt = true;
    }

    return await PerformanceOptimizer.optimizedQuery(
      'getIndexItems',
      () => prisma.indexitem.findMany({
        where: whereConditions,
        select: selectFields,
        orderBy: { title: 'asc' },
        // Add limit to prevent large result sets
        take: 10000,
      }),
      `query:index:${JSON.stringify(filters)}`
    );
  }

  /**
   * Get aggregated statistics with caching
   */
  static async getStats() {
    return await PerformanceOptimizer.getWithCache(
      'stats:dashboard',
      async () => {
        const [
          totalItems,
          campusCounts,
          recentItems
        ] = await Promise.all([
          prisma.indexitem.count(),
          (prisma.indexitem as any).groupBy({
            by: ['campus'],
            _count: { campus: true }
          }),
          prisma.indexitem.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
              }
            }
          })
        ]);

        return {
          totalItems,
          campusCounts,
          recentItems,
          lastUpdated: new Date().toISOString()
        };
      },
      { 
        priority: 'hot', 
        redisTtl: CACHE_CONFIG.AGGREGATION_TTL,
        memoryTtl: 10 * 60 * 1000 // 10 minutes in memory
      }
    );
  }
}

// Auto-cleanup memory cache every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    PerformanceOptimizer.cleanupMemoryCache();
  }, 5 * 60 * 1000);
}

// Classes are already exported above with 'export class'