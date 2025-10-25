// src/application/commands/gear/CreateGearCommand.ts
import { ICommand } from '../ICommand';

export interface CreateGearCommandData {
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

export class CreateGearCommand implements ICommand<CreateGearCommandData> {
  constructor(public readonly data: CreateGearCommandData) {}
}