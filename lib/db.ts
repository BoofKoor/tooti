import { PrismaClient } from '@prisma/client';

// Standard Prisma singleton: reuse one client across hot-reloads in dev so we
// don't exhaust connections. In production a fresh module instance is fine.
const g = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = g.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
