import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase'; // Import supabase

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '10000');
    const city = searchParams.get('city');
    const state = searchParams.get('state');

    const where: any = {
      dailyRate: {
        gte: minPrice,
        lte: maxPrice,
      },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category; // Assuming category is a direct string match
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (state) {
      where.state = { contains: state, mode: 'insensitive' };
    }

    const gear = await prisma.gear.findMany({
      where,
    });
    return NextResponse.json(gear);
  } catch (error) {
    console.error('Error fetching gear from database:', error);
    return NextResponse.json({ error: 'Unable to fetch gear' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Secure the POST endpoint
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, dailyRate, city, state, images, category } = body;

    if (!title || !description || !dailyRate || !city || !state || !images) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure the user exists in our database or create them
    const user = await prisma.user.upsert({
      where: { id: session.user.id },
      update: {
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name || null,
      },
      create: {
        id: session.user.id,
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name || null,
      },
    });

    const newGear = await prisma.gear.create({
      data: {
        title,
        description,
        dailyRate,
        city,
        state,
        images,
        category, // Save the category
        userId: user.id, // Associate the gear with the user
      },
    });

    return NextResponse.json(newGear, { status: 201 });
  } catch (error) {
    console.error('Error adding gear to database:', error);
    return NextResponse.json({ error: 'Failed to add gear' }, { status: 500 });
  }
}
