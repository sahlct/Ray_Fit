import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

// Ensure the client has all generated models (e.g. adBanner)
const client =
  globalForPrisma.prisma && (globalForPrisma.prisma as any).adBanner
    ? globalForPrisma.prisma
    : createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = client;
}

export const prisma = client;
