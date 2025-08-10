import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message } = body; // Optional message from owner

    const rental = await prisma.rental.findUnique({
      where: { id },
    });

    if (!rental) {
      return NextResponse.json({ error: 'Rental request not found' }, { status: 404 });
    }

    if (rental.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: You are not the owner of this rental request' }, { status: 403 });
    }

    if (rental.status !== 'pending') {
      return NextResponse.json({ error: `Rental request is already ${rental.status}` }, { status: 400 });
    }

    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        status: 'rejected',
        message: message || rental.message, // Update message if provided
      },
    });

    return NextResponse.json(updatedRental);
  } catch (error) {
    console.error('Error rejecting rental request:', error);
    return NextResponse.json({ error: 'Failed to reject rental request' }, { status: 500 });
  }
}
