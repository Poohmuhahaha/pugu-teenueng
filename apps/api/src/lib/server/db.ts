import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('custom-prisma-client');
const { PrismaClient } = pkg;

const globalForPrisma = globalThis as unknown as { prisma: any };
export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
