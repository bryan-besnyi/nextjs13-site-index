import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl, logDatabaseInfo, DATABASE_CONFIG } from './database-config';

// Database environment validation
function validateDatabaseEnvironment() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error('DATABASE_URL not configured');
  }
  
  // Prevent production DB in development
  if (process.env.NODE_ENV === 'development' && dbUrl.includes('ep-') && dbUrl.includes('neon.tech')) {
    console.warn('⚠️  Using Neon database in development. Ensure this is not production data.');
  }
  
  // Log database configuration
  if (process.env.NODE_ENV === 'development') {
    logDatabaseInfo();
  }
}

// Validate before creating Prisma client
validateDatabaseEnvironment();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: DATABASE_CONFIG.performance.enableLogging ? ['error', 'warn', 'info'] : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
}).$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      const start = Date.now();
      
      try {
        const result = await query(args);
        
        // Log slow queries
        const duration = Date.now() - start;
        if (duration > DATABASE_CONFIG.performance.slowQueryThreshold) {
          console.warn(`⚠️  Slow query detected: ${model}.${operation} took ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        // Log query errors
        console.error(`❌ Query error in ${model}.${operation}:`, error);
        throw error;
      }
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma as any;