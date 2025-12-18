import React from 'react';
import { render, screen } from '@testing-library/react';
import GearCard from '@/components/gear/GearCard';

describe('GearCard', () => {
  const mockGear = {
    id: '1',
    title: 'Test Gear',
    description: 'Test description',
    dailyRate: 10.00,
    images: ['/test-image.jpg'],
    city: 'Test City',
    state: 'TS',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  it('renders gear title and daily rate', () => {
    render(<GearCard gear={mockGear} index={0} />);
    expect(screen.getByText('Test Gear')).toBeInTheDocument();
    // Check for the main price display (the one used for the daily rate)
    // Since there may be multiple "$10" elements (hover badge and price display), verify at least one exists
    const elementsWithPrice = screen.getAllByText('$10');
    expect(elementsWithPrice.length).toBeGreaterThan(0);
  });

  it('renders gear location', () => {
    render(<GearCard gear={mockGear} index={0} />);
    expect(screen.getByText('Test City,TS')).toBeInTheDocument();
  });

  it('renders the gear image', () => {
    render(<GearCard gear={mockGear} index={0} />);
    const image = screen.getByAltText('Test Gear');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/_next/image?url=%2Ftest-image.jpg&w=3840&q=75');
  });
});
