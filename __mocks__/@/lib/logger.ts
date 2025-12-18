// __mocks__/@/lib/logger.ts
// Mock for logger module - no-op functions

export const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
