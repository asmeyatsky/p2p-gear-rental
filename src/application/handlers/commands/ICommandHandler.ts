// src/application/handlers/commands/ICommandHandler.ts
export interface ICommandHandler<TCommand, TResult> {
  handle(command: TCommand): Promise<TResult>;
}