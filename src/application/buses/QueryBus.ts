// src/application/buses/QueryBus.ts
import { IQuery } from '../queries/IQuery';
import { IQueryHandler } from '../handlers/queries/IQueryHandler';

export interface IQueryBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute<TQuery extends IQuery<any>, TResult>(query: TQuery): Promise<TResult>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryConstructor = new (...args: any[]) => IQuery<any>;

export class QueryBus implements IQueryBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers: Map<QueryConstructor, IQueryHandler<any, any>> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register<TQuery extends IQuery<any>, TResult>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryType: new (...args: any[]) => TQuery,
    handler: IQueryHandler<TQuery, TResult>
  ): void {
    this.handlers.set(queryType, handler);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute<TQuery extends IQuery<any>, TResult>(query: TQuery): Promise<TResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = this.handlers.get(query.constructor as new (...args: any[]) => TQuery);

    if (!handler) {
      throw new Error(`No handler registered for query: ${query.constructor.name}`);
    }

    return handler.handle(query);
  }
}