/**
 * Server Startup Initialization
 * Runs once when the server starts
 */

import { CacheWarmer } from './cache-warmer';

let initialized = false;

export async function initializeServer() {
  if (initialized) {
    return;
  }
  
  initialized = true;
  console.log('🚀 Initializing server...');
  
  // Start cache warming in the background
  if (process.env.NODE_ENV === 'production' || process.env.WARM_CACHE === 'true') {
    console.log('📦 Starting cache warming on server startup...');
    CacheWarmer.warmAllCaches().catch(error => {
      console.error('Failed to warm cache on startup:', error);
    });
  }
  
  // Schedule periodic cache refresh (every 20 minutes)
  setInterval(() => {
    console.log('🔄 Refreshing cache...');
    CacheWarmer.warmAllCaches().catch(error => {
      console.error('Failed to refresh cache:', error);
    });
  }, 20 * 60 * 1000);
  
  console.log('✅ Server initialization complete');
}