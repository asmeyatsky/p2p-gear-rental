import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding with batch processing...');

  // Clear existing data
  await prisma.gear.deleteMany({});
  console.log('Cleared existing gear data.');

  // Create a user
  const user = await prisma.user.upsert({
    where: { email: 'seeduser@example.com' },
    update: {},
    create: {
      id: 'seed-user-123',
      email: 'seeduser@example.com',
      full_name: 'Seed User',
    },
  });
  console.log(`Created/found seed user: ${user.email}`);

  const categories = ['cameras', 'lenses', 'drones', 'lighting', 'audio', 'tripods', 'accessories', 'stabilizers', 'monitors'];
  const conditions = ['new', 'like-new', 'good', 'fair', 'worn'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
  const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH', 'GA', 'NC'];
  const brands = ['Canon', 'Sony', 'DJI', 'Godox', 'Rode', 'Manfrotto', 'Atomos', 'Blackmagic', 'Aputure', 'Nikon', 'Fujifilm'];

  const generateFakeGear = (index: number) => {
    const title = faker.commerce.productName();
    const description = faker.commerce.productDescription();
    const dailyRate = parseFloat(faker.commerce.price({ min: 10, max: 200, dec: 2 }));
    const weeklyRate = parseFloat((dailyRate * 5.5).toFixed(2));
    const monthlyRate = parseFloat((dailyRate * 20).toFixed(2));

    const randomCategory = faker.helpers.arrayElement(categories);
    const randomCondition = faker.helpers.arrayElement(conditions);
    const randomCity = faker.helpers.arrayElement(cities);
    const randomState = faker.helpers.arrayElement(states);
    const randomBrand = faker.helpers.arrayElement(brands);
    
    const imageSeed = `${randomCategory}-${randomBrand}-${randomCity}`;
    const imageUrl = `https://picsum.photos/seed/${imageSeed}/800/600`;

    return {
      title: `${title} - ${index + 1}`,
      description: description,
      dailyRate: dailyRate,
      weeklyRate: weeklyRate,
      monthlyRate: monthlyRate,
      images: JSON.stringify([imageUrl, imageUrl.replace('600', '601')]),
      city: randomCity,
      state: randomState,
      category: randomCategory,
      brand: randomBrand,
      model: faker.lorem.word(),
      condition: randomCondition,
      userId: user.id,
    };
  };

  const gearItemsToCreate = 1000;
  const batchSize = 50; // Process in smaller batches
  let createdCount = 0;

  for (let batch = 0; batch < gearItemsToCreate / batchSize; batch++) {
    console.log(`Processing batch ${batch + 1}/${Math.ceil(gearItemsToCreate / batchSize)}...`);
    
    const batchPromises = [];
    for (let i = 0; i < batchSize; i++) {
      const index = batch * batchSize + i;
      if (index >= gearItemsToCreate) break;
      
      batchPromises.push(
        prisma.gear.create({
          data: generateFakeGear(index),
        })
      );
    }

    try {
      const results = await Promise.all(batchPromises);
      createdCount += results.length;
      console.log(`✅ Batch ${batch + 1} completed. Created ${results.length} items. Total: ${createdCount}`);
      
      // Small delay between batches to avoid overwhelming the connection pool
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Error in batch ${batch + 1}:`, error.message);
      // Try individually if batch fails
      for (const promise of batchPromises) {
        try {
          await promise;
          createdCount++;
        } catch (individualError) {
          console.log('⚠️ Individual item failed:', individualError.message);
        }
      }
    }
  }

  console.log(`🎉 Seeding completed! Created ${createdCount} gear items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });