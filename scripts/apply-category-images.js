const fs = require('fs');
const path = require('path');

// Specific image URLs for each of the 40 items
// Using Unsplash source API with unique search terms per item
const imageUrls = {
  // CAMERAS - 5 unique camera images
  'Sony A7S III': [
    'https://source.unsplash.com/800x600/?sony,camera,mirrorless',
    'https://source.unsplash.com/800x600/?sony,a7,professional'
  ],
  'Canon EOS R5': [
    'https://source.unsplash.com/800x600/?canon,camera,eos',
    'https://source.unsplash.com/800x600/?canon,mirrorless,professional'
  ],
  'Blackmagic Pocket Cinema Camera 6K Pro': [
    'https://source.unsplash.com/800x600/?cinema,camera,blackmagic',
    'https://source.unsplash.com/800x600/?video,camera,professional'
  ],
  'Panasonic Lumix GH6': [
    'https://source.unsplash.com/800x600/?panasonic,camera,lumix',
    'https://source.unsplash.com/800x600/?micro,four,thirds'
  ],
  'Fujifilm X-T4': [
    'https://source.unsplash.com/800x600/?fujifilm,camera,xt',
    'https://source.unsplash.com/800x600/?fuji,mirrorless,vintage'
  ],

  // LENSES - 5 unique lens images
  'Sony FE 24-70mm f/2.8 GM II': [
    'https://source.unsplash.com/800x600/?camera,lens,zoom',
    'https://source.unsplash.com/800x600/?sony,lens,professional'
  ],
  'Canon RF 85mm f/1.2 L USM': [
    'https://source.unsplash.com/800x600/?canon,lens,portrait',
    'https://source.unsplash.com/800x600/?prime,lens,photography'
  ],
  'Sigma 50mm f/1.4 DG DN Art': [
    'https://source.unsplash.com/800x600/?sigma,lens,art',
    'https://source.unsplash.com/800x600/?50mm,lens,prime'
  ],
  'Tamron 70-200mm f/2.8 G2': [
    'https://source.unsplash.com/800x600/?tamron,lens,telephoto',
    'https://source.unsplash.com/800x600/?zoom,lens,70-200'
  ],
  'Canon RF 16mm f/2.8 STM': [
    'https://source.unsplash.com/800x600/?wide,angle,lens',
    'https://source.unsplash.com/800x600/?ultrawide,lens,16mm'
  ],

  // LIGHTING - 5 unique lighting images
  'Aputure 600d Pro': [
    'https://source.unsplash.com/800x600/?studio,lighting,led',
    'https://source.unsplash.com/800x600/?aputure,light,professional'
  ],
  'Godox SL-200W II': [
    'https://source.unsplash.com/800x600/?godox,lighting,studio',
    'https://source.unsplash.com/800x600/?continuous,lighting,video'
  ],
  'Nanlite Forza 500': [
    'https://source.unsplash.com/800x600/?nanlite,lighting,spotlight',
    'https://source.unsplash.com/800x600/?led,panel,light'
  ],
  'Aputure Amaran 200x S': [
    'https://source.unsplash.com/800x600/?bicolor,lighting,portable',
    'https://source.unsplash.com/800x600/?point,source,light'
  ],
  'Aputure MC RGBWW 4-Light Kit': [
    'https://source.unsplash.com/800x600/?rgb,lighting,portable',
    'https://source.unsplash.com/800x600/?compact,led,kit'
  ],

  // AUDIO - 5 unique audio equipment images
  'Rode NTG5 Shotgun Microphone': [
    'https://source.unsplash.com/800x600/?rode,microphone,shotgun',
    'https://source.unsplash.com/800x600/?boom,microphone,audio'
  ],
  'Rode Wireless GO II Dual System': [
    'https://source.unsplash.com/800x600/?wireless,microphone,lavalier',
    'https://source.unsplash.com/800x600/?rode,wireless,audio'
  ],
  'Zoom F6 Field Recorder': [
    'https://source.unsplash.com/800x600/?zoom,recorder,audio',
    'https://source.unsplash.com/800x600/?field,recorder,professional'
  ],
  'Sennheiser MKE 600 Shotgun': [
    'https://source.unsplash.com/800x600/?sennheiser,microphone,professional',
    'https://source.unsplash.com/800x600/?shotgun,mic,video'
  ],
  'Sound Devices MixPre-6 II': [
    'https://source.unsplash.com/800x600/?sound,devices,mixer',
    'https://source.unsplash.com/800x600/?audio,interface,recorder'
  ],

  // DRONES - 5 unique drone images
  'DJI Mavic 3 Pro Cine': [
    'https://source.unsplash.com/800x600/?dji,mavic,drone',
    'https://source.unsplash.com/800x600/?professional,drone,cinema'
  ],
  'DJI Air 3 Fly More Combo': [
    'https://source.unsplash.com/800x600/?dji,air,quadcopter',
    'https://source.unsplash.com/800x600/?compact,drone,travel'
  ],
  'DJI Mini 4 Pro': [
    'https://source.unsplash.com/800x600/?dji,mini,drone',
    'https://source.unsplash.com/800x600/?small,drone,portable'
  ],
  'DJI FPV Combo': [
    'https://source.unsplash.com/800x600/?fpv,drone,racing',
    'https://source.unsplash.com/800x600/?first,person,drone'
  ],
  'DJI Inspire 3': [
    'https://source.unsplash.com/800x600/?dji,inspire,professional',
    'https://source.unsplash.com/800x600/?cinema,drone,broadcast'
  ],

  // TRIPODS - 5 unique tripod images
  'Manfrotto 546B Pro Video Tripod': [
    'https://source.unsplash.com/800x600/?manfrotto,tripod,video',
    'https://source.unsplash.com/800x600/?professional,tripod,heavy'
  ],
  'Sachtler Video 18 S2 Fluid Head': [
    'https://source.unsplash.com/800x600/?sachtler,fluid,head',
    'https://source.unsplash.com/800x600/?video,head,broadcast'
  ],
  'Peak Design Travel Tripod Carbon': [
    'https://source.unsplash.com/800x600/?peak,design,tripod',
    'https://source.unsplash.com/800x600/?carbon,tripod,compact'
  ],
  'Manfrotto 502AH Video Head': [
    'https://source.unsplash.com/800x600/?video,head,manfrotto',
    'https://source.unsplash.com/800x600/?fluid,head,photography'
  ],
  'Benro S8 Pro Video Head': [
    'https://source.unsplash.com/800x600/?benro,tripod,head',
    'https://source.unsplash.com/800x600/?professional,video,support'
  ],

  // MONITORS - 5 unique monitor images
  'Atomos Ninja V+': [
    'https://source.unsplash.com/800x600/?atomos,monitor,recorder',
    'https://source.unsplash.com/800x600/?field,monitor,video'
  ],
  'SmallHD Focus Pro 5"': [
    'https://source.unsplash.com/800x600/?smallhd,monitor,focus',
    'https://source.unsplash.com/800x600/?on,camera,monitor'
  ],
  'Feelworld LUT7S Pro 7"': [
    'https://source.unsplash.com/800x600/?feelworld,monitor,touchscreen',
    'https://source.unsplash.com/800x600/?camera,monitor,7inch'
  ],
  'Portkeys PT5 II 5.5"': [
    'https://source.unsplash.com/800x600/?portkeys,monitor,compact',
    'https://source.unsplash.com/800x600/?small,monitor,video'
  ],
  'Blackmagic Video Assist 7" 12G': [
    'https://source.unsplash.com/800x600/?blackmagic,video,assist',
    'https://source.unsplash.com/800x600/?monitor,recorder,12g'
  ],

  // ACCESSORIES - 5 unique accessory images
  'Teradek Bolt 4K LT 750 TX/RX': [
    'https://source.unsplash.com/800x600/?teradek,wireless,video',
    'https://source.unsplash.com/800x600/?wireless,transmitter,hdmi'
  ],
  'Tilta Nucleus-M Wireless Follow Focus': [
    'https://source.unsplash.com/800x600/?tilta,follow,focus',
    'https://source.unsplash.com/800x600/?wireless,focus,cinema'
  ],
  'Tiffen Variable ND Filter (77mm)': [
    'https://source.unsplash.com/800x600/?tiffen,filter,nd',
    'https://source.unsplash.com/800x600/?variable,nd,filter'
  ],
  'Core SWX Helix V-Mount Battery (98Wh)': [
    'https://source.unsplash.com/800x600/?vmount,battery,power',
    'https://source.unsplash.com/800x600/?cinema,battery,professional'
  ],
  'SmallRig Universal Camera Cage': [
    'https://source.unsplash.com/800x600/?smallrig,cage,rig',
    'https://source.unsplash.com/800x600/?camera,cage,accessories'
  ],
};

// Read seed file
const seedPath = path.join(__dirname, '../prisma/seed-realistic.ts');
let content = fs.readFileSync(seedPath, 'utf8');

// Replace images for each product
Object.entries(imageUrls).forEach(([title, urls]) => {
  // Find the product entry and replace its images
  const titlePattern = new RegExp(`title: '${title.replace(/[()]/g, '\\$&')}'`, 'g');
  const matches = content.match(titlePattern);

  if (matches) {
    // Find the images array after this title
    const titleIndex = content.indexOf(`title: '${title}'`);
    const imagesStart = content.indexOf('images: JSON.stringify([', titleIndex);
    const imagesEnd = content.indexOf(']),', imagesStart);

    if (imagesStart > -1 && imagesEnd > -1) {
      const oldImages = content.substring(imagesStart, imagesEnd + 3);
      const newImages = `images: JSON.stringify([\n      '${urls[0]}',\n      '${urls[1]}'\n    ]),`;
      content = content.replace(oldImages, newImages);
    }
  }
});

fs.writeFileSync(seedPath, content);
console.log('✅ Updated all 40 items with unique, category-specific Unsplash images!');
