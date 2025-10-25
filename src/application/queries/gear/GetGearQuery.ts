// src/application/queries/gear/GetGearQuery.ts
import { IQuery } from '../IQuery';

export interface GetGearQueryData {
  id?: string;
  userId?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class GetGearQuery implements IQuery<GetGearQueryData> {
  constructor(public readonly data: GetGearQueryData) {}
}