import { PrismaClient } from '@prisma/client';

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
  
  // Log environment for debugging
  const isNeon = dbUrl.includes('neon.tech');
  const environment = process.env.NODE_ENV || 'unknown';
  
  if (isNeon) {
    console.log(`🗄️  Connected to Neon database (${environment})`);
  }
}

// Validate before creating Prisma client
validateDatabaseEnvironment();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;