import { Rental } from '../../../domain/entities/Rental';
import { IRentalRepository, IUserRepository } from '../../../domain/ports/repositories';
import { IRentalDomainService } from '../../../domain/services/RentalDomainService';
import { INotificationService } from '../../../domain/ports/external-services';

export interface CompleteRentalInput {
  rentalId: string;
  completedById: string; // ID of the user completing the rental (should be the owner)
}

export interface CompleteRentalOutput {
  rental: Rental;
}

export class CompleteRentalUseCase {
  constructor(
    private rentalRepository: IRentalRepository,
    private userRepository: IUserRepository,
    private rentalDomainService: IRentalDomainService,
    private notificationService: INotificationService
  ) {}

  async execute(input: CompleteRentalInput): Promise<CompleteRentalOutput> {
    // Fetch rental
    const rental = await this.rentalRepository.findById(input.rentalId);
    if (!rental) {
      throw new Error('Rental not found');
    }

    // Fetch user completing the rental
    const completingUser = await this.userRepository.findById(input.completedById);
    if (!completingUser) {
      throw new Error('User not found');
    }

    // Check if the user is authorized to complete this rental
    // Only the owner (gear owner) can mark the rental as completed
    if (rental.ownerId !== input.completedById) {
      throw new Error('Only the gear owner can complete this rental');
    }

    // Check if rental can be completed
    if (!this.rentalDomainService.canCompleteRental(rental)) {
      throw new Error(`Rental cannot be completed in its current status: ${rental.status}`);
    }

    // Complete the rental using the domain entity method
    rental.complete();

    // Save the updated rental
    const updatedRental = await this.rentalRepository.update(rental);

    // Send notification to the renter
    try {
      await this.notificationService.sendRentalNotification(
        rental.renterId,
        rental.id,
        `Your rental of the gear has been marked as completed by the owner. You can now leave a review.`,
        'Rental Completed'
      );
    } catch (error) {
      console.error('Failed to send completion notification:', error);
      // Don't fail the completion if notification fails
    }

    return {
      rental: updatedRental,
    };
  }
}