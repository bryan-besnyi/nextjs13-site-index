/**
 * Cache Warming Strategy
 * Pre-loads all common campus and letter combinations
 */

import { prisma } from '@/lib/prisma-singleton';
import { fastCache, getCacheKey } from '@/lib/fast-cache';

// All possible campuses
const CAMPUSES = [
  'College of San Mateo',
  'Skyline College',
  'Cañada College',
  'District Office'
];

// All possible letters (A-Z plus common numbers)
const LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
];

export class CacheWarmer {
  private static isWarming = false;
  
  /**
   * Warm all caches on startup
   */
  static async warmAllCaches() {
    if (this.isWarming) {
      console.log('⏳ Cache warming already in progress');
      return;
    }
    
    this.isWarming = true;
    const startTime = Date.now();
    console.log('🔥 Starting comprehensive cache warming...');
    
    try {
      // Warm up all combinations in parallel batches
      const warmupTasks: Promise<void>[] = [];
      
      // 1. Warm up campus-only queries (4 queries)
      for (const campus of CAMPUSES) {
        warmupTasks.push(this.warmCampusQuery(campus));
      }
      
      // 2. Warm up letter-only queries (36 queries)
      for (const letter of LETTERS) {
        warmupTasks.push(this.warmLetterQuery(letter));
      }
      
      // 3. Warm up campus+letter combinations (4 × 36 = 144 queries)
      for (const campus of CAMPUSES) {
        for (const letter of LETTERS) {
          warmupTasks.push(this.warmCampusLetterQuery(campus, letter));
        }
      }
      
      // Execute in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < warmupTasks.length; i += batchSize) {
        const batch = warmupTasks.slice(i, i + batchSize);
        await Promise.all(batch);
        
        // Small delay between batches
        if (i + batchSize < warmupTasks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      const duration = Date.now() - startTime;
      const stats = fastCache.getStats();
      console.log(`✅ Cache warming completed in ${duration}ms`);
      console.log(`📊 Cache stats: ${stats.size} entries, ${stats.totalHits} total hits`);
      
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    } finally {
      this.isWarming = false;
    }
  }
  
  /**
   * Warm a single campus query
   */
  private static async warmCampusQuery(campus: string): Promise<void> {
    try {
      const cacheKey = getCacheKey('fast:index', { campus });
      
      // Check if already cached
      if (fastCache.get(cacheKey)) {
        return;
      }
      
      const items = await prisma.indexitem.findMany({
        where: { campus },
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true
        },
        orderBy: { title: 'asc' }
      });
      
      fastCache.set(cacheKey, items, 30 * 60 * 1000); // 30 minutes
    } catch (error) {
      console.warn(`Failed to warm campus ${campus}:`, error);
    }
  }
  
  /**
   * Warm a single letter query
   */
  private static async warmLetterQuery(letter: string): Promise<void> {
    try {
      const cacheKey = getCacheKey('fast:index', { letter });
      
      // Check if already cached
      if (fastCache.get(cacheKey)) {
        return;
      }
      
      const items = await prisma.indexitem.findMany({
        where: { letter },
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true
        },
        orderBy: { title: 'asc' }
      });
      
      fastCache.set(cacheKey, items, 30 * 60 * 1000); // 30 minutes
    } catch (error) {
      console.warn(`Failed to warm letter ${letter}:`, error);
    }
  }
  
  /**
   * Warm a campus+letter combination
   */
  private static async warmCampusLetterQuery(campus: string, letter: string): Promise<void> {
    try {
      const cacheKey = getCacheKey('fast:index', { campus, letter });
      
      // Check if already cached
      if (fastCache.get(cacheKey)) {
        return;
      }
      
      const items = await prisma.indexitem.findMany({
        where: { campus, letter },
        select: {
          id: true,
          title: true,
          letter: true,
          url: true,
          campus: true
        },
        orderBy: { title: 'asc' }
      });
      
      // Only cache if there are results
      if (items.length > 0) {
        fastCache.set(cacheKey, items, 30 * 60 * 1000); // 30 minutes
      }
    } catch (error) {
      console.warn(`Failed to warm ${campus}/${letter}:`, error);
    }
  }
  
  /**
   * Get cache warming status
   */
  static getStatus() {
    return {
      isWarming: this.isWarming,
      possibleCombinations: {
        campusOnly: CAMPUSES.length,
        letterOnly: LETTERS.length,
        campusLetter: CAMPUSES.length * LETTERS.length,
        total: CAMPUSES.length + LETTERS.length + (CAMPUSES.length * LETTERS.length)
      },
      cacheStats: fastCache.getStats()
    };
  }
}