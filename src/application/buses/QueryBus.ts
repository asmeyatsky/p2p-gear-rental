// src/application/buses/QueryBus.ts
import { IQuery } from '../queries/IQuery';
import { IQueryHandler } from '../handlers/queries/IQueryHandler';

export interface IQueryBus {
  execute<TQuery extends IQuery, TResult>(query: TQuery): Promise<TResult>;
}

export class QueryBus implements IQueryBus {
  private handlers: Map<Function, IQueryHandler<any, any>> = new Map();

  register<TQuery extends IQuery, TResult>(
    queryType: new (...args: any[]) => TQuery,
    handler: IQueryHandler<TQuery, TResult>
  ): void {
    this.handlers.set(queryType, handler);
  }

  async execute<TQuery extends IQuery, TResult>(query: TQuery): Promise<TResult> {
    const handler = this.handlers.get(query.constructor as new (...args: any[]) => TQuery);
    
    if (!handler) {
      throw new Error(`No handler registered for query: ${query.constructor.name}`);
    }

    return handler.handle(query);
  }
}