import { Rental } from '../entities/Rental';

export interface IRentalDomainService {
  canCompleteRental(rental: Rental): boolean;
  canApproveRental(rental: Rental): boolean;
  canRejectRental(rental: Rental): boolean;
  calculateRentalDuration(rental: Rental): number; // Returns duration in days
}

export class RentalDomainService implements IRentalDomainService {
  canCompleteRental(rental: Rental): boolean {
    return rental.status === 'APPROVED' || rental.status === 'ACTIVE';
  }

  canApproveRental(rental: Rental): boolean {
    return rental.status === 'PENDING';
  }

  canRejectRental(rental: Rental): boolean {
    return rental.status === 'PENDING';
  }

  calculateRentalDuration(rental: Rental): number {
    const startDate = new Date(rental.startDate);
    const endDate = new Date(rental.endDate);
    
    // Calculate difference in milliseconds and convert to days
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
}