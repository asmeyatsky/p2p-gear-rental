/**
 * Generate balanced seed CSV files for staging bulk upload
 * Ensures at least 30 items per category
 * Usage: npx tsx scripts/generate-balanced-seed.ts [itemsPerCategory]
 * Example: npx tsx scripts/generate-balanced-seed.ts 30
 *
 * Creates a CSV file in data/balanced-seed-gear.csv that can be uploaded via the bulk upload API
 */

import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import * as path from 'path';

const categories = ['cameras', 'lenses', 'drones', 'lighting', 'audio', 'tripods', 'accessories', 'stabilizers', 'monitors'];
const conditions = ['new', 'like-new', 'good', 'fair', 'worn'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol'];
const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH', 'GA', 'NC', 'UK', 'UK', 'UK', 'UK', 'UK'];
const brands = ['Canon', 'Sony', 'DJI', 'Godox', 'Rode', 'Manfrotto', 'Atomos', 'Blackmagic', 'Aputure', 'Nikon', 'Fujifilm', 'Panasonic', 'RED', 'ARRI', 'Zeiss'];

// Equipment-specific names by category for more realistic titles
const equipmentNames: Record<string, string[]> = {
  cameras: [
    'EOS R5', 'A7S III', 'FX3', 'GH6', 'BMPCC 6K', 'Komodo', 'C70', 'Z Cam E2', 'Pocket Cinema', 'Lumix S5',
    '5D Mark IV', 'A6400', 'Z6II', 'X-T4', 'FS7', 'Alexa Mini', 'URSA Mini', 'Cinema EOS C300', 'Red Dragon', 'HDC-P1'
  ],
  lenses: [
    '24-70mm f/2.8', '70-200mm f/2.8', '50mm f/1.4', '85mm f/1.8', '35mm f/1.4', '16-35mm f/4', '24mm f/1.4', '100mm Macro', '14mm f/2.8', '135mm f/2',
    '85mm f/1.4', '200-500mm f/5.6', '100-400mm f/4.5-5.6', '24-105mm f/4', '70-300mm f/4-5.6', '50mm f/1.8', '35mm f/2', '85mm f/1.2', '24-70mm f/4', '100mm f/2.8'
  ],
  drones: [
    'Mavic 3 Pro', 'Air 3', 'Mini 4 Pro', 'Inspire 3', 'FPV Combo', 'Avata 2', 'Phantom 4 Pro', 'Matrice 350', 'Autel EVO II', 'Skydio 2+',
    'Mavic 3 Classic', 'Mini 3 Pro', 'Air 2S', 'DJI FPV', 'Mavic 2 Pro', 'Inspire 2', 'Mavic Air 2', 'Spark Drone', 'DJI Avata', 'Mavic 3 Enterprise'
  ],
  lighting: [
    'Aputure 600d', 'Godox VL150', 'Nanlite Forza', 'Falcon Eyes', 'Amaran 200d', 'Aperture MC', 'RGB Panel', 'Softbox Kit', 'Ring Light Pro', 'LED Fresnel',
    'Key Light', 'Fill Light', 'Back Light', 'Hair Light', 'Practical Light', 'Panel Light', 'Tubular Light', 'Spot Light', 'Fresnel Light', 'Par Light'
  ],
  audio: [
    'NTG5', 'MKE 600', 'Wireless GO II', 'F6 Recorder', 'MixPre-6', 'NTR Ribbon', 'VideoMic Pro+', 'Lav Mic Kit', 'Boom Pole Kit', 'Wireless System',
    'Shotgun Mic', 'Condenser Mic', 'Dynamic Mic', 'Boundary Mic', 'USB Mic', 'XLR Cable', 'Audio Interface', 'Field Mixer', 'Headphones', 'Windscreen'
  ],
  tripods: [
    'Video Tripod', 'Carbon Fiber', 'Fluid Head', 'Travel Tripod', 'Heavy Duty', 'Monopod Pro', 'Slider Combo', 'Dolly System', 'Jib Arm', 'Crane Stand',
    'Tabletop Tripod', 'Flexible Tripod', 'Gorilla Pod', 'Tripod Legs', 'Center Column', 'Tripod Head', 'Quick Release Plate', 'Tripod Bag', 'Leveling Base', 'Ground Spikes'
  ],
  accessories: [
    'V-Mount Battery', 'Monitor Arm', 'Camera Cage', 'Follow Focus', 'Matte Box', 'ND Filter Set', 'Memory Card Kit', 'Cable Kit', 'Rain Cover', 'Pelican Case',
    'Battery Grip', 'External Recorder', 'Lens Hood', 'Lens Cap', 'Body Cap', 'UV Filter', 'Polarizing Filter', 'Graduated Filter', 'Step-Up Ring', 'Adapter Ring'
  ],
  stabilizers: [
    'RS 3 Pro', 'Crane 3S', 'Weebill 2', 'Moza Air 2', 'Ronin 4D', 'Gimbal Kit', 'Steadicam', 'Glidecam HD', 'Zhiyun Crane', 'Freefly MoVI',
    'Handheld Gimbal', '3-Axis Stabilizer', 'Gimbal Controller', 'Counterweights', 'Gimbal Case', 'Gimbal Battery', 'Gimbal Charger', 'Gimbal Mount', 'Gimbal Handle', 'Gimbal Extension'
  ],
  monitors: [
    'Atomos Ninja', 'SmallHD Focus', 'Shinobi 7', 'Feelworld F6', 'TVLogic', 'Director Monitor', 'HDR Monitor', 'Waveform Monitor', 'Field Monitor', 'Reference Display',
    'On-Camera Monitor', 'LUT Monitor', 'Color Calibrated', 'Touch Screen', 'HDMI Input', 'SDI Input', 'Loop Through', 'Peaking', 'Focus Assist', 'False Color'
  ],
};

function generateGearItem(index: number, category: string): Record<string, string> {
  const brand = faker.helpers.arrayElement(brands);
  const equipment = faker.helpers.arrayElement(equipmentNames[category]);
  const cityIndex = faker.number.int({ min: 0, max: cities.length - 1 });
  const condition = faker.helpers.arrayElement(conditions);

  const dailyRate = faker.number.float({ min: 15, max: 250, fractionDigits: 2 });
  const weeklyRate = parseFloat((dailyRate * 5.5).toFixed(2));
  const monthlyRate = parseFloat((dailyRate * 20).toFixed(2));
  const replacementValue = faker.number.float({ min: dailyRate * 30, max: dailyRate * 100, fractionDigits: 2 });

  // Generate consistent image URL based on category
  const imageUrl = `https://picsum.photos/seed/${category}-${brand}-${index}/800/600`;

  return {
    title: `${brand} ${equipment}`,
    description: `Professional ${category.slice(0, -1)} for rent. ${faker.commerce.productDescription()} Perfect for ${faker.helpers.arrayElement(['film productions', 'commercial shoots', 'events', 'documentaries', 'music videos', 'content creation'])}.`,
    dailyRate: dailyRate.toString(),
    weeklyRate: weeklyRate.toString(),
    monthlyRate: monthlyRate.toString(),
    city: cities[cityIndex],
    state: states[cityIndex],
    category: category,
    brand: brand,
    model: equipment,
    condition: condition,
    imageUrl: imageUrl,
    replacementValue: replacementValue.toString(),
    insuranceRequired: faker.datatype.boolean().toString(),
    insuranceRate: '0.10',
    isAvailable: 'true',
  };
}

function generateBalancedCSV(itemsPerCategory: number): string {
  const allItems = [];
  
  // Generate items for each category
  for (const category of categories) {
    for (let i = 0; i < itemsPerCategory; i++) {
      allItems.push(generateGearItem(i, category));
    }
  }

  // Get headers from first item
  const headers = Object.keys(allItems[0]);

  // Create CSV content
  const rows = allItems.map(item =>
    headers.map(header => {
      const value = item[header];
      // Escape commas and quotes in values
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

async function main() {
  const itemsPerCategory = parseInt(process.argv[2] || '30', 10);
  const totalItems = itemsPerCategory * categories.length;

  console.log(`Generating ${totalItems} gear items (${itemsPerCategory} per category)...`);

  const csv = generateBalancedCSV(itemsPerCategory);

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outputPath = path.join(dataDir, 'balanced-seed-gear.csv');
  fs.writeFileSync(outputPath, csv, 'utf-8');

  console.log(`CSV file created: ${outputPath}`);
  console.log(`Total items: ${totalItems} (${itemsPerCategory} per category)`);
  console.log(`Categories: ${categories.join(', ')}`);
  console.log('\nTo upload to staging:');
  console.log('1. Sign in to staging at https://smeyatsky.com/gear-staging');
  console.log('2. Navigate to gear management');
  console.log('3. Use the bulk upload feature to upload data/balanced-seed-gear.csv');
  console.log('\nOr use the seed-staging.ts script for API-based seeding.');
}

main().catch(console.error);