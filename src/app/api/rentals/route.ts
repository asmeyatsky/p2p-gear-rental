import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe'; // Import Stripe

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-11-20.acacia' as any, // Use supported API version
});

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

    // Calculate rental duration and amount
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const amount = Math.round(gear.dailyRate * diffDays * 100); // Amount in cents

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        gearId: gear.id,
        renterId: session.user.id,
        ownerId: gear.userId || '',
        startDate,
        endDate,
      },
    });

    // Create the rental request
    const rental = await prisma.rental.create({
      data: {
        gearId,
        renterId: session.user.id,
        ownerId: gear.userId || '',
        startDate,
        endDate,
        status: 'pending',
        message,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        paymentStatus: paymentIntent.status, // Initial Stripe status
      },
    });

    return NextResponse.json({ rental, clientSecret: paymentIntent.client_secret }, { status: 201 });
  } catch (error) {
    console.error('Error creating rental request or payment intent:', error);
    return NextResponse.json({ error: 'Failed to create rental request or payment intent' }, { status: 500 });
  }
}
