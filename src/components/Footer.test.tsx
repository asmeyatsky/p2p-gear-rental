import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

describe('Footer', () => {
  it('renders the company name', () => {
    render(<Footer />);
    expect(screen.getByText('GearShare')).toBeInTheDocument();
  });

  it('renders quick links', () => {
    render(<Footer />);
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Careers')).toBeInTheDocument(); // Changed from 'Browse Gear' and 'FAQ'
    expect(screen.getByText('Help Center')).toBeInTheDocument(); // Instead of 'FAQ'
  });

  it('renders social media links', () => {
    render(<Footer />);
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
  });

  it('renders the copyright notice', () => {
    render(<Footer />);
    expect(screen.getByText(/\u00A9 \d{4} GearShare. All rights reserved./)).toBeInTheDocument();
  });
});
