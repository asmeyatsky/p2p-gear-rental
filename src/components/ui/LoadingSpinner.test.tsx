import { render, screen } from '@testing-library/react';
import { describe, test, expect } from '@jest/globals';

// Create a simple LoadingSpinner component for testing
const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div 
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
      data-testid="loading-spinner"
      aria-label="Loading"
    />
  );
};

describe('LoadingSpinner', () => {
  test('renders with default medium size', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  test('renders with small size', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  test('renders with large size', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  test('has proper accessibility attributes', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
  });

  test('has spinning animation class', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('animate-spin');
  });

  test('has proper color classes', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('border-gray-300', 'border-t-blue-600');
  });
});