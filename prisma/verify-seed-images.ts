/**
 * Verifies that all gear images in the database exist on disk and are valid JPEGs.
 * Also checks that seed source images are present.
 *
 * Run: npx tsx prisma/verify-seed-images.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SEED_IMAGES_DIR = path.join(__dirname, 'seed-images');
const CATEGORIES = ['cameras', 'lenses', 'lighting', 'audio', 'drones', 'tripods', 'monitors', 'accessories'];

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

async function main() {
  console.log('Verifying seed images...\n');

  // 1. Check seed source images exist (prisma/seed-images/{category}/{1-10}.jpg)
  console.log('[1] Seed source images (prisma/seed-images/)');
  for (const category of CATEGORIES) {
    const categoryDir = path.join(SEED_IMAGES_DIR, category);
    assert(fs.existsSync(categoryDir), `Directory missing: seed-images/${category}/`);

    for (let i = 1; i <= 10; i++) {
      const imgPath = path.join(categoryDir, `${i}.jpg`);
      const exists = fs.existsSync(imgPath);
      assert(exists, `Missing: seed-images/${category}/${i}.jpg`);

      if (exists) {
        const stat = fs.statSync(imgPath);
        assert(stat.size > 1000, `Too small (${stat.size}B): seed-images/${category}/${i}.jpg`);

        // Check JPEG magic bytes
        const buf = Buffer.alloc(3);
        const fd = fs.openSync(imgPath, 'r');
        fs.readSync(fd, buf, 0, 3, 0);
        fs.closeSync(fd);
        const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
        assert(isJpeg, `Not a valid JPEG: seed-images/${category}/${i}.jpg`);
      }
    }
  }
  console.log(`  ${CATEGORIES.length} categories, 10 images each\n`);

  // 2. Check database gear records have valid image URLs
  console.log('[2] Database gear image records');
  const allGear = await prisma.gear.findMany({
    select: { id: true, title: true, category: true, images: true },
  });

  assert(allGear.length === 40, `Expected 40 gear items, found ${allGear.length}`);

  let totalImages = 0;
  const missingFiles: string[] = [];

  for (const gear of allGear) {
    // Parse images JSON
    let images: string[];
    try {
      images = JSON.parse(gear.images);
      assert(Array.isArray(images), `${gear.title}: images is not an array`);
      assert(images.length === 2, `${gear.title}: expected 2 images, got ${images.length}`);
    } catch {
      assert(false, `${gear.title}: invalid images JSON: ${gear.images}`);
      continue;
    }

    for (const imgUrl of images) {
      totalImages++;

      // Check URL format
      assert(
        imgUrl.startsWith('/uploads/gear-images/'),
        `${gear.title}: unexpected URL format: ${imgUrl}`
      );

      // Check file exists on disk
      const filePath = path.join(PUBLIC_DIR, imgUrl);
      const exists = fs.existsSync(filePath);
      assert(exists, `${gear.title}: file not found: ${imgUrl}`);

      if (!exists) {
        missingFiles.push(`${gear.title}: ${imgUrl}`);
        continue;
      }

      // Check it's a valid JPEG
      const stat = fs.statSync(filePath);
      assert(stat.size > 1000, `${gear.title}: image too small (${stat.size}B): ${imgUrl}`);

      const buf = Buffer.alloc(3);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buf, 0, 3, 0);
      fs.closeSync(fd);
      const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
      assert(isJpeg, `${gear.title}: not a valid JPEG: ${imgUrl}`);
    }
  }
  console.log(`  ${allGear.length} gear items, ${totalImages} image URLs checked\n`);

  // 3. Check upload directory state
  console.log('[3] Upload directory (public/uploads/gear-images/)');
  const uploadDir = path.join(PUBLIC_DIR, 'uploads', 'gear-images');
  assert(fs.existsSync(uploadDir), 'Upload directory missing');

  const uploadedFiles = fs.readdirSync(uploadDir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));
  assert(uploadedFiles.length >= 80, `Expected >= 80 uploaded images, found ${uploadedFiles.length}`);
  console.log(`  ${uploadedFiles.length} image files in upload directory\n`);

  // 4. Check all categories are represented
  console.log('[4] Category coverage');
  const categoryCounts: Record<string, number> = {};
  for (const gear of allGear) {
    categoryCounts[gear.category!] = (categoryCounts[gear.category!] || 0) + 1;
  }
  for (const category of CATEGORIES) {
    assert(categoryCounts[category] === 5, `${category}: expected 5 items, got ${categoryCounts[category] || 0}`);
  }
  console.log(`  ${Object.keys(categoryCounts).length} categories verified\n`);

  // Summary
  console.log('=========================================');
  if (failed === 0) {
    console.log(`ALL PASSED (${passed} checks)`);
  } else {
    console.log(`FAILED: ${failed} failures out of ${passed + failed} checks`);
  }
  console.log('=========================================');

  if (missingFiles.length > 0) {
    console.log('\nMissing files:');
    missingFiles.forEach(f => console.log(`  - ${f}`));
  }

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Verification error:', e);
  process.exit(1);
});
