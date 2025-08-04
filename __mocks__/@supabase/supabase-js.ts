export const createClient = jest.fn(() => ({
  auth: {
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
    signInWithPassword: jest.fn(() => ({ data: {}, error: null })),
    signUp: jest.fn(() => ({ data: {}, error: null })),
    signOut: jest.fn(() => ({ error: null })),
  },
}));
