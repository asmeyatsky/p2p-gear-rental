// src/application/handlers/queries/IQueryHandler.ts
export interface IQueryHandler<TQuery, TResult> {
  handle(query: TQuery): Promise<TResult>;
}