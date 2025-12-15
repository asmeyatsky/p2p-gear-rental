import { CreateGearUseCase } from '../../../application/use-cases/gear/CreateGearUseCase';
import { IGearRepository } from '../../../domain/ports/repositories';
import { IGearDomainService } from '../../../domain/services/GearDomainService';
import { Gear } from '../../../domain/entities/Gear';

// Mock implementations
class MockGearRepository implements IGearRepository {
  private gears: Gear[] = [];

  async findById(id: string): Promise<Gear | null> {
    return this.gears.find(gear => gear.id === id) || null;
  }

  async findByUserId(userId: string): Promise<Gear[]> {
    return this.gears.filter(gear => gear.userId === userId);
  }

  async findAll(): Promise<Gear[]> {
    return [...this.gears];
  }

  async create(gear: Gear): Promise<Gear> {
    this.gears.push(gear);
    return gear;
  }

  async update(gear: Gear): Promise<Gear> {
    const index = this.gears.findIndex(g => g.id === gear.id);
    if (index !== -1) {
      this.gears[index] = gear;
    }
    return gear;
  }

  async delete(id: string): Promise<void> {
    this.gears = this.gears.filter(gear => gear.id !== id);
  }
}

class MockGearDomainService implements IGearDomainService {
  checkAvailability(_gear: Gear, _startDate: Date, _endDate: Date): boolean {
    return true; // Always available for testing
  }

  calculateRentalPrice(_gear: Gear, _startDate: Date, _endDate: Date): number {
    return 100; // Fixed price for testing
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateForRental(_gear: Gear, _renter: any, _startDate: Date, _endDate: Date): boolean {
    return true; // Always valid for testing
  }
}

describe('CreateGearUseCase', () => {
  let useCase: CreateGearUseCase;
  let mockGearRepository: MockGearRepository;
  let mockGearDomainService: MockGearDomainService;

  beforeEach(() => {
    mockGearRepository = new MockGearRepository();
    mockGearDomainService = new MockGearDomainService();
    useCase = new CreateGearUseCase(mockGearRepository, mockGearDomainService);
  });

  it('should create a gear successfully', async () => {
    const input = {
      title: 'Test Camera',
      description: 'A high-quality test camera',
      dailyRate: 50,
      weeklyRate: 300,
      monthlyRate: 1000,
      images: ['https://example.com/image.jpg'],
      city: 'New York',
      state: 'NY',
      brand: 'Test Brand',
      model: 'Test Model',
      condition: 'good',
      category: 'cameras',
      userId: 'user-123',
    };

    const result = await useCase.execute(input);

    expect(result.gear).toBeDefined();
    expect(result.gear.title).toBe(input.title);
    expect(result.gear.description).toBe(input.description);
    expect(result.gear.dailyRate).toBe(input.dailyRate);
    expect(result.gear.userId).toBe(input.userId);
  });

  it('should throw an error for invalid input', async () => {
    const input = {
      title: '', // Invalid: empty title
      description: 'A high-quality test camera',
      dailyRate: 50,
      weeklyRate: 300,
      monthlyRate: 1000,
      images: ['https://example.com/image.jpg'],
      city: 'New York',
      state: 'NY',
      brand: 'Test Brand',
      model: 'Test Model',
      condition: 'good',
      category: 'cameras',
      userId: 'user-123',
    };

    await expect(useCase.execute(input)).rejects.toThrow();
  });
});