import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import MyRentalsPage from './page';
import toast from 'react-hot-toast';
import { prisma } from '@/lib/prisma';
import { render } from '@/test-utils'; // Import render from test-utils
import { useAuth } from '@/components/auth/AuthProvider'; // Keep import to mock useAuth directly in tests
import { useRouter } from 'next/navigation';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    rental: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));


const mockPush = jest.fn();

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
};

const mockOwnerUser = {
  id: 'owner-user-id',
  email: 'owner@example.com',
  full_name: 'Owner User',
};

const mockGear = {
  id: 'gear-123',
  title: 'Test Gear',
  description: 'A test gear item',
  dailyRate: 10.0,
  city: 'Test City',
  state: 'TS',
  images: ['/image1.jpg'],
  category: 'cameras',
  userId: mockOwnerUser.id,
};

const mockRentalRented = {
  id: 'rental-1',
  gearId: mockGear.id,
  gear: mockGear,
  renterId: mockUser.id,
  renter: mockUser,
  ownerId: mockOwnerUser.id,
  owner: mockOwnerUser,
  startDate: new Date('2025-08-15T00:00:00.000Z'),
  endDate: new Date('2025-08-17T00:00:00.000Z'),
  status: 'pending',
  message: 'I want to rent this.',
  paymentIntentId: 'pi_rented-1',
  clientSecret: 'cs_rented-1',
  paymentStatus: 'requires_payment_method',
  createdAt: new Date('2025-08-14T00:00:00.000Z'),
};

const mockRentalOwned = {
  id: 'rental-2',
  gearId: 'gear-456',
  gear: { ...mockGear, id: 'gear-456', title: 'Lens B', userId: mockOwnerUser.id },
  renterId: 'renter-user-id',
  renter: { id: 'renter-user-id', email: 'renter@example.com', full_name: 'Renter User' },
  ownerId: mockOwnerUser.id,
  owner: mockOwnerUser,
  startDate: new Date('2025-09-01T00:00:00.000Z'),
  endDate: new Date('2025-09-05T00:00:00.000Z'),
  status: 'pending',
  message: 'Please approve.',
  paymentIntentId: 'pi_owned-2',
  clientSecret: 'cs_owned-2',
  paymentStatus: 'requires_payment_method',
  createdAt: new Date('2025-08-30T00:00:00.000Z'),
};

describe('MyRentalsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useRouter push function
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    // Reset useAuth mock for each test
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
    (prisma.rental.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.rental.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.rental.update as jest.Mock).mockResolvedValue({});
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

  it('displays rentals where user is the renter', async () => {
    (prisma.rental.findMany as jest.Mock).mockResolvedValue([mockRentalRented]);

    await act(async () => {
      render(<MyRentalsPage />);
    });

    expect(await screen.findByText(/Gear I'm Renting/i)).toBeInTheDocument();
    expect(await screen.findByText(mockRentalRented.gear.title)).toBeInTheDocument();
    expect(screen.getByText(`From: ${mockRentalRented.owner.full_name}`)).toBeInTheDocument();
    expect(screen.getByText(/pay now/i)).toBeInTheDocument();
  });

  it('displays rentals where user is the owner', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockOwnerUser,
      loading: false,
    });
    (prisma.rental.findMany as jest.Mock).mockResolvedValue([mockRentalOwned]);

    await act(async () => {
      render(<MyRentalsPage />);
    });

    expect(await screen.findByText('Rentals for My Gear')).toBeInTheDocument();
    expect(await screen.findByText(mockRentalOwned.gear.title)).toBeInTheDocument();
    expect(screen.getByText(`To: ${mockRentalOwned.renter.full_name}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
  });

  it('calls approve API and refreshes rentals on success', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockOwnerUser,
      loading: false,
    });
    (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRentalOwned);
    (prisma.rental.update as jest.Mock).mockResolvedValue({ ...mockRentalOwned, status: 'approved' });
    (prisma.rental.findMany as jest.Mock).mockResolvedValueOnce([mockRentalOwned]); // Initial fetch
    (prisma.rental.findMany as jest.Mock).mockResolvedValueOnce([{ ...mockRentalOwned, status: 'approved' }]); // After update

    await act(async () => {
      render(<MyRentalsPage />);
    });

    await screen.findByText('Rentals for My Gear');
    await screen.findByText('Lens B'); // Wait for the gear item to appear

    const approveButton = await screen.findByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(prisma.rental.update).toHaveBeenCalledWith({
        where: { id: mockRentalOwned.id },
        data: { status: 'approved' },
      });
      expect(toast.success).toHaveBeenCalledWith('Rental request approved!');
      // Verify that rentals are re-fetched
      expect(prisma.rental.findMany).toHaveBeenCalledTimes(2);
    });
  });

  it('calls reject API and refreshes rentals on success', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockOwnerUser,
      loading: false,
    });
    (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRentalOwned);
    (prisma.rental.update as jest.Mock).mockResolvedValue({ ...mockRentalOwned, status: 'rejected' });
    (prisma.rental.findMany as jest.Mock).mockResolvedValueOnce([mockRentalOwned]); // Initial fetch
    (prisma.rental.findMany as jest.Mock).mockResolvedValueOnce([{ ...mockRentalOwned, status: 'rejected' }]); // After update

    await act(async () => {
      render(<MyRentalsPage />);
    });

    await screen.findByText('Rentals for My Gear');
    await screen.findByText('Lens B'); // Wait for the gear item to appear
    
    const rejectButton = await screen.findByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(prisma.rental.update).toHaveBeenCalledWith({
        where: { id: mockRentalOwned.id },
        data: { status: 'rejected' },
      });
      expect(toast.success).toHaveBeenCalledWith('Rental request rejected!');
      // Verify that rentals are re-fetched
      expect(prisma.rental.findMany).toHaveBeenCalledTimes(2);
    });
  });
});