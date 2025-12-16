import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clear existing data
  await prisma.gear.deleteMany({});
  console.log('Cleared existing gear data.');

  const gearData = [
    {
      title: 'Canon EOS R5',
      description: 'A high-performance mirrorless camera with a 45MP full-frame sensor and 8K video recording.',
      dailyRate: 50.00,
      weeklyRate: 300.00,
      monthlyRate: 1000.00,
      images: JSON.stringify([
        'https://picsum.photos/seed/canonr5_1/800/600',
        'https://picsum.photos/seed/canonr5_2/800/600',
      ]),
      city: 'New York',
      state: 'NY',
      brand: 'Canon',
      model: 'EOS R5',
      condition: 'Like New',
    },
    {
      title: 'Sony A7S III',
      description: 'A versatile full-frame mirrorless camera optimized for video, with excellent low-light performance.',
      dailyRate: 60.00,
      weeklyRate: 350.00,
      monthlyRate: 1200.00,
      images: [
        'https://picsum.photos/seed/sonya7siii_1/800/600',
        'https://picsum.photos/seed/sonya7siii_2/800/600',
      ],
      city: 'Los Angeles',
      state: 'CA',
      brand: 'Sony',
      model: 'A7S III',
      condition: 'Excellent',
    },
    {
      title: 'DJI Mavic 3 Pro',
      description: 'A professional drone with a triple-camera system, offering unparalleled imaging capabilities.',
      dailyRate: 75.00,
      weeklyRate: 450.00,
      monthlyRate: 1500.00,
      images: [
        'https://picsum.photos/seed/djimavic3pro_1/800/600',
        'https://picsum.photos/seed/djimavic3pro_2/800/600',
      ],
      city: 'Miami',
      state: 'FL',
      brand: 'DJI',
      model: 'Mavic 3 Pro',
      condition: 'New',
    },
    {
      title: 'Godox VL150 LED Video Light',
      description: 'A powerful and compact LED light for professional video production.',
      dailyRate: 30.00,
      weeklyRate: 180.00,
      monthlyRate: 600.00,
      images: [
        'https://picsum.photos/seed/godoxvl150_1/800/600',
        'https://picsum.photos/seed/godoxvl150_2/800/600',
      ],
      city: 'Chicago',
      state: 'IL',
      brand: 'Godox',
      model: 'VL150',
      condition: 'Good',
    },
  ];

  for (const gear of gearData) {
    await prisma.gear.create({
      data: gear,
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });