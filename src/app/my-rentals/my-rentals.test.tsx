import { screen, waitFor, act } from '@testing-library/react';
import MyRentalsPage from './page';
import { render } from '@/test-utils';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

const mockPush = jest.fn();

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
};

describe('MyRentalsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
  });

  it('redirects to login if user is not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    await act(async () => {
      render(<MyRentalsPage />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login?redirectTo=/my-rentals');
    });
  });

  it('redirects authenticated users to dashboard', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    await act(async () => {
      render(<MyRentalsPage />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows loading state while auth is loading', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    await act(async () => {
      render(<MyRentalsPage />);
    });

    // Should show loading spinner, not redirect
    expect(mockPush).not.toHaveBeenCalled();
  });
});