/**
 * Database connection configuration
 * Optimized for production with connection pooling
 */

export const DATABASE_CONFIG = {
  // Connection pool settings
  pool: {
    // Maximum number of connections in the pool
    max: process.env.DATABASE_POOL_MAX ? parseInt(process.env.DATABASE_POOL_MAX) : 10,
    
    // Minimum number of connections in the pool
    min: process.env.DATABASE_POOL_MIN ? parseInt(process.env.DATABASE_POOL_MIN) : 2,
    
    // Maximum time (in milliseconds) that a connection can be idle before being closed
    idleTimeoutMillis: 30000,
    
    // Maximum time (in milliseconds) to wait for a connection from the pool
    connectionTimeoutMillis: 5000,
    
    // Time between connection validation checks
    validationInterval: 30000,
  },
  
  // Query timeout settings
  timeout: {
    // Default query timeout in milliseconds
    query: process.env.DATABASE_QUERY_TIMEOUT ? parseInt(process.env.DATABASE_QUERY_TIMEOUT) : 10000,
    
    // Connection timeout in milliseconds
    connect: process.env.DATABASE_CONNECT_TIMEOUT ? parseInt(process.env.DATABASE_CONNECT_TIMEOUT) : 5000,
  },
  
  // Retry configuration
  retry: {
    // Number of times to retry a failed query
    maxAttempts: 3,
    
    // Initial delay between retries in milliseconds
    initialDelay: 100,
    
    // Maximum delay between retries in milliseconds
    maxDelay: 1000,
    
    // Exponential backoff factor
    backoffFactor: 2,
  },
  
  // Performance settings
  performance: {
    // Enable query logging in development
    enableLogging: process.env.NODE_ENV === 'development',
    
    // Log slow queries (queries taking longer than this threshold in ms)
    slowQueryThreshold: 1000,
    
    // Enable connection pooling stats
    enablePoolStats: process.env.NODE_ENV === 'development',
  }
};

/**
 * Get database URL with connection pooling parameters
 */
export function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  
  if (!baseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // For Neon, add pooling parameters
  if (baseUrl.includes('neon.tech')) {
    const url = new URL(baseUrl);
    
    // Enable connection pooling
    url.searchParams.set('pgbouncer', 'true');
    url.searchParams.set('connection_limit', DATABASE_CONFIG.pool.max.toString());
    url.searchParams.set('pool_timeout', (DATABASE_CONFIG.timeout.connect / 1000).toString());
    
    return url.toString();
  }
  
  return baseUrl;
}

/**
 * Log database connection info (sanitized)
 */
export function logDatabaseInfo(): void {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not configured');
    return;
  }
  
  try {
    const url = new URL(dbUrl);
    const isNeon = url.hostname.includes('neon.tech');
    const isPooled = url.searchParams.get('pgbouncer') === 'true';
    
    console.log('📊 Database Configuration:');
    console.log(`  Provider: ${isNeon ? 'Neon' : 'PostgreSQL'}`);
    console.log(`  Host: ${url.hostname}`);
    console.log(`  Database: ${url.pathname.slice(1)}`);
    console.log(`  Pooling: ${isPooled ? 'Enabled' : 'Disabled'}`);
    console.log(`  Pool Size: ${DATABASE_CONFIG.pool.min}-${DATABASE_CONFIG.pool.max} connections`);
    console.log(`  Query Timeout: ${DATABASE_CONFIG.timeout.query}ms`);
    
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format');
  }
}