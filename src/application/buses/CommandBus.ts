// src/application/buses/CommandBus.ts
import { ICommand } from '../commands/ICommand';
import { ICommandHandler } from '../handlers/commands/ICommandHandler';

export interface ICommandBus {
  execute<TCommand extends ICommand, TResult>(command: TCommand): Promise<TResult>;
}

export class CommandBus implements ICommandBus {
  private handlers: Map<Function, ICommandHandler<any, any>> = new Map();

  register<TCommand extends ICommand, TResult>(
    commandType: new (...args: any[]) => TCommand,
    handler: ICommandHandler<TCommand, TResult>
  ): void {
    this.handlers.set(commandType, handler);
  }

  async execute<TCommand extends ICommand, TResult>(command: TCommand): Promise<TResult> {
    const handler = this.handlers.get(command.constructor as new (...args: any[]) => TCommand);
    
    if (!handler) {
      throw new Error(`No handler registered for command: ${command.constructor.name}`);
    }

    return handler.handle(command);
  }
}