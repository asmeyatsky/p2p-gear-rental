// src/application/buses/CommandBus.ts
import { ICommand } from '../commands/ICommand';
import { ICommandHandler } from '../handlers/commands/ICommandHandler';

export interface ICommandBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute<TCommand extends ICommand<any>, TResult>(command: TCommand): Promise<TResult>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CommandConstructor = new (...args: any[]) => ICommand<any>;

export class CommandBus implements ICommandBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers: Map<CommandConstructor, ICommandHandler<any, any>> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register<TCommand extends ICommand<any>, TResult>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    commandType: new (...args: any[]) => TCommand,
    handler: ICommandHandler<TCommand, TResult>
  ): void {
    this.handlers.set(commandType, handler);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute<TCommand extends ICommand<any>, TResult>(command: TCommand): Promise<TResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = this.handlers.get(command.constructor as new (...args: any[]) => TCommand);

    if (!handler) {
      throw new Error(`No handler registered for command: ${command.constructor.name}`);
    }

    return handler.handle(command);
  }
}