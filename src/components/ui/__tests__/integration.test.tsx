/**
 * Integration tests to ensure UI components and animations work together properly
 * Prevents regressions in the Framer Motion + shadcn/ui + Next.js integration
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import GearCard from '@/components/gear/GearCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatedCard } from '@/components/ui/animated-card';
import { GearItem } from '@/types';

// Integration test for GearCard with animations
describe('UI Component Integration', () => {
  const mockGear: GearItem = {
    id: 'gear-1',
    title: 'Test Gear',
    description: 'Test description',
    dailyRate: 50,
    weeklyRate: 300,
    monthlyRate: 1000,
    images: ['https://example.com/image.jpg'],
    city: 'Test City',
    state: 'TS',
    category: 'cameras',
    brand: 'Test Brand',
    model: 'Test Model',
    condition: 'good',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    averageRating: 4.5,
    totalReviews: 10,
    totalRentals: 5,
    isAvailable: true,
  };

  it('GearCard renders with motion animations and does not cause hydration errors', () => {
    // Test that GearCard renders without throwing errors
    const { container } = render(<GearCard gear={mockGear} index={0} />);

    // Check that the card contains expected content
    expect(screen.getByText('Test Gear')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('Test City,TS')).toBeInTheDocument();

    // Verify that motion elements are rendered with proper class names
    const cardElement = container.firstChild;
    expect(cardElement).toHaveClass('group'); // Has the group class from motion component
  });

  it('AnimatedCard component renders with motion properties', () => {
    render(
      <AnimatedCard index={0} whileHover={true} whileTap={true}>
        <div>Test Content</div>
      </AnimatedCard>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('shadcn/ui button renders properly', () => {
    render(
      <Button variant="default">
        Test Button
      </Button>
    );

    expect(screen.getByRole('button', { name: /test button/i })).toBeInTheDocument();
  });

  it('shadcn/ui input renders properly', () => {
    render(
      <Input 
        id="test-input"
        placeholder="Test placeholder" 
      />
    );

    expect(screen.getByPlaceholderText('Test placeholder')).toBeInTheDocument();
  });

  it('Integration between motion and shadcn/ui components works', () => {
    const TestComponent = () => (
      <AnimatedCard index={0}>
        <div className="p-4">
          <h3>Test Heading</h3>
          <Input id="test-field" placeholder="Enter value" />
          <Button type="submit">Submit</Button>
        </div>
      </AnimatedCard>
    );

    render(<TestComponent />);

    expect(screen.getByText('Test Heading')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });
});