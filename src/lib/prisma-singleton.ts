import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl, logDatabaseInfo, DATABASE_CONFIG } from './database-config';
import { validateDatabaseSafety } from './database-safety';

// Database environment validation with safety checks
function validateDatabaseEnvironment() {
  // Run comprehensive safety validation
  const analysis = validateDatabaseSafety();
  
  if (!analysis.isSafe) {
    throw new Error('Database connection blocked for safety reasons');
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