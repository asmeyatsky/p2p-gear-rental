import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const gearCount = await prisma.gear.count();
    console.log(`Current number of gear items in the database: ${gearCount}`);
  } catch (e) {
    console.error('Error checking gear count:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
