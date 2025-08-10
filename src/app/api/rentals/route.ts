import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const rentals = await prisma.rental.findMany({
      where: {
        OR: [
          { renterId: userId },
          { ownerId: userId },
        ],
      },
      include: {
        gear: true, // Include the related gear data
        renter: {
          select: {
            id: true,
            email: true,
            full_name: true,
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            full_name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(rentals);
  } catch (error) {
    console.error('Error fetching rentals:', error);
    return NextResponse.json({ error: 'Unable to fetch rentals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { gearId, startDate, endDate, message } = body;

    if (!gearId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json({ error: 'Invalid dates provided' }, { status: 400 });
    }

    // Check if gear exists and get ownerId
    const gear = await prisma.gear.findUnique({
      where: { id: gearId },
    });

    if (!gear) {
      return NextResponse.json({ error: 'Gear not found' }, { status: 404 });
    }

    // Prevent renting own gear
    if (gear.userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot rent your own gear' }, { status: 400 });
    }

    // Create the rental request
    const rental = await prisma.rental.create({
      data: {
        gearId,
        renterId: session.user.id,
        ownerId: gear.userId || '', // Ensure ownerId is not null if userId is nullable
        startDate,
        endDate,
        status: 'pending',
        message, // Save the message
      },
    });

    return NextResponse.json(rental, { status: 201 });
  } catch (error) {
    console.error('Error creating rental request:', error);
    return NextResponse.json({ error: 'Failed to create rental request' }, { status: 500 });
  }
}
