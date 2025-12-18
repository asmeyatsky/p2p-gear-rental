import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '@/components/Header';
import { AuthProvider } from '@/components/auth/AuthProvider';

jest.mock('@/lib/supabase-browser', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
    },
  })),
}));

describe('Header', () => {
  it('renders the GearShare logo', () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    );
    expect(screen.getByText('GearShare')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    );
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Browse Gear')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('renders login and signup buttons', () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    );
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });
});
