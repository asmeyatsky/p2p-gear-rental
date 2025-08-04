import { NextResponse } from 'next/server';

const dummyGear = {
  '1': {
    id: '1',
    title: 'Canon EOS R5',
    description: 'A high-performance mirrorless camera with a 45MP full-frame sensor and 8K video recording.',
    dailyRate: 50,
    weeklyRate: 300,
    monthlyRate: 1000,
    images: ['/canon-r5.jpg', '/canon-r5-2.jpg', '/canon-r5-3.jpg'],
    city: 'New York',
    state: 'NY',
    brand: 'Canon',
    model: 'EOS R5',
    condition: 'Like New',
    owner: {
      name: 'John Doe',
      avatar: '/avatar.jpg',
    },
    features: [
      '45MP Full-Frame CMOS Sensor',
      '8K30 Raw and 4K120 10-Bit Internal Video',
      'Sensor-Shift 5-Axis Image Stabilization',
      'Dual Pixel CMOS AF II with 1053 Points',
    ],
  },
  // Add other gear items as needed
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const gear = dummyGear[id as keyof typeof dummyGear];

  if (!gear) {
    return NextResponse.json({ error: 'Gear not found' }, { status: 404 });
  }

  return NextResponse.json(gear);
}
