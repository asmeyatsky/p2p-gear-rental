import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ProfilePage from './page';
import { useAuth } from '@/components/auth/AuthProvider';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock useAuth hook
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

describe('ProfilePage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('redirects to login if user is not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('displays user details if user is authenticated', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Test User',
      },
    };

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/your profile/i)).toBeInTheDocument();
      expect(screen.getByText(/email address/i)).toBeInTheDocument();
      // Email appears multiple times (in header and details), use getAllByText
      expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(0);

      // Find the "Full Name" label first, then check if the next sibling element has the expected value
      const fullNameLabel = screen.getByText(/full name/i);
      // Get the next sibling element (the <p> tag) which contains the actual name
      const valueElement = fullNameLabel.nextElementSibling as HTMLElement;
      expect(valueElement?.textContent).toBe('Test User');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('displays only email if full_name is not available', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {},
    };

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/your profile/i)).toBeInTheDocument();
      expect(screen.getByText(/email address/i)).toBeInTheDocument();
      // Email appears multiple times (in header and details), use getAllByText
      expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(0);
      // Full Name section should not appear when full_name is not available
      expect(screen.queryByText('Full Name')).not.toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
