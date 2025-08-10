export const supabase = {
  auth: {
    getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
    signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signUp: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
  },
};
