import { NextRequest, NextResponse } from 'next/server';
import { container } from '../../infrastructure/config/dependency-injection';
import { CreateGearUseCase } from '../../application/use-cases/gear/CreateGearUseCase';

export async function POST(request: NextRequest) {
  try {
    // Get dependencies from container
    const gearRepository = container.getGearRepository();
    const gearDomainService = container.getGearDomainService();
    
    // Create use case
    const createGearUseCase = new CreateGearUseCase(
      gearRepository,
      gearDomainService
    );
    
    // Parse request body
    const body = await request.json();
    
    // Execute use case
    const result = await createGearUseCase.execute(body);
    
    return NextResponse.json(result.gear, { status: 201 });
  } catch (error: any) {
    console.error('Error creating gear:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Fetch gears using repository directly or create a GetGearsUseCase
    const gearRepository = container.getGearRepository();
    const gears = await gearRepository.findAll();
    
    return NextResponse.json(gears);
  } catch (error: any) {
    console.error('Error fetching gears:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}