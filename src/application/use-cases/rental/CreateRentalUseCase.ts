import { Rental } from '../../../domain/entities/Rental';
import { IGearRepository, IRentalRepository, IUserRepository } from '../../../domain/ports/repositories';
import { IGearDomainService } from '../../../domain/services/GearDomainService';
import { IPaymentService } from '../../../domain/ports/external-services';

export interface CreateRentalInput {
  gearId: string;
  startDate: string;
  endDate: string;
  message?: string;
  renterId: string;
}

export interface CreateRentalOutput {
  rental: Rental;
  clientSecret: string;
}

export class CreateRentalUseCase {
  constructor(
    private gearRepository: IGearRepository,
    private rentalRepository: IRentalRepository,
    private userRepository: IUserRepository,
    private gearDomainService: IGearDomainService,
    private paymentService: IPaymentService
  ) {}

  async execute(input: CreateRentalInput): Promise<CreateRentalOutput> {
    // Fetch gear
    const gear = await this.gearRepository.findById(input.gearId);
    if (!gear) {
      throw new Error('Gear not found');
    }

    // Fetch renter
    const renter = await this.userRepository.findById(input.renterId);
    if (!renter) {
      throw new Error('Renter not found');
    }

    // Validate rental requirements
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (!this.gearDomainService.validateForRental(gear, renter, startDate, endDate)) {
      throw new Error('Rental validation failed');
    }

    // Calculate rental price
    const totalAmount = this.gearDomainService.calculateRentalPrice(gear, startDate, endDate);

    // Create payment intent
    const paymentResult = await this.paymentService.createPaymentIntent(
      Math.round(totalAmount * 100), // Convert to cents
      'usd',
      {
        gearId: gear.id,
        renterId: renter.id,
        ownerId: gear.userId || '',
        startDate: input.startDate,
        endDate: input.endDate,
      }
    );

    // Create rental entity
    const rental = new Rental({
      id: this.generateId(),
      gearId: input.gearId,
      renterId: input.renterId,
      ownerId: gear.userId || '',
      startDate,
      endDate,
      status: 'pending',
      message: input.message,
      paymentIntentId: paymentResult.id,
      clientSecret: paymentResult.clientSecret,
      paymentStatus: 'requires_payment_method', // Initial status
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save rental to repository
    const savedRental = await this.rentalRepository.create(rental);

    return {
      rental: savedRental,
      clientSecret: paymentResult.clientSecret,
    };
  }

  private generateId(): string {
    // Simple ID generation - in practice, use a proper ID generator
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}