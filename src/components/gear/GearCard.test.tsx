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
    render(<GearCard gear={mockGear} />);
    expect(screen.getByText('Test Gear')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });

  it('renders gear location', () => {
    render(<GearCard gear={mockGear} />);
    expect(screen.getByText('Test City, TS')).toBeInTheDocument();
  });

  it('renders the gear image', () => {
    render(<GearCard gear={mockGear} />);
    const image = screen.getByAltText('Test Gear');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/_next/image?url=%2Ftest-image.jpg&w=3840&q=75');
  });
});
