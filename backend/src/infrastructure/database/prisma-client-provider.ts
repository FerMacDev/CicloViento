import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/client.js';

const globalForPrisma = globalThis as typeof globalThis & {
  prismaClient?: PrismaClient;
};

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be configured before Prisma is used.');
  }

  return databaseUrl;
}

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prismaClient) {
    const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
    globalForPrisma.prismaClient = new PrismaClient({ adapter });
  }

  return globalForPrisma.prismaClient;
}
