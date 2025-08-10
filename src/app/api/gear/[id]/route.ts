import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase'; // Import supabase

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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, dailyRate, city, state, images, brand, model, condition } = body;

    const existingGear = await prisma.gear.findUnique({
      where: { id },
    });

    if (!existingGear) {
      return NextResponse.json({ error: 'Gear not found' }, { status: 404 });
    }

    if (existingGear.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this gear' }, { status: 403 });
    }

    const updatedGear = await prisma.gear.update({
      where: { id },
      data: {
        title: title ?? existingGear.title,
        description: description ?? existingGear.description,
        dailyRate: dailyRate ?? existingGear.dailyRate,
        city: city ?? existingGear.city,
        state: state ?? existingGear.state,
        images: images ?? existingGear.images,
        brand: brand ?? existingGear.brand,
        model: model ?? existingGear.model,
        condition: condition ?? existingGear.condition,
      },
    });

    return NextResponse.json(updatedGear);
  } catch (error) {
    console.error('Error updating gear:', error);
    return NextResponse.json({ error: 'Failed to update gear' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existingGear = await prisma.gear.findUnique({
      where: { id },
    });

    if (!existingGear) {
      return NextResponse.json({ error: 'Gear not found' }, { status: 404 });
    }

    if (existingGear.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this gear' }, { status: 403 });
    }

    await prisma.gear.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Gear deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting gear:', error);
    return NextResponse.json({ error: 'Failed to delete gear' }, { status: 500 });
  }
}
