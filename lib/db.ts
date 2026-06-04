/**
 * Prisma client — wired in Phase 3 (Data & auth).
 *
 * Intentional placeholder: it reserves the file from handoff §3 without pulling
 * database dependencies into the Phase 0 foundation. The schema lives in
 * prisma/schema.prisma. Phase 3 replaces this with the standard singleton:
 *
 *   import { PrismaClient } from '@prisma/client';
 *   const g = globalThis as unknown as { prisma?: PrismaClient };
 *   export const prisma = g.prisma ?? new PrismaClient();
 *   if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
 */
export {};
