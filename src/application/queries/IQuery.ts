// src/application/queries/IQuery.ts
export interface IQuery<T = void> {
  data: T;
}