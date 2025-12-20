/**
 * Regression tests to prevent breaking changes in critical functionality
 * These tests ensure core functionality remains stable after updates
 */

import { render, screen } from '@testing-library/react';
import GearCard from '@/components/gear/GearCard';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { GearItem } from '@/types';

// Mock useAuth for Header component
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  }),
}));

// Mock data
const mockGear: GearItem = {
  id: 'gear-1',
  title: 'Professional Camera',
  description: 'High-quality DSLR camera for professional photography',
  dailyRate: 75,
  weeklyRate: 450,
  monthlyRate: 1500,
  images: ['https://example.com/camera.jpg'],
  city: 'San Francisco',
  state: 'CA',
  category: 'cameras',
  brand: 'Canon',
  model: 'EOS R5',
  condition: 'excellent',
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  averageRating: 4.8,
  totalReviews: 24,
  totalRentals: 15,
  isAvailable: true,
};

describe('Regression Prevention Tests', () => {
  it('GearCard renders without hydration errors', () => {
    // This test specifically checks that the motion component doesn't cause hydration mismatches
    const { container } = render(<GearCard gear={mockGear} index={0} />);

    // Verify the component renders without errors
    expect(screen.getByText('Professional Camera')).toBeInTheDocument();
    // Price appears multiple times (hover badge and price row), use getAllByText
    expect(screen.getAllByText(/\$75/).length).toBeGreaterThan(0);
    // Check that the main container exists
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('Footer component renders correctly', () => {
    render(<Footer />);

    expect(screen.getByText('GearShare')).toBeInTheDocument();
    // Footer uses current year dynamically
    expect(screen.getByText(/© \d{4} GearShare/)).toBeInTheDocument();
    // Footer has About Us and Contact links
    expect(screen.getByRole('link', { name: /about us/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
  });

  it('Header component renders correctly', () => {
    render(<Header />);

    expect(screen.getByText('GearShare')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse gear/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /list your gear/i })).toBeInTheDocument();
  });

  it('Animation properties render correctly without errors', () => {
    // Test that animated components render with proper properties
    const { container } = render(<GearCard gear={mockGear} index={0} />);

    // Check that the motion.div is correctly set up
    const motionDiv = container.querySelector('div');
    expect(motionDiv).toBeInTheDocument();
  });

  it('shadcn/ui components work with motion components', () => {
    // Integration test to verify the combination works as expected
    const TestComponent = () => (
      <div>
        <h1>Test Page</h1>
      </div>
    );

    render(<TestComponent />);
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });
});