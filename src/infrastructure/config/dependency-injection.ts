import { IGearRepository, IUserRepository, IRentalRepository } from '../../domain/ports/repositories';
import { IPaymentService, INotificationService } from '../../domain/ports/external-services';
import { IGearDomainService } from '../../domain/services/GearDomainService';
import { IRentalDomainService } from '../../domain/services/RentalDomainService';
import { GearRepository } from '../repositories/GearRepository';
import { UserRepository } from '../repositories/UserRepository';
import { RentalRepository } from '../repositories/RentalRepository';
import { StripePaymentService } from '../adapters/StripePaymentService';
import { NotificationServiceAdapter } from '../adapters/NotificationServiceAdapter';
import { GearDomainService } from '../../domain/services/GearDomainService';
import { RentalDomainService } from '../../domain/services/RentalDomainService';
import { CommandBus } from '../../application/buses/CommandBus';
import { QueryBus } from '../../application/buses/QueryBus';
import { CreateGearCommandHandler } from '../../application/handlers/commands/CreateGearCommandHandler';
import { GetGearQueryHandler } from '../../application/handlers/queries/GetGearQueryHandler';
import { CreateGearCommand } from '../../application/commands/gear/CreateGearCommand';
import { GetGearQuery } from '../../application/queries/gear/GetGearQuery';
import { MultiLevelCache } from '../cache/MultiLevelCache';
import { MemoryCache } from '../cache/MemoryCache';
import { RedisCache } from '../cache/RedisCache';
import { AuthenticationService } from '../security/AuthenticationService';
import { tracer, Tracer } from '../tracing/DistributedTracer';

// Create a simple container for dependency injection
class DIContainer {
  private gearRepository: IGearRepository;
  private userRepository: IUserRepository;
  private rentalRepository: IRentalRepository;
  private paymentService: IPaymentService;
  private gearDomainService: IGearDomainService;
  private rentalDomainService: IRentalDomainService;
  private commandBus: CommandBus;
  private queryBus: QueryBus;
  private multiLevelCache: MultiLevelCache;
  private authenticationService: AuthenticationService;
  private tracer: Tracer;
  private notificationService: INotificationService;

  constructor() {
    // Initialize repositories
    this.gearRepository = new GearRepository();
    this.userRepository = new UserRepository();
    this.rentalRepository = new RentalRepository();

    // Initialize external service adapters
    this.paymentService = new StripePaymentService();
    this.notificationService = new NotificationServiceAdapter();

    // Initialize domain services
    this.gearDomainService = new GearDomainService();
    this.rentalDomainService = new RentalDomainService();

    // Initialize cache
    const memoryCache = new MemoryCache({ max: 1000, ttl: 300000 }); // 5 min default
    const redisCache = new RedisCache();
    this.multiLevelCache = new MultiLevelCache(memoryCache, redisCache);

    // Initialize authentication service
    this.authenticationService = new AuthenticationService();

    // Initialize tracer
    this.tracer = tracer;

    // Initialize buses
    this.commandBus = new CommandBus();
    this.queryBus = new QueryBus();

    // Register command handlers
    this.commandBus.register(
      CreateGearCommand,
      new CreateGearCommandHandler(this.gearRepository, this.gearDomainService)
    );

    // Register query handlers
    this.queryBus.register(
      GetGearQuery,
      new GetGearQueryHandler(this.gearRepository)
    );
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

  getRentalDomainService(): IRentalDomainService {
    return this.rentalDomainService;
  }

  getCommandBus(): CommandBus {
    return this.commandBus;
  }

  getQueryBus(): QueryBus {
    return this.queryBus;
  }

  getMultiLevelCache(): MultiLevelCache {
    return this.multiLevelCache;
  }

  getAuthenticationService(): AuthenticationService {
    return this.authenticationService;
  }

  getTracer(): Tracer {
    return this.tracer;
  }

  getNotificationService(): INotificationService {
    return this.notificationService;
  }
}

export const container = new DIContainer();