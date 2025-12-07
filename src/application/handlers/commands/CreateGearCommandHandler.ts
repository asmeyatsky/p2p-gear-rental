// src/application/handlers/commands/CreateGearCommandHandler.ts
import { ICommandHandler } from './ICommandHandler';
import { CreateGearCommand } from '../../commands/gear/CreateGearCommand';
import { IGearRepository } from '../../../domain/ports/repositories';
import { IGearDomainService } from '../../../domain/services/GearDomainService';
import { Gear } from '../../../domain/entities/Gear';

export class CreateGearCommandHandler implements ICommandHandler<CreateGearCommand, Gear> {
  constructor(
    private gearRepository: IGearRepository,
    private gearDomainService: IGearDomainService
  ) {}

  async handle(command: CreateGearCommand): Promise<Gear> {
    // Create a new Gear entity with the command data
    const gear = new Gear({
      id: this.generateId(),
      title: command.data.title,
      description: command.data.description,
      dailyRate: command.data.dailyRate,
      weeklyRate: command.data.weeklyRate,
      monthlyRate: command.data.monthlyRate,
      images: command.data.images,
      city: command.data.city,
      state: command.data.state,
      brand: command.data.brand,
      model: command.data.model,
      condition: command.data.condition,
      category: command.data.category,
      userId: command.data.userId,
      averageRating: undefined,
      totalReviews: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save the gear to the repository
    const savedGear = await this.gearRepository.create(gear);

    return savedGear;
  }

  private generateId(): string {
    // Simple ID generation - in practice, use a proper ID generator
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}