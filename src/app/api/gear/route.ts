import { NextResponse } from 'next/server';

const dummyGear = [
  {
    id: '1',
    title: 'Canon EOS R5',
    dailyRate: 50,
    images: ['/canon-r5.jpg'],
    city: 'New York',
    state: 'NY',
    category: 'cameras',
  },
  {
    id: '2',
    title: 'Sony A7S III',
    dailyRate: 60,
    images: ['/sony-a7siii.jpg'],
    city: 'Los Angeles',
    state: 'CA',
    category: 'cameras',
  },
  {
    id: '3',
    title: 'DJI Ronin-S',
    dailyRate: 25,
    images: ['/dji-ronin-s.jpg'],
    city: 'Chicago',
    state: 'IL',
    category: 'lighting',
  },
  {
    id: '4',
    title: 'Aputure 120D II',
    dailyRate: 30,
    images: ['/aputure-120d.jpg'],
    city: 'Austin',
    state: 'TX',
    category: 'lighting',
  },
  {
    id: '5',
    title: 'Shure SM7B',
    dailyRate: 20,
    images: ['/shure-sm7b.jpg'],
    city: 'Miami',
    state: 'FL',
    category: 'audio',
  },
  {
    id: '6',
    title: 'Zoom H6',
    dailyRate: 15,
    images: ['/zoom-h6.jpg'],
    city: 'Seattle',
    state: 'WA',
    category: 'audio',
  },
];

export async function GET() {
  return NextResponse.json(dummyGear);
}
