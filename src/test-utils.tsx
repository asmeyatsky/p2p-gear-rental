import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

// Custom render function that includes common providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllProviders, ...options });

// A simple component to wrap our tests with common providers
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override the render method with our custom one
export { customRender as render };

// Mock useRouter for consistent testing
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    // Add other router methods if needed by components
  })),
}));

// Mock useAuth to control authentication state in tests
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({
    user: null, // Default to unauthenticated
    loading: false,
    session: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children, // Render children directly
}));