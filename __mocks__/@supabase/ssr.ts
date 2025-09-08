import { jest } from '@jest/globals';

export const createServerClient = jest.fn(() => ({
  auth: {
    getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
  },
}));

export const createBrowserClient = jest.fn(() => ({
  auth: {
    getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ data: { path: 'mock-path' } })),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'mock-url' } })),
    })),
  },
}));