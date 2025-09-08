import React, { createContext, useContext, useState, useEffect } from 'react';
import { act } from '@testing-library/react';

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock session and user data that can be controlled by tests
let mockSession: any = null;
let mockUser: any = null;

export const setMockSession = (session: any) => {
  mockSession = session;
  mockUser = session?.user || null;
};

export const clearMockSession = () => {
  mockSession = null;
  mockUser = null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(mockUser);
  const [session, setSession] = useState<any>(mockSession);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate async session fetching
    const fetchSession = async () => {
      setLoading(true);
      // In a real scenario, this would be a call to supabase.auth.getSession()
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
      act(() => {
        setUser(mockUser);
        setSession(mockSession);
        setLoading(false);
      });
    };

    fetchSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Mock sign-in logic
    if (email === 'test@example.com' && password === 'password') {
      const newSession = { user: { id: '123', email } };
      act(() => {
        setMockSession(newSession);
        setUser(newSession.user);
        setSession(newSession);
      });
      return { data: { user: newSession.user }, error: null };
    }
    return { data: null, error: { message: 'Invalid credentials' } };
  };

  const signUp = async (email: string, password: string) => {
    // Mock sign-up logic
    const newSession = { user: { id: '123', email } };
    act(() => {
      setMockSession(newSession);
      setUser(newSession.user);
      setSession(newSession);
    });
    return { data: { user: newSession.user }, error: null };
  };

  const signOut = async () => {
    // Mock sign-out logic
    act(() => {
      clearMockSession();
      setUser(null);
      setSession(null);
    });
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
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