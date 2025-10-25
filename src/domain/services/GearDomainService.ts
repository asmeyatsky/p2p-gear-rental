import { Gear } from '../entities/Gear';
import { User } from '../entities/User';

export interface IGearDomainService {
  checkAvailability(gear: Gear, startDate: Date, endDate: Date): boolean;
  calculateRentalPrice(gear: Gear, startDate: Date, endDate: Date): number;
  validateForRental(gear: Gear, renter: User, startDate: Date, endDate: Date): boolean;
}

export class GearDomainService implements IGearDomainService {
  checkAvailability(gear: Gear, startDate: Date, endDate: Date): boolean {
    return gear.isAvailable(startDate, endDate);
  }

  calculateRentalPrice(gear: Gear, startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let total = 0;
    if (diffDays >= 30 && gear.monthlyRate) {
      // Use monthly rate if available and rental is 30+ days
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      total = months * gear.monthlyRate;
      if (remainingDays > 0) {
        total += remainingDays * gear.dailyRate;
      }
    } else if (diffDays >= 7 && gear.weeklyRate) {
      // Use weekly rate if available and rental is 7+ days
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      total = weeks * gear.weeklyRate;
      if (remainingDays > 0) {
        total += remainingDays * gear.dailyRate;
      }
    } else {
      // Use daily rate
      total = diffDays * gear.dailyRate;
    }

    return total;
  }

  validateForRental(gear: Gear, renter: User, startDate: Date, endDate: Date): boolean {
    // Check if date range is valid
    if (startDate >= endDate) {
      return false;
    }

    // Check if gear is available for the date range
    if (!this.checkAvailability(gear, startDate, endDate)) {
      return false;
    }

    // Check if renter is not the owner
    if (gear.userId === renter.id) {
      return false;
    }

    return true;
  }
}