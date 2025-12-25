import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function keepDatabaseActive() {
  console.log('🔄 Starting database activity monitor...');
  console.log('This script will run queries every 30 seconds to keep database active');
  console.log('Press Ctrl+C to stop\n');

  let counter = 0;
  
  const activities = [
    async () => {
      // Count gear items
      const count = await prisma.gear.count();
      console.log(`📊 Activity ${++counter}: Gear count = ${count}`);
      return count;
    },
    
    async () => {
      // Find random gear
      const randomGear = await prisma.gear.findFirst({
        orderBy: { id: 'asc' },
        skip: Math.floor(Math.random() * 1000)
      });
      console.log(`📸 Activity ${++counter}: Random gear = ${randomGear?.title || 'None'}`);
      return randomGear;
    },
    
    async () => {
      // Count by category
      const categories = await prisma.gear.groupBy({
        by: ['category'],
        _count: true
      });
      console.log(`📂 Activity ${++counter}: Categories = ${categories.length}`);
      return categories;
    },
    
    async () => {
      // Database health check
      const result = await prisma.$queryRaw`SELECT version() as version`;
      console.log(`💾 Activity ${++counter}: DB check = OK`);
      return result;
    },
    
    async () => {
      // User count
      const userCount = await prisma.user.count();
      console.log(`👤 Activity ${++counter}: Users = ${userCount}`);
      return userCount;
    }
  ];

  while (true) {
    try {
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      await randomActivity();
      
      console.log('⏰ Next activity in 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    } catch (error) {
      console.error('❌ Activity failed:', error.message);
      // Wait longer if there's an error
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down database activity monitor...');
  await prisma.$disconnect();
  process.exit(0);
});

keepDatabaseActive().catch(async (error) => {
  console.error('❌ Database activity monitor failed:', error);
  await prisma.$disconnect();
  process.exit(1);
});