import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function createRandomUsers() {
  console.log('🔄 Creating 20 random users...');

  const users = [];
  const usedEmails = new Set();

  for (let i = 0; i < 20; i++) {
    let email;
    do {
      email = faker.internet.email();
    } while (usedEmails.has(email));
    
    usedEmails.add(email);

    const user = {
      id: `user-${faker.string.alphanumeric(10)}`,
      email: email,
      full_name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      bio: faker.lorem.paragraph(2),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode(),
      phoneNumber: faker.phone.number(),
      verificationStatus: faker.helpers.arrayElement(['UNVERIFIED', 'VERIFIED', 'PENDING']),
      trustScore: faker.number.float({ min: 60, max: 100, fractionDigits: 1 }),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
    };

    users.push(user);
  }

  // Create users in batches to avoid connection pool issues
  const batchSize = 5;
  let createdCount = 0;

  for (let batch = 0; batch < users.length / batchSize; batch++) {
    console.log(`Creating user batch ${batch + 1}/${Math.ceil(users.length / batchSize)}...`);
    
    const batchPromises = [];
    const startIndex = batch * batchSize;
    const endIndex = Math.min(startIndex + batchSize, users.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      batchPromises.push(
        prisma.user.create({
          data: users[i],
        })
      );
    }

    try {
      const results = await Promise.all(batchPromises);
      createdCount += results.length;
      console.log(`✅ Batch ${batch + 1} completed. Created ${results.length} users. Total: ${createdCount}`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Error in batch ${batch + 1}:`, error instanceof Error ? error.message : error);

      // Try individually if batch fails
      for (const promise of batchPromises) {
        try {
          await promise;
          createdCount++;
        } catch (individualError) {
          console.log('⚠️ Individual user creation failed:', individualError instanceof Error ? individualError.message : individualError);
        }
      }
    }
  }

  // Get total user count
  const totalUsers = await prisma.user.count();
  
  console.log('🎉 User creation completed!');
  console.log(`📊 Created ${createdCount} new users`);
  console.log(`👤 Total users in database: ${totalUsers}`);
  
  return { created: createdCount, total: totalUsers };
}

createRandomUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });