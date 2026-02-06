const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '../prisma/seed-realistic.ts');
let content = fs.readFileSync(seedPath, 'utf8');

// Use picsum.photos for reliable actual photos
// Different ID ranges for different equipment types
const imagesByCategory = {
  cameras: [
    'https://picsum.photos/seed/camera1/800/600',
    'https://picsum.photos/seed/camera2/800/600',
    'https://picsum.photos/seed/camera3/800/600',
    'https://picsum.photos/seed/camera4/800/600',
    'https://picsum.photos/seed/camera5/800/600',
  ],
  lenses: [
    'https://picsum.photos/seed/lens1/800/600',
    'https://picsum.photos/seed/lens2/800/600',
    'https://picsum.photos/seed/lens3/800/600',
    'https://picsum.photos/seed/lens4/800/600',
    'https://picsum.photos/seed/lens5/800/600',
  ],
  lighting: [
    'https://picsum.photos/seed/light1/800/600',
    'https://picsum.photos/seed/light2/800/600',
    'https://picsum.photos/seed/light3/800/600',
    'https://picsum.photos/seed/light4/800/600',
    'https://picsum.photos/seed/light5/800/600',
  ],
  audio: [
    'https://picsum.photos/seed/audio1/800/600',
    'https://picsum.photos/seed/audio2/800/600',
    'https://picsum.photos/seed/audio3/800/600',
    'https://picsum.photos/seed/audio4/800/600',
    'https://picsum.photos/seed/audio5/800/600',
  ],
  drones: [
    'https://picsum.photos/seed/drone1/800/600',
    'https://picsum.photos/seed/drone2/800/600',
    'https://picsum.photos/seed/drone3/800/600',
    'https://picsum.photos/seed/drone4/800/600',
    'https://picsum.photos/seed/drone5/800/600',
  ],
  tripods: [
    'https://picsum.photos/seed/tripod1/800/600',
    'https://picsum.photos/seed/tripod2/800/600',
    'https://picsum.photos/seed/tripod3/800/600',
    'https://picsum.photos/seed/tripod4/800/600',
    'https://picsum.photos/seed/tripod5/800/600',
  ],
  monitors: [
    'https://picsum.photos/seed/monitor1/800/600',
    'https://picsum.photos/seed/monitor2/800/600',
    'https://picsum.photos/seed/monitor3/800/600',
    'https://picsum.photos/seed/monitor4/800/600',
    'https://picsum.photos/seed/monitor5/800/600',
  ],
  accessories: [
    'https://picsum.photos/seed/accessory1/800/600',
    'https://picsum.photos/seed/accessory2/800/600',
    'https://picsum.photos/seed/accessory3/800/600',
    'https://picsum.photos/seed/accessory4/800/600',
    'https://picsum.photos/seed/accessory5/800/600',
  ],
};

// Replace placehold.co URLs with picsum URLs
Object.entries(imagesByCategory).forEach(([category, urls]) => {
  urls.forEach((url, index) => {
    const placeholderPattern = new RegExp(
      `https://placehold\\.co/800x600/[^?]+\\?text=[^']+`,
      'g'
    );
    // This is a simplified approach - would need more sophisticated matching
  });
});

// Actually, let's do a simpler regex replacement
content = content.replace(
  /https:\/\/placehold\.co\/800x600\/[^'"]+/g,
  (match, offset) => {
    // Determine category based on surrounding context
    const before = content.substring(Math.max(0, offset - 300), offset);
    const categoryMatch = before.match(/category: '([^']+)'/);

    if (categoryMatch) {
      const category = categoryMatch[1];
      const itemCount = (before.match(/title:/g) || []).length % 5;
      return imagesByCategory[category]?.[itemCount] || 'https://picsum.photos/800/600';
    }

    return 'https://picsum.photos/800/600';
  }
);

fs.writeFileSync(seedPath, content);
console.log('✅ Updated seed file with actual picsum.photos images!');
