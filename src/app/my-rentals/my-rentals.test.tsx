import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import MyRentalsPage from './page';
import { useAuth } from '@/components/auth/AuthProvider';
import toast from 'react-hot-toast';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock useAuth hook
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock fetch API
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('MyRentalsPage', () => {
  const mockPush = jest.fn();
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };
  const mockOwnerUser = {
    id: 'owner-user-id',
    email: 'owner@example.com',
  };

  const mockRentalRented = {
    id: 'rental-rented-1',
    gearId: 'gear-1',
    gear: { id: 'gear-1', title: 'Camera A', images: ['/image1.jpg'], dailyRate: 10 },
    renterId: mockUser.id,
    renter: { id: mockUser.id, email: mockUser.email, full_name: 'Test User' },
    ownerId: mockOwnerUser.id,
    owner: { id: mockOwnerUser.id, email: mockOwnerUser.email, full_name: 'Owner User' },
    startDate: '2025-08-10',
    endDate: '2025-08-12',
    status: 'pending',
    message: 'Looking forward to it!',
    paymentStatus: 'requires_payment_method',
    clientSecret: 'cs_test_123',
  };

  const mockRentalOwned = {
    id: 'rental-owned-1',
    gearId: 'gear-2',
    gear: { id: 'gear-2', title: 'Lens B', images: ['/image2.jpg'], dailyRate: 15 },
    renterId: 'other-renter-id',
    renter: { id: 'other-renter-id', email: 'other@example.com', full_name: 'Other Renter' },
    ownerId: mockUser.id,
    owner: { id: mockUser.id, email: mockUser.email, full_name: 'Test User' },
    startDate: '2025-08-15',
    endDate: '2025-08-17',
    status: 'pending',
    message: 'Is this available?',
    paymentStatus: 'requires_payment_method',
    clientSecret: 'cs_test_456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
    // Mock initial fetch for rentals
    mockFetch.mockImplementation((url) => {
      if (url === '/api/rentals') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockRentalRented, mockRentalOwned]),
        });
      }
      // Default mock for other fetch calls if needed
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('redirects to login if user is not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<MyRentalsPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('displays rentals where user is the renter', async () => {
    render(<MyRentalsPage />);

    expect(await screen.findByText(/Gear I'm Renting/i)).toBeInTheDocument();
    expect(await screen.findByText(mockRentalRented.gear.title)).toBeInTheDocument();
    expect(screen.getByText(`From: ${mockRentalRented.owner.full_name}`)).toBeInTheDocument();
    expect(screen.getByText(/pay now/i)).toBeInTheDocument();
  });

  it('displays rentals where user is the owner', async () => {
    render(<MyRentalsPage />);

    expect(await screen.findByText('Rentals for My Gear')).toBeInTheDocument();
    expect(await screen.findByText(mockRentalOwned.gear.title)).toBeInTheDocument();
    
    // Wait for all content to load
    await waitFor(() => {
      expect(screen.getByText(`By: ${mockRentalOwned.renter.full_name}`)).toBeInTheDocument();
    });
    
    expect(await screen.findByRole('button', { name: /approve/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /reject/i })).toBeInTheDocument();
  });

  it('calls approve API and refreshes rentals on success', async () => {
    window.confirm = jest.fn(() => true); // Mock confirm dialog
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockRentalRented, mockRentalOwned]),
      }) // Initial fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Approved' }),
      }) // For approve API call
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockRentalRented, { ...mockRentalOwned, status: 'approved' }]),
      }); // For refetch rentals

    render(<MyRentalsPage />);

    // Wait for the component to load and render
    await screen.findByText('Rentals for My Gear');
    await screen.findByText('Lens B'); // Wait for the gear item to appear

    const approveButton = await screen.findByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`/api/rentals/${mockRentalOwned.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' }),
      });
      expect(toast.success).toHaveBeenCalledWith('Rental request approved!');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial fetch + approve call + refresh
    });
  });

  it('calls reject API and refreshes rentals on success', async () => {
    window.confirm = jest.fn(() => true); // Mock confirm dialog
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockRentalRented, mockRentalOwned]),
      }) // Initial fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Rejected' }),
      }) // For reject API call
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockRentalRented, { ...mockRentalOwned, status: 'rejected' }]),
      }); // For refetch rentals

    render(<MyRentalsPage />);

    // Wait for the component to load and render
    await screen.findByText('Rentals for My Gear');
    await screen.findByText('Lens B'); // Wait for the gear item to appear
    
    const rejectButton = await screen.findByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`/api/rentals/${mockRentalOwned.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' }),
      });
      expect(toast.success).toHaveBeenCalledWith('Rental request rejected!');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial fetch + approve call + refresh
    });
  });
});
