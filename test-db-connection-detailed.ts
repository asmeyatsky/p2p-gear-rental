import { PrismaClient } from '@prisma/client';

async function testConnectionDetailed() {
  console.log('Testing database connection with detailed logging...');
  console.log('DATABASE_URL format check...');
  
  const dbUrl = process.env.DATABASE_URL;
  console.log('DB URL format:', dbUrl?.replace(/:[^:@]*@/, ':***@')); // Hide password
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('Attempting to connect...');
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    
    // Try a simple query
    console.log('Testing simple query...');
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ Query result:', result);
    
    // Check database info
    console.log('Getting database info...');
    const dbInfo = await prisma.$queryRaw`SELECT current_database() as database, current_user as user`;
    console.log('✅ Database info:', dbInfo);
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed with details:', {
      message: error.message,
      code: error.code,
      errorCode: error.errorCode,
      meta: error.meta
    });
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnectionDetailed();