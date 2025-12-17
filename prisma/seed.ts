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
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop',
      ]),
      city: 'New York',
      state: 'NY',
      category: 'cameras',
      brand: 'Canon',
      model: 'EOS R5',
      condition: 'like-new',
    },
    {
      title: 'Sony A7S III',
      description: 'A versatile full-frame mirrorless camera optimized for video, with excellent low-light performance.',
      dailyRate: 60.00,
      weeklyRate: 350.00,
      monthlyRate: 1200.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&h=600&fit=crop',
      ]),
      city: 'Los Angeles',
      state: 'CA',
      category: 'cameras',
      brand: 'Sony',
      model: 'A7S III',
      condition: 'good',
    },
    {
      title: 'DJI Mavic 3 Pro Drone',
      description: 'A professional drone with a triple-camera system, offering unparalleled imaging capabilities.',
      dailyRate: 75.00,
      weeklyRate: 450.00,
      monthlyRate: 1500.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&h=600&fit=crop',
      ]),
      city: 'Miami',
      state: 'FL',
      category: 'drones',
      brand: 'DJI',
      model: 'Mavic 3 Pro',
      condition: 'new',
    },
    {
      title: 'Godox VL150 LED Video Light',
      description: 'A powerful and compact LED light for professional video production.',
      dailyRate: 30.00,
      weeklyRate: 180.00,
      monthlyRate: 600.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1598618356794-eb1720430eb4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=800&h=600&fit=crop',
      ]),
      city: 'Chicago',
      state: 'IL',
      category: 'lighting',
      brand: 'Godox',
      model: 'VL150',
      condition: 'good',
    },
    {
      title: 'Sony 24-70mm f/2.8 GM Lens',
      description: 'Professional-grade zoom lens with constant f/2.8 aperture, perfect for portraits and events.',
      dailyRate: 40.00,
      weeklyRate: 240.00,
      monthlyRate: 800.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=800&h=600&fit=crop',
      ]),
      city: 'San Francisco',
      state: 'CA',
      category: 'lenses',
      brand: 'Sony',
      model: '24-70mm f/2.8 GM',
      condition: 'like-new',
    },
    {
      title: 'Rode VideoMic Pro+',
      description: 'Broadcast-quality on-camera microphone with automatic power, safety channel, and high-pass filter.',
      dailyRate: 25.00,
      weeklyRate: 150.00,
      monthlyRate: 500.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=600&fit=crop',
      ]),
      city: 'Austin',
      state: 'TX',
      category: 'audio',
      brand: 'Rode',
      model: 'VideoMic Pro+',
      condition: 'good',
    },
    {
      title: 'Manfrotto 504X Fluid Head Tripod',
      description: 'Professional video tripod with fluid head for smooth panning and tilting.',
      dailyRate: 35.00,
      weeklyRate: 210.00,
      monthlyRate: 700.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1542567455-cd733f23fbb1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=800&h=600&fit=crop',
      ]),
      city: 'Seattle',
      state: 'WA',
      category: 'tripods',
      brand: 'Manfrotto',
      model: '504X',
      condition: 'good',
    },
    {
      title: 'Atomos Ninja V Monitor/Recorder',
      description: '5-inch 4K HDR monitor-recorder with 10-bit ProRes and DNx recording.',
      dailyRate: 45.00,
      weeklyRate: 270.00,
      monthlyRate: 900.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&h=600&fit=crop',
      ]),
      city: 'Denver',
      state: 'CO',
      category: 'monitors',
      brand: 'Atomos',
      model: 'Ninja V',
      condition: 'like-new',
    },
    {
      title: 'Canon RF 70-200mm f/2.8L IS USM',
      description: 'Professional telephoto zoom lens with image stabilization for sports and wildlife.',
      dailyRate: 55.00,
      weeklyRate: 330.00,
      monthlyRate: 1100.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1606986628253-e0a5d1e21f0d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&h=600&fit=crop',
      ]),
      city: 'Boston',
      state: 'MA',
      category: 'lenses',
      brand: 'Canon',
      model: 'RF 70-200mm f/2.8L',
      condition: 'new',
    },
    {
      title: 'Aputure 300d Mark II',
      description: 'Professional LED daylight fixture with Bowens mount, perfect for studio and location work.',
      dailyRate: 65.00,
      weeklyRate: 390.00,
      monthlyRate: 1300.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1598618356794-eb1720430eb4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=800&h=600&fit=crop',
      ]),
      city: 'Portland',
      state: 'OR',
      category: 'lighting',
      brand: 'Aputure',
      model: '300d Mark II',
      condition: 'good',
    },
    {
      title: 'Blackmagic Pocket Cinema Camera 6K',
      description: 'Super 35 sensor cinema camera with 6K recording and EF lens mount.',
      dailyRate: 80.00,
      weeklyRate: 480.00,
      monthlyRate: 1600.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1585168142017-5a18a4c88c24?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop',
      ]),
      city: 'Atlanta',
      state: 'GA',
      category: 'cameras',
      brand: 'Blackmagic',
      model: 'Pocket Cinema 6K',
      condition: 'like-new',
    },
    {
      title: 'DJI Ronin-S Gimbal Stabilizer',
      description: '3-axis gimbal stabilizer for mirrorless and DSLR cameras up to 8 lbs.',
      dailyRate: 35.00,
      weeklyRate: 210.00,
      monthlyRate: 700.00,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=600&fit=crop',
      ]),
      city: 'Phoenix',
      state: 'AZ',
      category: 'accessories',
      brand: 'DJI',
      model: 'Ronin-S',
      condition: 'good',
    },
  ];

  for (const gear of gearData) {
    await prisma.gear.create({
      data: gear,
    });
  }

  console.log(`Seeded ${gearData.length} gear items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
