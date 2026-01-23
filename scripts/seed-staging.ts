/**
 * Seed staging environment via API
 *
 * This script authenticates with Supabase and uploads seed data
 * using the bulk upload API endpoint.
 *
 * Usage:
 *   npx tsx scripts/seed-staging.ts
 *
 * Environment variables required:
 *   STAGING_URL - Base URL for staging (default: https://smeyatsky.com/gear-staging)
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_ANON_KEY - Supabase anon key
 *   SEED_USER_EMAIL - Email for seed user account
 *   SEED_USER_PASSWORD - Password for seed user account
 *
 * Create a .env.staging file with these values.
 */

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import * as path from 'path';

// Load environment from .env.staging if it exists
const envFile = path.join(process.cwd(), '.env.staging');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const STAGING_URL = process.env.STAGING_URL || 'https://smeyatsky.com/gear-staging';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SEED_EMAIL = process.env.SEED_USER_EMAIL;
const SEED_PASSWORD = process.env.SEED_USER_PASSWORD;

const categories = ['cameras', 'lenses', 'drones', 'lighting', 'audio', 'tripods', 'accessories', 'stabilizers', 'monitors'];
const conditions = ['new', 'like-new', 'good', 'fair', 'worn'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol'];
const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH', 'GA', 'NC', 'UK', 'UK', 'UK', 'UK', 'UK'];
const brands = ['Canon', 'Sony', 'DJI', 'Godox', 'Rode', 'Manfrotto', 'Atomos', 'Blackmagic', 'Aputure', 'Nikon', 'Fujifilm', 'Panasonic', 'RED', 'ARRI', 'Zeiss'];

const equipmentNames: Record<string, string[]> = {
  cameras: ['EOS R5', 'A7S III', 'FX3', 'GH6', 'BMPCC 6K', 'Komodo', 'C70', 'Z Cam E2', 'Pocket Cinema', 'Lumix S5'],
  lenses: ['24-70mm f/2.8', '70-200mm f/2.8', '50mm f/1.4', '85mm f/1.8', '35mm f/1.4', '16-35mm f/4', '24mm f/1.4', '100mm Macro', '14mm f/2.8', '135mm f/2'],
  drones: ['Mavic 3 Pro', 'Air 3', 'Mini 4 Pro', 'Inspire 3', 'FPV Combo', 'Avata 2', 'Phantom 4 Pro', 'Matrice 350', 'Autel EVO II', 'Skydio 2+'],
  lighting: ['Aputure 600d', 'Godox VL150', 'Nanlite Forza', 'Falcon Eyes', 'Amaran 200d', 'Aperture MC', 'RGB Panel', 'Softbox Kit', 'Ring Light Pro', 'LED Fresnel'],
  audio: ['NTG5', 'MKE 600', 'Wireless GO II', 'F6 Recorder', 'MixPre-6', 'NTR Ribbon', 'VideoMic Pro+', 'Lav Mic Kit', 'Boom Pole Kit', 'Wireless System'],
  tripods: ['Video Tripod', 'Carbon Fiber', 'Fluid Head', 'Travel Tripod', 'Heavy Duty', 'Monopod Pro', 'Slider Combo', 'Dolly System', 'Jib Arm', 'Crane Stand'],
  accessories: ['V-Mount Battery', 'Monitor Arm', 'Camera Cage', 'Follow Focus', 'Matte Box', 'ND Filter Set', 'Memory Card Kit', 'Cable Kit', 'Rain Cover', 'Pelican Case'],
  stabilizers: ['RS 3 Pro', 'Crane 3S', 'Weebill 2', 'Moza Air 2', 'Ronin 4D', 'Gimbal Kit', 'Steadicam', 'Glidecam HD', 'Zhiyun Crane', 'Freefly MoVI'],
  monitors: ['Atomos Ninja', 'SmallHD Focus', 'Shinobi 7', 'Feelworld F6', 'TVLogic', 'Director Monitor', 'HDR Monitor', 'Waveform Monitor', 'Field Monitor', 'Reference Display'],
};

function generateGearItem(index: number): Record<string, string> {
  const category = faker.helpers.arrayElement(categories);
  const brand = faker.helpers.arrayElement(brands);
  const equipment = faker.helpers.arrayElement(equipmentNames[category]);
  const cityIndex = faker.number.int({ min: 0, max: cities.length - 1 });
  const condition = faker.helpers.arrayElement(conditions);

  const dailyRate = faker.number.float({ min: 15, max: 250, fractionDigits: 2 });
  const weeklyRate = parseFloat((dailyRate * 5.5).toFixed(2));
  const monthlyRate = parseFloat((dailyRate * 20).toFixed(2));
  const replacementValue = faker.number.float({ min: dailyRate * 30, max: dailyRate * 100, fractionDigits: 2 });

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

function generateCSV(count: number): string {
  const items = Array.from({ length: count }, (_, i) => generateGearItem(i));
  const headers = Object.keys(items[0]);

  const rows = items.map(item =>
    headers.map(header => {
      const value = item[header];
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

async function authenticateUser(): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  }

  if (!SEED_EMAIL || !SEED_PASSWORD) {
    throw new Error('Missing SEED_USER_EMAIL or SEED_USER_PASSWORD environment variables');
  }

  console.log('Authenticating with Supabase...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: SEED_EMAIL,
    password: SEED_PASSWORD,
  });

  if (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }

  if (!data.session?.access_token) {
    throw new Error('No access token received');
  }

  console.log('Authentication successful!');
  return data.session.access_token;
}

async function uploadBulkData(accessToken: string, csvContent: string): Promise<void> {
  console.log('Uploading bulk data to staging...');

  const formData = new FormData();
  const blob = new Blob([csvContent], { type: 'text/csv' });
  formData.append('file', blob, 'seed-data.csv');

  const response = await fetch(`${STAGING_URL}/api/gear/bulk`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`Bulk upload failed: ${JSON.stringify(result)}`);
  }

  console.log('Bulk upload result:', result);
}

async function main() {
  const count = parseInt(process.argv[2] || '100', 10);

  console.log(`\n=== Staging Seed Script ===`);
  console.log(`Staging URL: ${STAGING_URL}`);
  console.log(`Items to seed: ${count}\n`);

  // Check if we should just generate CSV or also upload
  const generateOnly = process.argv.includes('--generate-only');

  const csvContent = generateCSV(count);

  if (generateOnly) {
    // Just save CSV to file
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const outputPath = path.join(dataDir, 'seed-gear.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf-8');
    console.log(`CSV generated: ${outputPath}`);
    console.log('Use the bulk upload UI or run without --generate-only to upload via API.');
    return;
  }

  try {
    // Authenticate and upload
    const accessToken = await authenticateUser();
    await uploadBulkData(accessToken, csvContent);
    console.log(`\nSuccessfully seeded ${count} items to staging!`);
  } catch (error) {
    console.error('Seeding failed:', error);
    console.log('\nTo seed without API authentication:');
    console.log('1. Run: npx tsx scripts/seed-staging.ts --generate-only');
    console.log('2. Upload data/seed-gear.csv via the staging UI');
    process.exit(1);
  }
}

main().catch(console.error);
