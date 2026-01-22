import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function distributeGearToUsers() {
  console.log('🔄 Distributing gear items to different users...');

  // Get all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, full_name: true }
  });

  if (users.length < 2) {
    console.log('❌ Need at least 2 users to distribute gear');
    return;
  }

  // Get some gear items to reassign
  const gearItems = await prisma.gear.findMany({
    take: 200, // Take first 200 gear items to redistribute
    select: { id: true, title: true }
  });

  console.log(`📊 Found ${users.length} users and ${gearItems.length} gear items to redistribute`);

  // Distribute gear items among users randomly
  const batchSize = 20;
  let updatedCount = 0;

  for (let batch = 0; batch < gearItems.length / batchSize; batch++) {
    console.log(`Processing batch ${batch + 1}/${Math.ceil(gearItems.length / batchSize)}...`);
    
    const batchPromises = [];
    const startIndex = batch * batchSize;
    const endIndex = Math.min(startIndex + batchSize, gearItems.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      batchPromises.push(
        prisma.gear.update({
          where: { id: gearItems[i].id },
          data: { 
            userId: randomUser.id 
          }
        })
      );
    }

    try {
      const results = await Promise.all(batchPromises);
      updatedCount += results.length;
      console.log(`✅ Batch ${batch + 1} completed. Updated ${results.length} gear items. Total: ${updatedCount}`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Error in batch ${batch + 1}:`, error instanceof Error ? error.message : error);
    }
  }

  // Get statistics after redistribution
  const stats = await prisma.gear.groupBy({
    by: ['userId'],
    _count: { id: true }
  });

  console.log('📈 Distribution Statistics:');
  stats.forEach(stat => {
    const user = users.find(u => u.id === stat.userId);
    if (user) {
      console.log(`   👤 ${user.full_name}: ${stat._count.id} gear items`);
    }
  });

  console.log(`🎉 Gear redistribution completed! Updated ${updatedCount} gear items.`);
  
  return { updated: updatedCount, totalUsers: users.length };
}

distributeGearToUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });