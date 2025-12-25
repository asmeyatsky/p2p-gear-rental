import { PrismaClient } from '@prisma/client';

async function verifySeedData() {
  const prisma = new PrismaClient();
  
  try {
    const gearCount = await prisma.gear.count();
    const userCount = await prisma.user.count();
    
    console.log('📊 DATABASE VERIFICATION:');
    console.log('================================');
    console.log(`✅ Connection: Active`);
    console.log(`📸 Total Gear Items: ${gearCount}`);
    console.log(`👤 Total Users: ${userCount}`);
    console.log(`💾 Database Status: HEALTHY`);
    console.log(`🎯 Goal: 1000 gear items - ${gearCount >= 1000 ? 'ACHIEVED' : 'IN PROGRESS'}`);
    console.log('================================');
    
    if (gearCount >= 1000) {
      console.log('🎉 SUCCESS! Your Supabase database is now ACTIVE with 1000+ records!');
      console.log('🔄 The database should remain active with this level of activity.');
    } else {
      console.log(`⚠️ Need ${1000 - gearCount} more records to reach goal.`);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifySeedData();