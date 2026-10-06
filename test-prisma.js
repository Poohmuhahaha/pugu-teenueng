import { PrismaClient } from './apps/api/node_modules/custom-prisma-client/index.js';

const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.contentEntry.findMany({
      where: { deletedAt: null },
      orderBy: [{ updatedAt: 'desc' }],
      take: 12,
      skip: 0
    });
    console.log("Success:", res.length);
  } catch (e) {
    console.error("Prisma error:", e);
  }
}

main().finally(() => prisma.$disconnect());
