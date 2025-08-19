/**
 * Ultra-fast in-memory cache for development and production
 * 
 * This replaces slow Redis/KV operations with immediate memory access
 * for the most common query patterns (campus and campus+letter)
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
  hits: number;
}

class FastCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 500; // ~184 combinations + buffer for searches
  private defaultTTL = 30 * 60 * 1000; // 30 minutes for better persistence
  
  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check expiration
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    // Update hit count
    entry.hits++;
    
    return entry.data as T;
  }
  
  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    // Implement simple LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      // Find and remove least recently used item
      let lruKey: string | null = null;
      let minHits = Infinity;
      
      this.cache.forEach((entry, k) => {
        if (entry.hits < minHits) {
          minHits = entry.hits;
          lruKey = k;
        }
      });
      
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }
    
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlMs || this.defaultTTL),
      hits: 0
    });
  }
  
  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.entries());
    const totalHits = entries.reduce((sum, [_, entry]) => sum + entry.hits, 0);
    
    return {
      size: this.cache.size,
      totalHits,
      entries: entries.map(([key, entry]) => ({
        key,
        hits: entry.hits,
        expiresIn: Math.max(0, entry.expires - Date.now())
      })).sort((a, b) => b.hits - a.hits).slice(0, 10) // Top 10 most hit
    };
  }
  
  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): number {
    let deleted = 0;
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deleted++;
      }
    });
    
    return deleted;
  }
}

// Singleton instance
export const fastCache = new FastCache();

// Helper to generate consistent cache keys
export function getCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedKeys = Object.keys(params).sort();
  const parts = sortedKeys
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => `${key}:${params[key]}`);
  
  return `${prefix}:${parts.join('|')}`;
}