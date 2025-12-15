import { Gear } from '../entities/Gear';

export interface IGearRepository {
  findById(id: string): Promise<Gear | null>;
  findByUserId(userId: string): Promise<Gear[]>;
  findAll(): Promise<Gear[]>;
  create(gear: Gear): Promise<Gear>;
  update(gear: Gear): Promise<Gear>;
  delete(id: string): Promise<void>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IUserRepository {
  findById(id: string): Promise<any | null>; // Using any for now until User entity is fully integrated
  findByEmail(email: string): Promise<any | null>;
  create(user: any): Promise<any>;
  update(user: any): Promise<any>;
}

export interface IRentalRepository {
  findById(id: string): Promise<any | null>;
  findByRenterId(renterId: string): Promise<any[]>;
  findByOwnerId(ownerId: string): Promise<any[]>;
  create(rental: any): Promise<any>;
  update(rental: any): Promise<any>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */