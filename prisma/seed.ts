import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// User definitions
// ---------------------------------------------------------------------------
const LISTER_IDS = Array.from({ length: 10 }, (_, i) => `seed-lister-${i + 1}`);
const RENTER_IDS = Array.from({ length: 10 }, (_, i) => `seed-renter-${i + 1}`);
const ALL_SEED_USER_IDS = [...LISTER_IDS, RENTER_IDS[0] === 'seed-user-123' ? [] : RENTER_IDS, 'seed-user-123'].flat();

const listerProfiles = [
  { name: 'Maya Chen',        city: 'Los Angeles', state: 'CA', bio: 'Cinematographer with 8 years in narrative film. Renting out my kit between projects.' },
  { name: 'James Rodriguez', city: 'New York',     state: 'NY', bio: 'Commercial photographer. I keep a well-maintained gear locker — everything ships insured.' },
  { name: 'Sarah Mitchell',  city: 'Chicago',      state: 'IL', bio: 'Documentary filmmaker. Most of my gear is lightly used and in excellent condition.' },
  { name: 'Derek Thompson',  city: 'San Diego',    state: 'CA', bio: 'Wedding & event videographer. Offering full kits at competitive daily rates.' },
  { name: 'Aisha Patel',     city: 'Houston',      state: 'TX', bio: 'Studio photographer transitioning to video. Lots of lighting gear available.' },
  { name: 'Tom Nakamura',    city: 'Phoenix',      state: 'AZ', bio: 'Drone operator & aerial cinematographer. FAA Part 107 certified.' },
  { name: 'Rachel Kim',      city: 'Philadelphia', state: 'PA', bio: 'Freelance DP. I upgrade constantly so there is always something good to rent.' },
  { name: 'Marcus Bell',     city: 'Dallas',       state: 'TX', bio: 'Audio engineer & sound designer. Full sound kits for film & broadcast.' },
  { name: 'Olivia Grant',    city: 'San Jose',     state: 'CA', bio: 'Tech-industry photographer. Always have the latest mirrorless bodies available.' },
  { name: 'Chris Donovan',   city: 'San Antonio',  state: 'TX', bio: 'Action & adventure cinematographer. Rugged gear rated for tough conditions.' },
];

const renterProfiles = [
  { name: 'Ella Nguyen',     city: 'Los Angeles', state: 'CA', bio: 'Film school student working on my thesis film. Need reliable gear on a budget.' },
  { name: 'Brian Foster',    city: 'New York',     state: 'NY', bio: 'Marketing director. Renting gear for quarterly brand video shoots.' },
  { name: 'Lily Turner',     city: 'Chicago',      state: 'IL', bio: 'Travel blogger & vlogger. Always looking for compact, portable setups.' },
  { name: 'Kevin Park',      city: 'Houston',      state: 'TX', bio: 'Wedding photographer expanding into videography. Testing the waters.' },
  { name: 'Nadia Rahman',    city: 'Phoenix',      state: 'AZ', bio: 'Journalist covering the Southwest. Need fast-turnaround gear rentals.' },
  { name: 'Tyler Brooks',    city: 'San Diego',    state: 'CA', bio: 'YouTuber & content creator. Regularly rent lenses for product reviews.' },
  { name: 'Grace Liu',       city: 'Philadelphia', state: 'PA', bio: 'Documentary producer. Planning a six-month shoot across the US.' },
  { name: 'David Okafor',    city: 'Dallas',       state: 'TX', bio: 'Corporate trainer building an internal video studio. Learning as I go.' },
  { name: 'Mia Castillo',    city: 'San Jose',     state: 'CA', bio: 'Podcast creator adding video to the show. Need audio & camera gear.' },
  { name: 'Noah Williams',   city: 'San Antonio',  state: 'TX', bio: 'Hobbyist photographer wanting to try cinema lenses before buying.' },
];

// ---------------------------------------------------------------------------
// Gear generation helpers (realistic names borrowed from balanced-seed script)
// ---------------------------------------------------------------------------
const categories = ['cameras', 'lenses', 'drones', 'lighting', 'audio', 'tripods', 'accessories', 'stabilizers', 'monitors'];
const conditions  = ['new', 'like-new', 'good', 'fair'];
const brands      = ['Canon', 'Sony', 'DJI', 'Godox', 'Rode', 'Manfrotto', 'Atomos', 'Blackmagic', 'Aputure', 'Nikon', 'Fujifilm', 'Panasonic', 'RED', 'ARRI', 'Zeiss'];

