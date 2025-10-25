import { NextRequest, NextResponse } from 'next/server';
import { container } from '../../../infrastructure/config/dependency-injection';
import { CreateRentalUseCase } from '../../../application/use-cases/rental/CreateRentalUseCase';

export async function POST(request: NextRequest) {
  try {
    // Get dependencies from container
    const gearRepository = container.getGearRepository();
    const rentalRepository = container.getRentalRepository(); // This will throw an error for now
    const userRepository = container.getUserRepository();
    const gearDomainService = container.getGearDomainService();
    const paymentService = container.getPaymentService();
    
    // Create use case
    const createRentalUseCase = new CreateRentalUseCase(
      gearRepository,
      rentalRepository,
      userRepository,
      gearDomainService,
      paymentService
    );
    
    // Parse request body
    const body = await request.json();
    
    // Execute use case
    const result = await createRentalUseCase.execute(body);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating rental:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get rentals using repository directly or create a GetRentalsUseCase
    // For now, we'll throw an error since RentalRepository isn't fully implemented
    throw new Error('Get rentals not implemented yet in new architecture');
  } catch (error: any) {
    console.error('Error fetching rentals:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}