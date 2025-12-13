export const withErrorHandler = (handler: Function) => handler;
export class AuthenticationError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthenticationError';
  }
}