const equipmentNames: Record<string, string[]> = {
  cameras:      ['EOS R5', 'A7S III', 'FX3', 'GH6', 'BMPCC 6K', 'Komodo', 'C70', 'Z Cam E2', 'Pocket Cinema', 'Lumix S5', '5D Mark IV', 'A6400', 'Z6II', 'X-T4', 'FS7', 'Alexa Mini', 'URSA Mini', 'C300 III', 'RED Dragon', 'HDC-P1'],
  lenses:       ['24-70mm f/2.8', '70-200mm f/2.8', '50mm f/1.4', '85mm f/1.8', '35mm f/1.4', '16-35mm f/4', '24mm f/1.4', '100mm Macro', '14mm f/2.8', '135mm f/2', '85mm f/1.4', '200-500mm f/5.6', '24-105mm f/4', '70-300mm f/4.5', '50mm f/1.8', '85mm f/1.2', '24-70mm f/4', '100mm f/2.8', '40mm f/2.8', '90mm f/2.8'],
  drones:       ['Mavic 3 Pro', 'Air 3', 'Mini 4 Pro', 'Inspire 3', 'FPV Combo', 'Avata 2', 'Phantom 4 Pro', 'Matrice 350', 'Autel EVO II', 'Skydio 2+', 'Mavic 3 Classic', 'Mini 3 Pro', 'Air 2S', 'DJI FPV', 'Mavic 2 Pro', 'Inspire 2', 'Mavic Air 2', 'Spark Drone', 'DJI Avata', 'Matrice 30T'],
  lighting:     ['Aputure 600d', 'Godox VL150', 'Nanlite Forza', 'Falcon Eyes ROX', 'Amaran 200d', 'Aperture MC', 'RGB Panel', 'Softbox Kit', 'Ring Light Pro', 'LED Fresnel', 'Key Light Pro', 'Fill Light Kit', 'Back Light Panel', 'Hair Light', 'Practical Light', 'Panel Light 1x1', 'Tubular Light', 'Spot Light 150W', 'Fresnel 500W', 'Par Light LED'],
  audio:        ['NTG5', 'MKE 600', 'Wireless GO II', 'F6 Recorder', 'MixPre-6 II', 'NTR Ribbon', 'VideoMic Pro+', 'Lav Mic Kit', 'Boom Pole Kit', 'Wireless System', 'Shotgun Mic', 'Condenser Mic', 'Dynamic Mic', 'Boundary Mic', 'USB Mic', 'Audio Interface', 'Field Mixer', 'Headphones Pro', 'Windscreen Kit', 'XLR Cable Kit'],
  tripods:      ['Video Tripod', 'Carbon Fiber', 'Fluid Head', 'Travel Tripod', 'Heavy Duty', 'Monopod Pro', 'Slider Combo', 'Dolly System', 'Jib Arm', 'Crane Stand', 'Tabletop Tripod', 'Flexible Tripod', 'GorillaPod XL', 'Tripod Legs', 'Center Column', 'Quick Release Set', 'Leveling Base', 'Ground Spikes', 'Tripod Bag', 'Compact Monopod'],
  accessories:  ['V-Mount Battery', 'Monitor Arm', 'Camera Cage', 'Follow Focus', 'Matte Box', 'ND Filter Set', 'Memory Card Kit', 'Cable Kit', 'Rain Cover', 'Pelican Case', 'Battery Grip', 'External Recorder', 'Lens Hood', 'UV Filter', 'Polarizing Filter', 'Graduated Filter', 'Step-Up Ring', 'Adapter Ring', 'Lens Cleaning Kit', 'Laptop Stand'],
  stabilizers:  ['RS 3 Pro', 'Crane 3S', 'Weebill 2', 'Moza Air 2', 'Ronin 4D', 'Gimbal Kit', 'Steadicam Aura', 'Glidecam HD', 'Zhiyun Crane 3', 'Freefly MoVI', 'Handheld Gimbal', '3-Axis Stabilizer', 'Gimbal Controller', 'Counterweights', 'Gimbal Case', 'Gimbal Battery Kit', 'Gimbal Charger', 'Gimbal Mount', 'Gimbal Handle', 'Gimbal Extension Pole'],
  monitors:     ['Atomos Ninja V', 'SmallHD Focus', 'Shinobi 7"', 'Feelworld F6', 'TVLogic LUM', 'Director Monitor', 'HDR Monitor 17"', 'Waveform Monitor', 'Field Monitor 5"', 'Reference Display', 'On-Camera Monitor', 'LUT Monitor', 'Touch Screen 7"', 'HDMI Monitor', 'SDI Monitor', 'Loop Through Mon', 'Peaking Monitor', 'False Color Mon', 'Vectorscope', 'Histogram Display'],
};

// City ↔ State kept in sync
const cityState = [
  ['New York', 'NY'], ['Los Angeles', 'CA'], ['Chicago', 'IL'], ['Houston', 'TX'],
  ['Phoenix', 'AZ'], ['Philadelphia', 'PA'], ['San Antonio', 'TX'], ['San Diego', 'CA'],
  ['Dallas', 'TX'], ['San Jose', 'CA'],
];

