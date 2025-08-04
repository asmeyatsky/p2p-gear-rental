import { render, screen } from '@testing-library/react';
import Header from '@/components/Header';

describe('Header', () => {
  it('renders the GearShare logo', () => {
    render(<Header />);
    expect(screen.getByText('GearShare')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Browse Gear')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('renders login and signup buttons', () => {
    render(<Header />);
    expect(screen.getByText('Log In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });
});
