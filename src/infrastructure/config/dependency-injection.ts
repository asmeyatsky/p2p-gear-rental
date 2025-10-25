import { IGearRepository, IUserRepository, IRentalRepository } from '../domain/ports/repositories';
import { IPaymentService, INotificationService } from '../domain/ports/external-services';
import { IGearDomainService } from '../domain/services/GearDomainService';
import { GearRepository } from '../infrastructure/repositories/GearRepository';
import { UserRepository } from '../infrastructure/repositories/UserRepository';
import { RentalRepository } from '../infrastructure/repositories/RentalRepository';
import { StripePaymentService } from '../infrastructure/adapters/StripePaymentService';
import { GearDomainService } from '../domain/services/GearDomainService';

// Create a simple container for dependency injection
class DIContainer {
  private gearRepository: IGearRepository;
  private userRepository: IUserRepository;
  private rentalRepository: IRentalRepository;
  private paymentService: IPaymentService;
  private gearDomainService: IGearDomainService;

  constructor() {
    // Initialize repositories
    this.gearRepository = new GearRepository();
    this.userRepository = new UserRepository();
    this.rentalRepository = new RentalRepository();
    
    // Initialize external service adapters
    this.paymentService = new StripePaymentService();
    
    // Initialize domain services
    this.gearDomainService = new GearDomainService();
  }

  getGearRepository(): IGearRepository {
    return this.gearRepository;
  }

  getUserRepository(): IUserRepository {
    return this.userRepository;
  }

  getRentalRepository(): IRentalRepository {
    return this.rentalRepository;
  }

  getPaymentService(): IPaymentService {
    return this.paymentService;
  }

  getGearDomainService(): IGearDomainService {
    return this.gearDomainService;
  }

  getNotificationService(): INotificationService {
    // For now, we'll create a placeholder - implementation would be similar to payment service
    throw new Error('NotificationService not implemented yet');
  }
}

export const container = new DIContainer();