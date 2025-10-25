import { Gear } from '../domain/entities/Gear';
import { Rental } from '../domain/entities/Rental';
import { IGearRepository } from '../domain/ports/repositories';
import { IGearDomainService } from '../domain/services/GearDomainService';

export interface CreateGearInput {
  title: string;
  description: string;
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  images: string[];
  city: string;
  state: string;
  brand?: string;
  model?: string;
  condition?: string;
  category?: string;
  userId: string;
}

export interface CreateGearOutput {
  gear: Gear;
}

export class CreateGearUseCase {
  constructor(
    private gearRepository: IGearRepository,
    private gearDomainService: IGearDomainService
  ) {}

  async execute(input: CreateGearInput): Promise<CreateGearOutput> {
    // Create a new Gear entity with the input data
    const gear = new Gear({
      id: this.generateId(),
      title: input.title,
      description: input.description,
      dailyRate: input.dailyRate,
      weeklyRate: input.weeklyRate,
      monthlyRate: input.monthlyRate,
      images: input.images,
      city: input.city,
      state: input.state,
      brand: input.brand,
      model: input.model,
      condition: input.condition,
      category: input.category,
      userId: input.userId,
      averageRating: undefined,
      totalReviews: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save the gear to the repository
    const savedGear = await this.gearRepository.create(gear);

    return {
      gear: savedGear,
    };
  }

  private generateId(): string {
    // Simple ID generation - in practice, use a proper ID generator
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}