import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const gear = await prisma.gear.findUnique({
      where: { id },
    });

    if (!gear) {
      return NextResponse.json({ error: 'Gear not found' }, { status: 404 });
    }

    return NextResponse.json(gear);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to fetch gear' }, { status: 500 });
  }
}
