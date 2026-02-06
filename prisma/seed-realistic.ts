import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Curated realistic gear data with working placeholder images
const realisticGear = [
  // CAMERAS (5 items)
  {
    title: 'Sony A7S III',
    brand: 'Sony',
    model: 'A7S III',
    category: 'cameras',
    condition: 'like-new',
    description: 'Professional full-frame mirrorless camera optimized for video. 4K 120fps, 10-bit 4:2:2, dual card slots. Perfect for low-light filming, weddings, and commercial work. Includes battery, charger, and strap.',
    dailyRate: 125,
    weeklyRate: 650,
    monthlyRate: 2200,
    replacementValue: 3498,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: true,
    insuranceRate: 0.10,
  },
  {
    title: 'Canon EOS R5',
    brand: 'Canon',
    model: 'EOS R5',
    category: 'cameras',
    condition: 'new',
    description: '45MP full-frame mirrorless powerhouse. 8K RAW video, 12fps continuous shooting, incredible AF system. Ideal for high-resolution stills and professional video production. Weather-sealed body.',
    dailyRate: 150,
    weeklyRate: 800,
    monthlyRate: 2800,
    replacementValue: 3899,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: true,
    insuranceRate: 0.10,
  },
  {
    title: 'Blackmagic Pocket Cinema Camera 6K Pro',
    brand: 'Blackmagic',
    model: 'BMPCC 6K Pro',
    category: 'cameras',
    condition: 'like-new',
    description: 'Super 35 cinema camera with 6K sensor, built-in ND filters, and tilting LCD. Shoots RAW and ProRes. Includes LP-E6 batteries, CFast card, and cage. Perfect for narrative filmmaking.',
    dailyRate: 110,
    weeklyRate: 580,
    monthlyRate: 2000,
    replacementValue: 2495,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: true,
    insuranceRate: 0.10,
  },
  {
    title: 'Panasonic Lumix GH6',
    brand: 'Panasonic',
    model: 'GH6',
    category: 'cameras',
    condition: 'like-new',
    description: 'Micro Four Thirds powerhouse for video creators. 5.7K 60fps, unlimited recording, internal ProRes. Compact, weather-sealed, perfect for run-and-gun documentary work.',
    dailyRate: 95,
    weeklyRate: 500,
    monthlyRate: 1700,
    replacementValue: 2197,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: true,
    insuranceRate: 0.10,
  },
  {
    title: 'Fujifilm X-T4',
    brand: 'Fujifilm',
    model: 'X-T4',
    category: 'cameras',
    condition: 'good',
    description: 'APS-C mirrorless camera with 26MP sensor and in-body stabilization. Beautiful film simulations, 4K 60fps video. Great for hybrid photo/video work and travel content creation.',
    dailyRate: 75,
    weeklyRate: 400,
    monthlyRate: 1350,
    replacementValue: 1699,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },

  // LENSES (5 items)
  {
    title: 'Sony FE 24-70mm f/2.8 GM II',
    brand: 'Sony',
    model: '24-70mm f/2.8 GM II',
    category: 'lenses',
    condition: 'new',
    description: 'Professional standard zoom with fast f/2.8 aperture. Razor-sharp across the frame, excellent for portraits, events, and commercial work. Latest GM II version with improved AF.',
    dailyRate: 65,
    weeklyRate: 340,
    monthlyRate: 1150,
    replacementValue: 2298,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: true,
    insuranceRate: 0.10,
  },
  {
    title: 'Canon RF 85mm f/1.2 L USM',
    brand: 'Canon',
    model: 'RF 85mm f/1.2 L',
    category: 'lenses',
    condition: 'like-new',
    description: 'Ultra-fast portrait lens with stunning bokeh. f/1.2 maximum aperture for incredible subject separation. Weather-sealed L-series build. Perfect for high-end portraits and weddings.',
    dailyRate: 80,
    weeklyRate: 420,
    monthlyRate: 1450,
    replacementValue: 2699,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: true,
    insuranceRate: 0.10,
  },
  {
    title: 'Sigma 50mm f/1.4 DG DN Art',
    brand: 'Sigma',
    model: '50mm f/1.4 DG DN Art',
    category: 'lenses',
    condition: 'like-new',
    description: 'Premium nifty fifty with exceptional optical quality. Compact, fast AF, and stunning sharpness. Available for Sony E and L-mount. Great for video and low-light photography.',
    dailyRate: 40,
    weeklyRate: 210,
    monthlyRate: 720,
    replacementValue: 899,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Tamron 70-200mm f/2.8 G2',
    brand: 'Tamron',
    model: '70-200mm f/2.8 G2',
    category: 'lenses',
    condition: 'good',
    description: 'Telephoto zoom for events, sports, and wildlife. Fast f/2.8 constant aperture, image stabilization, weather-sealed. Lighter than the native options. Includes tripod collar.',
    dailyRate: 50,
    weeklyRate: 260,
    monthlyRate: 900,
    replacementValue: 1299,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Canon RF 16mm f/2.8 STM',
    brand: 'Canon',
    model: 'RF 16mm f/2.8 STM',
    category: 'lenses',
    condition: 'like-new',
    description: 'Ultra-wide pancake lens for landscapes, real estate, and vlogging. Compact and lightweight, perfect for gimbal work. Fast f/2.8 aperture for low light.',
    dailyRate: 25,
    weeklyRate: 130,
    monthlyRate: 450,
    replacementValue: 299,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },

  // LIGHTING (5 items)
  {
    title: 'Aputure 600d Pro',
    brand: 'Aputure',
    model: '600d Pro',
    category: 'lighting',
    condition: 'like-new',
    description: 'Powerful 600W daylight LED. Wireless control, built-in effects, ultra-quiet fans. Includes reflector, barn doors, and flight case. Perfect for interviews and product shoots.',
    dailyRate: 90,
    weeklyRate: 470,
    monthlyRate: 1600,
    replacementValue: 1899,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: true,
    insuranceRate: 0.10,
  },
  {
    title: 'Godox SL-200W II',
    brand: 'Godox',
    model: 'SL-200W II',
    category: 'lighting',
    condition: 'like-new',
    description: '200W LED video light with Bowens mount. 95+ CRI, DMX control, silent operation. Includes softbox and grid. Great for studio and location work.',
    dailyRate: 35,
    weeklyRate: 180,
    monthlyRate: 620,
    replacementValue: 389,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Nanlite Forza 500',
    brand: 'Nanlite',
    model: 'Forza 500',
    category: 'lighting',
    condition: 'new',
    description: 'Compact 500W spotlight with Bowens mount. Powerful output, built-in effects, Bluetooth app control. Includes carrying case and reflector. Ideal for one-light setups.',
    dailyRate: 55,
    weeklyRate: 290,
    monthlyRate: 980,
    replacementValue: 799,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Aputure Amaran 200x S',
    brand: 'Aputure',
    model: 'Amaran 200x S',
    category: 'lighting',
    condition: 'like-new',
    description: 'Bi-color LED point source light. 200W output, accurate colors (CRI 95+), quiet. Bowens mount compatible. Perfect for portable lighting kits.',
    dailyRate: 45,
    weeklyRate: 235,
    monthlyRate: 800,
    replacementValue: 329,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Aputure MC RGBWW 4-Light Kit',
    brand: 'Aputure',
    model: 'MC RGBWW Kit',
    category: 'lighting',
    condition: 'like-new',
    description: 'Pocket-sized RGB LED lights with magnetic mounting. Built-in effects, app control, rechargeable. Includes charging case. Perfect for accents, practicals, and creative lighting.',
    dailyRate: 30,
    weeklyRate: 155,
    monthlyRate: 530,
    replacementValue: 359,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },

  // AUDIO (5 items)
  {
    title: 'Rode NTG5 Shotgun Microphone',
    brand: 'Rode',
    model: 'NTG5',
    category: 'audio',
    condition: 'like-new',
    description: 'Professional short shotgun mic. Ultra-lightweight, broadcast-quality sound, low self-noise. Includes windshield and shock mount. Perfect for boom operation and on-camera use.',
    dailyRate: 35,
    weeklyRate: 180,
    monthlyRate: 620,
    replacementValue: 499,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Rode Wireless GO II Dual System',
    brand: 'Rode',
    model: 'Wireless GO II',
    category: 'audio',
    condition: 'new',
    description: 'Compact dual wireless mic system with onboard recording. 200m range, built-in mics, universal compatibility. Perfect for interviews, YouTube, and event coverage.',
    dailyRate: 40,
    weeklyRate: 210,
    monthlyRate: 720,
    replacementValue: 399,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Zoom F6 Field Recorder',
    brand: 'Zoom',
    model: 'F6',
    category: 'audio',
    condition: 'like-new',
    description: '6-track field recorder with 32-bit float technology. Never worry about clipping again. Timecode, dual SD cards, excellent preamps. Industry-standard for location sound.',
    dailyRate: 50,
    weeklyRate: 260,
    monthlyRate: 900,
    replacementValue: 699,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Sennheiser MKE 600 Shotgun',
    brand: 'Sennheiser',
    model: 'MKE 600',
    category: 'audio',
    condition: 'good',
    description: 'Short shotgun microphone with rugged build. Battery or phantom powered, low self-noise, switchable low-cut filter. Reliable for documentary and ENG work.',
    dailyRate: 25,
    weeklyRate: 130,
    monthlyRate: 450,
    replacementValue: 329,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Sound Devices MixPre-6 II',
    brand: 'Sound Devices',
    model: 'MixPre-6 II',
    category: 'audio',
    condition: 'like-new',
    description: 'Professional 6-input recorder/mixer with 32-bit float recording. Kashmir mic preamps, timecode, USB audio interface. Built for film production and broadcast.',
    dailyRate: 60,
    weeklyRate: 315,
    monthlyRate: 1080,
    replacementValue: 1099,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },

  // DRONES (5 items)
  {
    title: 'DJI Mavic 3 Pro Cine',
    brand: 'DJI',
    model: 'Mavic 3 Pro Cine',
    category: 'drones',
    condition: 'like-new',
    description: 'Triple-camera drone system with Hasselblad main camera. 4/3 CMOS sensor, Apple ProRes 422 HQ, 1TB internal SSD. Includes RC Pro controller and Fly More kit. Perfect for high-end aerial cinematography.',
    dailyRate: 120,
    weeklyRate: 630,
    monthlyRate: 2150,
    replacementValue: 4799,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: true,
    insuranceRate: 0.10,
  },
  {
    title: 'DJI Air 3 Fly More Combo',
    brand: 'DJI',
    model: 'Air 3',
    category: 'drones',
    condition: 'new',
    description: 'Dual-camera foldable drone with 48MP wide and 70mm medium telephoto. 46-minute flight time, omnidirectional obstacle sensing. Includes RC 2 controller and 3 batteries. Great for travel and real estate.',
    dailyRate: 75,
    weeklyRate: 390,
    monthlyRate: 1330,
    replacementValue: 1549,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: true,
    insuranceRate: 0.10,
  },
  {
    title: 'DJI Mini 4 Pro',
    brand: 'DJI',
    model: 'Mini 4 Pro',
    category: 'drones',
    condition: 'like-new',
    description: 'Under 249g drone with 4K/60fps HDR video. Omnidirectional obstacle avoidance, ActiveTrack 360°, 34-minute flight time. No FAA registration required (US). Perfect for content creators.',
    dailyRate: 50,
    weeklyRate: 260,
    monthlyRate: 900,
    replacementValue: 759,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'DJI FPV Combo',
    brand: 'DJI',
    model: 'FPV',
    category: 'drones',
    condition: 'good',
    description: 'First-person view racing drone with 4K/60fps stabilized video. 0-100km/h in 2s, immersive goggles, Emergency Brake button. Includes motion controller and extra props. For experienced pilots.',
    dailyRate: 65,
    weeklyRate: 340,
    monthlyRate: 1150,
    replacementValue: 1299,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: true,
    insuranceRate: 0.10,
  },
  {
    title: 'DJI Inspire 3',
    brand: 'DJI',
    model: 'Inspire 3',
    category: 'drones',
    condition: 'new',
    description: 'Professional cinema drone with full-frame 8K camera. Centimeter-level RTK positioning, 360° obstacle avoidance, dual operator mode. Includes Zenmuse X9-8K Air gimbal and CineSSD. For Hollywood-grade aerial production.',
    dailyRate: 250,
    weeklyRate: 1300,
    monthlyRate: 4500,
    replacementValue: 16499,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: true,
    insuranceRate: 0.10,
  },

  // TRIPODS (5 items)
  {
    title: 'Manfrotto 546B Pro Video Tripod',
    brand: 'Manfrotto',
    model: '546B',
    category: 'tripods',
    condition: 'good',
    description: 'Professional video tripod with ground spreader. Supports up to 30kg, mid-level spreader, padded bag included. Reliable for cinema cameras and heavy setups.',
    dailyRate: 25,
    weeklyRate: 130,
    monthlyRate: 450,
    replacementValue: 389,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Sachtler Video 18 S2 Fluid Head',
    brand: 'Sachtler',
    model: 'Video 18 S2',
    category: 'tripods',
    condition: 'like-new',
    description: 'Premium fluid head for broadcast cameras. 0-18kg payload, 7+0 counterbalance, Speedbalance technology. Buttery-smooth pans and tilts. Industry standard for ENG work.',
    dailyRate: 55,
    weeklyRate: 290,
    monthlyRate: 980,
    replacementValue: 1995,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Peak Design Travel Tripod Carbon',
    brand: 'Peak Design',
    model: 'Travel Tripod Carbon',
    category: 'tripods',
    condition: 'like-new',
    description: 'Ultra-compact carbon fiber tripod that packs down to the size of a water bottle. Supports 20kg, includes ball head and hex tool. Perfect for travel photographers and hybrid shooters.',
    dailyRate: 20,
    weeklyRate: 105,
    monthlyRate: 360,
    replacementValue: 649,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Manfrotto 502AH Video Head',
    brand: 'Manfrotto',
    model: '502AH',
    category: 'tripods',
    condition: 'good',
    description: 'Pro fluid head with flat base. Supports 7kg, variable fluid drag, quick-release plate. Compact and versatile for mirrorless and DSLR video work.',
    dailyRate: 18,
    weeklyRate: 95,
    monthlyRate: 320,
    replacementValue: 259,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Benro S8 Pro Video Head',
    brand: 'Benro',
    model: 'S8 Pro',
    category: 'tripods',
    condition: 'like-new',
    description: 'Fluid video head with 8kg capacity. Continuous counterbalance adjustment, dual pan handles, Arca-Swiss compatible. Great value for professional video work.',
    dailyRate: 22,
    weeklyRate: 115,
    monthlyRate: 390,
    replacementValue: 349,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },

  // MONITORS (5 items)
  {
    title: 'Atomos Ninja V+',
    brand: 'Atomos',
    model: 'Ninja V+',
    category: 'monitors',
    condition: 'like-new',
    description: '5" HDR monitor/recorder with 8K RAW support. Records ProRes RAW, ProRes, and H.265. Includes AtomX battery eliminator and travel case. Essential for professional video workflows.',
    dailyRate: 55,
    weeklyRate: 290,
    monthlyRate: 980,
    replacementValue: 799,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'SmallHD Focus Pro 5"',
    brand: 'SmallHD',
    model: 'Focus Pro 5"',
    category: 'monitors',
    condition: 'new',
    description: 'Touchscreen on-camera monitor with 1920x1080 resolution. Built-in scopes, 3D LUTs, SDI/HDMI. Includes sun hood and tilt arm. Perfect for focus pullers and solo operators.',
    dailyRate: 45,
    weeklyRate: 235,
    monthlyRate: 800,
    replacementValue: 649,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Feelworld LUT7S Pro 7"',
    brand: 'Feelworld',
    model: 'LUT7S Pro',
    category: 'monitors',
    condition: 'like-new',
    description: '7" touchscreen monitor with 1920x1200 IPS panel. 4K HDMI input, waveform, vectorscope, 3D LUT support. Includes F970 battery adapter and sun hood. Budget-friendly professional features.',
    dailyRate: 25,
    weeklyRate: 130,
    monthlyRate: 450,
    replacementValue: 289,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Portkeys PT5 II 5.5"',
    brand: 'Portkeys',
    model: 'PT5 II',
    category: 'monitors',
    condition: 'like-new',
    description: 'Compact director monitor with 4K HDMI loop-through. 1920x1080 touchscreen, built-in battery, exposure tools. Wireless camera control for select cameras. Great for gimbal work.',
    dailyRate: 30,
    weeklyRate: 155,
    monthlyRate: 530,
    replacementValue: 359,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Blackmagic Video Assist 7" 12G',
    brand: 'Blackmagic',
    model: 'Video Assist 7" 12G',
    category: 'monitors',
    condition: 'like-new',
    description: '7" HDR monitor/recorder with 12G-SDI. Records ProRes and Blackmagic RAW. Scopes, LUTs, dual SD card slots. Professional-grade monitoring and recording solution.',
    dailyRate: 60,
    weeklyRate: 315,
    monthlyRate: 1080,
    replacementValue: 995,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },

  // ACCESSORIES (5 items)
  {
    title: 'Teradek Bolt 4K LT 750 TX/RX',
    brand: 'Teradek',
    model: 'Bolt 4K LT 750',
    category: 'accessories',
    condition: 'like-new',
    description: 'Zero-delay 4K wireless video system. 750ft range, HDMI/SDI, <1ms latency. Includes transmitter, receiver, and batteries. Essential for client monitoring and wireless director viewing.',
    dailyRate: 85,
    weeklyRate: 445,
    monthlyRate: 1520,
    replacementValue: 2490,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: true,
    insuranceRate: 0.10,
  },
  {
    title: 'Tilta Nucleus-M Wireless Follow Focus',
    brand: 'Tilta',
    model: 'Nucleus-M',
    category: 'accessories',
    condition: 'like-new',
    description: 'Professional wireless follow focus system. 1000ft range, 3-axis control (focus/iris/zoom), FIZ hand unit. Includes motor, controller, and mounts. Perfect for narrative and commercial work.',
    dailyRate: 75,
    weeklyRate: 390,
    monthlyRate: 1330,
    replacementValue: 1499,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: true,
    insuranceRate: 0.10,
  },
  {
    title: 'Tiffen Variable ND Filter (77mm)',
    brand: 'Tiffen',
    model: 'Variable ND 77mm',
    category: 'accessories',
    condition: 'like-new',
    description: '2-8 stop variable neutral density filter. Cinema-grade glass, minimal color shift, 77mm thread (includes step-up rings). Essential for shooting wide-open in bright conditions.',
    dailyRate: 18,
    weeklyRate: 95,
    monthlyRate: 320,
    replacementValue: 249,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'Core SWX Helix V-Mount Battery (98Wh)',
    brand: 'Core SWX',
    model: 'Helix 98Wh',
    category: 'accessories',
    condition: 'like-new',
    description: 'V-Mount battery with 98Wh capacity. D-Tap, USB-C PD, built-in charger. TSA-compliant for air travel. Includes V-mount plate. Powers cameras, monitors, and wireless systems.',
    dailyRate: 15,
    weeklyRate: 80,
    monthlyRate: 270,
    replacementValue: 349,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
  {
    title: 'SmallRig Universal Camera Cage',
    brand: 'SmallRig',
    model: 'Universal Cage',
    category: 'accessories',
    condition: 'good',
    description: 'Modular camera cage with NATO rails and cold shoe mounts. 1/4"-20 and 3/8"-16 threads throughout. Protects camera and provides mounting points for accessories. Fits most mirrorless cameras.',
    dailyRate: 12,
    weeklyRate: 65,
    monthlyRate: 220,
    replacementValue: 89,
    images: JSON.stringify([
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/600'
    ]),
    insuranceRequired: false,
    insuranceRate: 0.10,
  },
];

// User definitions for realistic owners
const OWNER_IDS = [
  'realistic-owner-1',
  'realistic-owner-2',
  'realistic-owner-3',
  'realistic-owner-4',
  'realistic-owner-5',
];

const ownerProfiles = [
  { name: 'Marcus Rivera', city: 'Los Angeles', state: 'CA', bio: 'Cinematographer and camera department head with 12 years in the industry. All gear meticulously maintained and available with comprehensive insurance.' },
  { name: 'Sarah Chen', city: 'New York', state: 'NY', bio: 'Commercial director of photography. Offering my personal kit between projects. Everything is production-ready and ships insured nationwide.' },
  { name: 'Jordan Blake', city: 'Austin', state: 'TX', bio: 'Gear enthusiast and owner of a boutique rental house. Specializing in cinema lenses and lighting packages. FAA Part 107 certified for drone work.' },
  { name: 'Aisha Patel', city: 'San Francisco', state: 'CA', bio: 'Tech industry video producer. Constantly upgrading to the latest equipment. My gear is well-documented and always ready to ship same-day.' },
  { name: 'Chris Thompson', city: 'Atlanta', state: 'GA', bio: 'Documentary filmmaker and educator. Sharing my professional kit with the next generation of creators. Pickup available in metro Atlanta.' },
];

async function main() {
  console.log('Starting realistic seed data import...\n');

  // Clean up all existing seed data
  console.log('Cleaning up all previous seed data...');
  await prisma.rental.deleteMany({});
  await prisma.gear.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✓ Cleanup complete.\n');

  // Create realistic owner accounts
  console.log('Creating 5 realistic gear owners...');
  const owners = await Promise.all(
    ownerProfiles.map((profile, i) =>
      prisma.user.create({
        data: {
          id: OWNER_IDS[i],
          email: `${profile.name.toLowerCase().replace(' ', '.')}@gearshare.example.com`,
          full_name: profile.name,
          bio: profile.bio,
          city: profile.city,
          state: profile.state,
          verificationStatus: 'VERIFIED',
          trustScore: 95.0 + i,
          completedRentals: 25 + (i * 10),
          averageRating: 4.8 + (i * 0.04),
          totalReviews: 15 + (i * 5),
        },
      })
    )
  );
  owners.forEach(u => console.log(`  ✓ ${u.full_name} (${u.email})`));

  // Create gear items (5 per category, distributed across owners)
  console.log('\nCreating 45 realistic gear items (5 per category)...');
  const gearByCategory: Record<string, number> = {};

  for (let i = 0; i < realisticGear.length; i++) {
    const gearData = realisticGear[i];
    const ownerIndex = i % OWNER_IDS.length;
    const owner = owners[ownerIndex];

    await prisma.gear.create({
      data: {
        ...gearData,
        userId: owner.id,
        city: owner.city!,
        state: owner.state!,
      },
    });

    gearByCategory[gearData.category] = (gearByCategory[gearData.category] || 0) + 1;
    console.log(`  ✓ ${gearData.title} (${gearData.category}) - owned by ${owner.full_name}`);
  }

  // Summary
  console.log('\n✅ Realistic seed data import complete!');
  console.log(`  Owners: ${owners.length}`);
  console.log(`  Gear items: ${realisticGear.length}`);
  console.log('\n  Items by category:');
  Object.entries(gearByCategory)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([cat, count]) => console.log(`    ${cat}: ${count}`));
  console.log('\n  All items have accurate images, realistic pricing, and proper descriptions.');
  console.log('  Ready for client demos! 🚀\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
