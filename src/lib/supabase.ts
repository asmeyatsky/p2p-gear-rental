import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Skip during build time to prevent hanging on static page generation
const SKIP_DURING_BUILD = process.env.SKIP_DB_DURING_BUILD === 'true';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Don't throw during build - use lazy initialization
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined');
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

// Create a no-op proxy for build time that returns safe defaults
function createBuildTimeProxy(): SupabaseClient {
  const handler: ProxyHandler<object> = {
    get(_target, _prop) {
      // Return a function that returns a promise with null/empty results
      // This allows code like `await supabase.auth.getSession()` to work during build
      return new Proxy(() => Promise.resolve({ data: null, error: null }), {
        get: () => new Proxy(() => Promise.resolve({ data: null, error: null }), handler),
        apply: () => Promise.resolve({ data: { session: null }, error: null }),
      });
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Proxy({}, handler) as any;
}

// Export a proxy that lazily initializes on first access
// During build time, returns a no-op proxy to prevent any actual API calls
export const supabase: SupabaseClient = SKIP_DURING_BUILD
  ? createBuildTimeProxy()
  : new Proxy({} as SupabaseClient, {
      get(_, prop) {
        return getSupabaseClient()[prop as keyof SupabaseClient];
      }
    });

// Server-side client for use in API route handlers and Server Components.
// Reads the session from request cookies (set by createBrowserClient on the
// client side) so that getSession() returns the authenticated user.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
        });
      },
    },
  });
}
