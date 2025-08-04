import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const gear = await prisma.gear.findMany();
    return NextResponse.json(gear);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to fetch gear' }, { status: 500 });
  }
}
