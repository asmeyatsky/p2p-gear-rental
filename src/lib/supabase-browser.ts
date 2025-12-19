import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return null or a mock client if env vars are not set
  if (!url || !key || url === 'https://placeholder.supabase.co') {
    console.warn('Supabase credentials not configured - auth will not work');
    // Return a minimal mock client that won't cause errors
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } }
        }),
        signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: new Error('Supabase not configured') }),
        resetPasswordForEmail: async () => ({ error: new Error('Supabase not configured') }),
      }
    } as any;
  }

  return createBrowserClient(url, key);
}