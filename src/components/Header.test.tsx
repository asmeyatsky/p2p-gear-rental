import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '@/components/Header';
import { AuthProvider } from '@/components/auth/AuthProvider';

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
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Browse Gear')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('renders login and signup buttons', () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    );
    expect(screen.getByText('Log In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });
});
