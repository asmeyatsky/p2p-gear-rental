export const createClient = jest.fn(() => ({
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