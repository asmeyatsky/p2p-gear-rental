import { PrismaClient } from '@prisma/client';

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query test successful:', result);
    
    // Check if we can count existing gear
    const gearCount = await prisma.gear.count();
    console.log(`📊 Current gear count: ${gearCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('✅ Database is ready for seeding!');
  } else {
    console.log('❌ Database connection failed. Please check your DATABASE_URL.');
    process.exit(1);
  }
});