// __mocks__/@/lib/supabase.ts
// This is a centralized mock for the Supabase client.

const supabase = {
  auth: {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  // Add other Supabase client methods as needed
};

export { supabase };