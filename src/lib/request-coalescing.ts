/**
 * Request Coalescing for Identical Concurrent Requests
 * 
 * This module prevents duplicate database queries when multiple identical
 * requests arrive at the same time, improving performance and reducing load.
 */

// Map to store in-flight requests
const requestMap = new Map<string, Promise<any>>();

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60000; // 1 minute
const MAX_AGE = 5000; // 5 seconds

interface CoalescedRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

const timestampedRequestMap = new Map<string, CoalescedRequest<any>>();

/**
 * Coalesce identical requests into a single promise
 * 
 * @param key - Unique key for the request (should include all parameters)
 * @param queryFn - Function that performs the actual query
 * @returns Promise that resolves to the query result
 */
export async function coalescedQuery<T>(
  key: string, 
  queryFn: () => Promise<T>
): Promise<T> {
  // Check if we have an existing request
  const existing = timestampedRequestMap.get(key);
  
  if (existing && (Date.now() - existing.timestamp) < MAX_AGE) {
    console.log(`[Coalescing] Reusing existing request for key: ${key}`);
    return existing.promise;
  }

  // Create new request
  console.log(`[Coalescing] Creating new request for key: ${key}`);
  const promise = queryFn()
    .finally(() => {
      // Clean up after a short delay to handle rapid successive requests
      setTimeout(() => {
        timestampedRequestMap.delete(key);
      }, 100);
    });
  
  timestampedRequestMap.set(key, {
    promise,
    timestamp: Date.now()
  });
  
  return promise;
}

/**
 * Generate a cache key from request parameters
 */
export function generateRequestKey(params: Record<string, any>): string {
  // Sort keys for consistent ordering
  const sortedKeys = Object.keys(params).sort();
  const keyParts = sortedKeys.map(key => `${key}:${params[key] || ''}`);
  return keyParts.join('|');
}

// Cleanup old entries periodically
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    timestampedRequestMap.forEach((entry, key) => {
      if (now - entry.timestamp > MAX_AGE) {
        timestampedRequestMap.delete(key);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`[Coalescing] Cleaned up ${cleaned} old entries`);
    }
  }, CLEANUP_INTERVAL);
}

/**
 * Get current coalescing statistics
 */
export function getCoalescingStats() {
  return {
    activeRequests: timestampedRequestMap.size,
    entries: Array.from(timestampedRequestMap.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp
    }))
  };
}