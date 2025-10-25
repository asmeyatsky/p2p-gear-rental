// src/application/handlers/queries/GetGearQueryHandler.ts
import { IQueryHandler } from './IQueryHandler';
import { GetGearQuery } from '../../application/queries/gear/GetGearQuery';
import { IGearRepository } from '../../../domain/ports/repositories';
import { Gear } from '../../../domain/entities/Gear';

export interface GetGearQueryResult {
  data: Gear[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class GetGearQueryHandler implements IQueryHandler<GetGearQuery, GetGearQueryResult> {
  constructor(private gearRepository: IGearRepository) {}

  async handle(query: GetGearQuery): Promise<GetGearQueryResult> {
    let gears: Gear[];
    let total: number;
    
    if (query.data.id) {
      // Get specific gear by ID
      const gear = await this.gearRepository.findById(query.data.id);
      gears = gear ? [gear] : [];
      total = gears.length;
    } else if (query.data.userId) {
      // Get gears by user ID
      gears = await this.gearRepository.findByUserId(query.data.userId);
      total = gears.length;
    } else {
      // Get all gears with optional filtering
      gears = await this.gearRepository.findAll();
      
      // Apply filters if present
      if (query.data.category) {
        gears = gears.filter(gear => gear.category === query.data.category);
      }
      
      if (query.data.search) {
        const searchLower = query.data.search.toLowerCase();
        gears = gears.filter(gear => 
          gear.title.toLowerCase().includes(searchLower) ||
          gear.description.toLowerCase().includes(searchLower) ||
          (gear.brand && gear.brand.toLowerCase().includes(searchLower)) ||
          (gear.model && gear.model.toLowerCase().includes(searchLower))
        );
      }
      
      total = gears.length;
      
      // Apply pagination
      const page = query.data.page || 1;
      const limit = query.data.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      gears = gears.slice(startIndex, endIndex);
    }

    const totalPages = Math.ceil(total / (query.data.limit || 20));

    return {
      data: gears,
      total,
      page: query.data.page || 1,
      limit: query.data.limit || 20,
      totalPages,
    };
  }
}