'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session, AuthResponse, AuthChangeEvent, WeakPassword, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-browser';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, name?: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthResponse['error'] }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize outside component to avoid issues during server rendering
function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    return createClient();
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize state with default values that don't rely on hooks during SSR
  const [authState, setAuthState] = useState<{
    user: User | null;
    session: Session | null;
    loading: boolean;
  }>({ user: null, session: null, loading: typeof window !== 'undefined' });

  const supabase = useMemo(() => getSupabaseClient(), []);

  useEffect(() => {
    if (!supabase) {
      // If we're on the server or client without proper setup, just set loading to false
      if (typeof window !== 'undefined') {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
      return;
    }

    let isMounted = true;

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session: sessionData } } = await supabase.auth.getSession();
        if (isMounted) {
          setAuthState({
            user: sessionData?.user ?? null,
            session: sessionData,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (isMounted) {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      }
    };

    // Only run on the client side
    if (typeof window !== 'undefined') {
      getSession();

      // Subscribe to auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event: AuthChangeEvent, session: Session | null) => {
          if (isMounted) {
            setAuthState({
              user: session?.user ?? null,
              session: session,
              loading: false
            });
          }
        }
      );

      return () => {
        isMounted = false;
        subscription?.unsubscribe?.();
      };
    } else {
      // On server, just set loading to false
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, [supabase]);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    if (!supabase) {
      return {
        data: { user: null, session: null },
        error: { name: 'Client not initialized', message: 'Supabase client not initialized' } as AuthError
      };
    }

    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (result.data.session) {
        setAuthState({
          user: result.data.session.user,
          session: result.data.session,
          loading: false
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      return {
        data: { user: null, session: null },
        error: { name: 'Sign in error', message: errorMessage } as AuthError
      };
    } finally {
      if (typeof window !== 'undefined') {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const signUp = async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    if (!supabase) {
      return {
        data: { user: null, session: null },
        error: { name: 'Client not initialized', message: 'Supabase client not initialized' } as AuthError
      };
    }

    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      return {
        data: { user: null, session: null },
        error: { name: 'Sign up error', message: errorMessage } as AuthError
      };
    } finally {
      if (typeof window !== 'undefined') {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const signOut = async () => {
    if (!supabase) {
      return { error: { name: 'Client not initialized', message: 'Supabase client not initialized' } as AuthError };
    }

    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const { error } = await supabase.auth.signOut();

      if (!error) {
        setAuthState({
          user: null,
          session: null,
          loading: false
        });
      }

      return { error };
    } finally {
      if (typeof window !== 'undefined') {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        session: authState.session,
        loading: authState.loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
