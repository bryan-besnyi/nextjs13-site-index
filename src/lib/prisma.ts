import { PrismaClient } from '@prisma/client';

/**
 * Represents a global object for Prisma.
 */
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * The Prisma client instance.
 * @remarks
 * This instance is used to interact with the database using Prisma.
 */
export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
