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
    expect(screen.getByText('Browse Gear')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('renders social media links', () => {
    render(<Footer />);
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
  });

  it('renders the copyright notice', () => {
    render(<Footer />);
    expect(screen.getByText(/\u00A9 \d{4} GearShare. All rights reserved./)).toBeInTheDocument();
  });
});