function generateGear(index: number, ownerId: string) {
  const category   = faker.helpers.arrayElement(categories);
  const brand      = faker.helpers.arrayElement(brands);
  const equipment  = faker.helpers.arrayElement(equipmentNames[category]);
  const condition  = faker.helpers.arrayElement(conditions);
  const [city, state] = faker.helpers.arrayElement(cityState);

  const dailyRate     = faker.number.float({ min: 15, max: 250, fractionDigits: 2 });
  const weeklyRate    = parseFloat((dailyRate * 5.5).toFixed(2));
  const monthlyRate   = parseFloat((dailyRate * 20).toFixed(2));
  const replacement   = parseFloat((dailyRate * faker.number.int({ min: 40, max: 80 })).toFixed(2));

  const imageUrl = `https://picsum.photos/seed/${category}-${brand}-${index}/800/600`;

  return {
    title:            `${brand} ${equipment}`,
    description:      `Professional ${category.slice(0, -1)} available for rent. ${faker.commerce.productDescription()} Great for ${faker.helpers.arrayElement(['film productions', 'commercial shoots', 'events', 'documentaries', 'music videos', 'content creation'])}.`,
    dailyRate,
    weeklyRate,
    monthlyRate,
    images:           JSON.stringify([imageUrl, imageUrl.replace('600', '601')]),
    city,
    state,
    category,
    brand,
    model:            equipment,
    condition,
    userId:          ownerId,
    replacementValue: replacement,
    insuranceRequired: faker.datatype.boolean(),
    insuranceRate:    0.10,
    isAvailable:      true,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Starting seed...\n');

  // --- Cleanup (Rental has onDelete: Cascade to Review, Conversation/Message,
  //     Dispute/DisputeResponse, and DamageClaim — so deleting Rentals first
  //     handles all child tables automatically) ---
  console.log('Cleaning up previous seed data...');
  await prisma.rental.deleteMany({
    where: {
      OR: [
        { renterId: { in: ALL_SEED_USER_IDS } },
        { ownerId:  { in: ALL_SEED_USER_IDS } },
      ],
    },
  });
  await prisma.gear.deleteMany({ where: { userId: { in: ALL_SEED_USER_IDS } } });
  await prisma.user.deleteMany({ where: { id: { in: ALL_SEED_USER_IDS } } });
  console.log('Cleanup complete.\n');

  // --- Create 10 listers ---
  console.log('Creating 10 lister users...');
  const listers = await Promise.all(
    listerProfiles.map((p, i) =>
      prisma.user.create({
        data: {
          id:                 LISTER_IDS[i],
          email:              `lister${i + 1}@seeddata.example.com`,
          full_name:          p.name,
          bio:                p.bio,
          city:               p.city,
          state:              p.state,
          verificationStatus: 'VERIFIED',
          trustScore:         faker.number.float({ min: 70, max: 98, fractionDigits: 1 }),
          completedRentals:   faker.number.int({ min: 5, max: 40 }),
          averageRating:      faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }),
          totalReviews:       faker.number.int({ min: 3, max: 25 }),
        },
      })
    )
  );
  listers.forEach(u => console.log(`  + Lister: ${u.full_name} (${u.email})`));

  // --- Create 10 renters ---
  console.log('\nCreating 10 renter users...');
  const renters = await Promise.all(
    renterProfiles.map((p, i) =>
      prisma.user.create({
        data: {
          id:                 RENTER_IDS[i],
          email:              `renter${i + 1}@seeddata.example.com`,
          full_name:          p.name,
          bio:                p.bio,
          city:               p.city,
          state:              p.state,
          verificationStatus: faker.helpers.arrayElement(['VERIFIED', 'VERIFIED', 'PENDING']),
          trustScore:         faker.number.float({ min: 50, max: 90, fractionDigits: 1 }),
          completedRentals:   faker.number.int({ min: 0, max: 15 }),
          averageRating:      faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 }),
          totalReviews:       faker.number.int({ min: 0, max: 10 }),
        },
      })
    )
  );
  renters.forEach(u => console.log(`  + Renter: ${u.full_name} (${u.email})`));

  // --- Seed 1000 gear items distributed across the 10 listers (100 each) ---
  console.log('\nSeeding 1000 gear items across 10 listers...');
  const gearItemsToCreate = 1000;
  const batchSize          = 50;

  for (let i = 0; i < gearItemsToCreate; i += batchSize) {
    const batch = [];
    for (let j = i; j < Math.min(i + batchSize, gearItemsToCreate); j++) {
      const lister = LISTER_IDS[j % LISTER_IDS.length]; // round-robin across listers
      batch.push(generateGear(j, lister));
    }
    await prisma.gear.createMany({ data: batch });
    console.log(`  Gear: ${Math.min(i + batchSize, gearItemsToCreate)}/${gearItemsToCreate}`);
  }

  // --- Summary ---
  console.log('\n--- Seed complete ---');
  console.log(`  Listers : ${listers.length}  (each owns ~100 gear items)`);
  console.log(`  Renters : ${renters.length}`);
  console.log(`  Gear    : ${gearItemsToCreate}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
