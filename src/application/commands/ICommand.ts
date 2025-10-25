// src/application/commands/ICommand.ts
export interface ICommand<T = void> {
  data: T;
}