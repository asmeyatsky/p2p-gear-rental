import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllUsers() {
  console.log('Starting user deletion...\n');

  try {
    // First, delete all application data that references users
    console.log('1. Deleting dispute responses...');
    const disputeResponses = await prisma.disputeResponse.deleteMany({});
    console.log(`   Deleted ${disputeResponses.count} dispute responses`);

    console.log('2. Deleting disputes...');
    const disputes = await prisma.dispute.deleteMany({});
    console.log(`   Deleted ${disputes.count} disputes`);

    console.log('3. Deleting messages...');
    const messages = await prisma.message.deleteMany({});
    console.log(`   Deleted ${messages.count} messages`);

    console.log('4. Deleting conversations...');
    const conversations = await prisma.conversation.deleteMany({});
    console.log(`   Deleted ${conversations.count} conversations`);

    console.log('5. Deleting reviews...');
    const reviews = await prisma.review.deleteMany({});
    console.log(`   Deleted ${reviews.count} reviews`);

    console.log('6. Deleting damage claims...');
    const damageClaims = await prisma.damageClaim.deleteMany({});
    console.log(`   Deleted ${damageClaims.count} damage claims`);

    console.log('7. Deleting rentals...');
    const rentals = await prisma.rental.deleteMany({});
    console.log(`   Deleted ${rentals.count} rentals`);

    console.log('8. Deleting gear listings...');
    const gear = await prisma.gear.deleteMany({});
    console.log(`   Deleted ${gear.count} gear listings`);

    console.log('9. Deleting application users...');
    const users = await prisma.user.deleteMany({});
    console.log(`   Deleted ${users.count} application users`);

    // Now delete from Supabase auth.users table
    console.log('10. Deleting Supabase auth users...');
    const authResult = await prisma.$executeRaw`DELETE FROM auth.users`;
    console.log(`    Deleted ${authResult} auth users`);

    console.log('\n✅ All users deleted successfully!');
  } catch (error) {
    console.error('\n❌ Error deleting users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllUsers();
