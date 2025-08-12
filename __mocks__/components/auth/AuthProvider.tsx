import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    // Mock sign-in logic
    if (email === 'test@example.com' && password === 'password') {
      setUser({ id: '123', email } as any);
      return { data: { user: { id: '123', email } }, error: null };
    }
    return { data: null, error: { message: 'Invalid credentials' } };
  };

  const signUp = async (email: string, password: string) => {
    // Mock sign-up logic
    setUser({ id: '123', email });
    return { data: { user: { id: '123', email } }, error: null };
  };

  const signOut = async () => {
    // Mock sign-out logic
    setUser(null);
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: null,
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
