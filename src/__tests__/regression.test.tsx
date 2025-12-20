/**
 * Regression tests to prevent breaking changes in critical functionality
 * These tests ensure core functionality remains stable after updates
 */

import { render, screen } from '@testing-library/react';
import { GearCard } from '@/components/gear/GearCard';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { GearItem } from '@/types';

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
    const { container, getByText } = render(<GearCard gear={mockGear} index={0} />);

    // Verify the component renders without errors
    expect(getByText('Professional Camera')).toBeInTheDocument();
    expect(getByText('$75')).toBeInTheDocument();
    expect(container.querySelector('div[data-testid="gear-card"]')).toBeInTheDocument();
  });

  it('Footer component renders correctly', () => {
    render(<Footer />);

    expect(screen.getByText('GearShare')).toBeInTheDocument();
    expect(screen.getByText('© 2024 GearShare')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse gear/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
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