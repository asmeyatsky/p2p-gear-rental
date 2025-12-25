import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function generateAuthAndDbRequests() {
  console.log('🚀 Starting high-volume auth and database requests...');
  console.log('This will create continuous activity to keep database active');
  console.log('Press Ctrl+C to stop\n');

  let requestCount = 0;
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  
  if (users.length === 0) {
    console.log('❌ No users found. Please run create-users.ts first');
    return;
  }

  console.log(`📊 Found ${users.length} users for generating activity`);

  const activities = [
    // Database read operations
    async () => {
      requestCount++;
      const randomGear = await prisma.gear.findFirst({
        orderBy: { id: 'asc' },
        skip: Math.floor(Math.random() * 1000)
      });
      console.log(`📸[${requestCount}] Random gear fetch: ${randomGear?.title?.substring(0, 30) || 'None'}...`);
      return randomGear;
    },

    async () => {
      requestCount++;
      const count = await prisma.gear.count({
        where: { isAvailable: true }
      });
      console.log(`📊[${requestCount}] Available gear count: ${count}`);
      return count;
    },

    async () => {
      requestCount++;
      const categories = await prisma.gear.groupBy({
        by: ['category'],
        _count: { id: true },
        take: 10
      });
      console.log(`📂[${requestCount}] Categories count: ${categories.length}`);
      return categories;
    },

    async () => {
      requestCount++;
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const userGear = await prisma.gear.findMany({
        where: { userId: randomUser.id },
        take: 5
      });
      console.log(`👤[${requestCount}] User gear fetch: ${userGear.length} items`);
      return userGear;
    },

    async () => {
      requestCount++;
      const result = await prisma.$queryRaw`SELECT COUNT(*) as total_gear FROM gear`;
      console.log(`💾[${requestCount}] Raw query: ${result[0]?.total_gear || 0} total gear`);
      return result;
    },

    // Simulated auth operations
    async () => {
      requestCount++;
      const randomUser = users[Math.floor(Math.random() * users.length)];
      console.log(`🔐[${requestCount}] Simulated auth check for user: ${randomUser.email}`);
      return { auth: 'simulated', user: randomUser.email };
    },

    async () => {
      requestCount++;
      const newSession = {
        id: faker.string.alphanumeric(32),
        userId: users[Math.floor(Math.random() * users.length)].id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
      console.log(`🎟️[${requestCount}] Simulated session created for user ${newSession.userId}`);
      return newSession;
    },

    async () => {
      requestCount++;
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const authPayload = {
        email: randomUser.email,
        password: faker.internet.password(),
        timestamp: new Date().toISOString()
      };
      console.log(`🔑[${requestCount}] Simulated login attempt: ${authPayload.email}`);
      return authPayload;
    },

    async () => {
      requestCount++;
      const userCount = await prisma.user.count({
        where: { 
          verificationStatus: 'VERIFIED'
        }
      });
      console.log(`✅[${requestCount}] Verified users count: ${userCount}`);
      return userCount;
    },

    async () => {
      requestCount++;
      const cityStats = await prisma.gear.groupBy({
        by: ['city'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      });
      console.log(`🏙️[${requestCount}] Top cities: ${cityStats.length} locations`);
      return cityStats;
    },

    // Database write operations (lightweight)
    async () => {
      requestCount++;
      const randomUser = users[Math.floor(Math.random() * users.length)];
      try {
        const user = await prisma.user.update({
          where: { id: randomUser.id },
          data: { 
            updatedAt: new Date()
          }
        });
        console.log(`🔄[${requestCount}] User updated: ${user.email}`);
        return user;
      } catch (error) {
        console.log(`⚠️[${requestCount}] Update failed: ${error.message}`);
        return null;
      }
    },

    async () => {
      requestCount++;
      try {
        const totalStats = await prisma.gear.aggregate({
          _count: { id: true },
          _avg: { dailyRate: true },
          _min: { dailyRate: true },
          _max: { dailyRate: true }
        });
        console.log(`📈[${requestCount}] Gear stats: ${totalStats._count.id} items, avg $${totalStats._avg.dailyRate?.toFixed(2)}`);
        return totalStats;
      } catch (error) {
        console.log(`⚠️[${requestCount}] Aggregate failed: ${error.message}`);
        return null;
      }
    }
  ];

  console.log('🔄 Starting high-frequency requests (every 2 seconds)...');
  console.log('This will generate substantial database activity to prevent pausing\n');

  while (true) {
    try {
      // Run multiple random activities
      const numActivities = Math.floor(Math.random() * 3) + 1; // 1-3 activities per cycle
      
      for (let i = 0; i < numActivities; i++) {
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        await randomActivity();
        
        // Small delay between activities
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`⏰ Cycle completed. Next cycle in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('❌ Activity cycle failed:', error.message);
      // Wait longer if there's an error
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down high-activity monitor...');
  console.log(`📊 Total requests processed: ${requestCount}`);
  await prisma.$disconnect();
  process.exit(0);
});

generateAuthAndDbRequests().catch(async (error) => {
  console.error('❌ High-activity monitor failed:', error);
  await prisma.$disconnect();
  process.exit(1);
});