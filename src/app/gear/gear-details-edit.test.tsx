import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useParams, useRouter, redirect } from 'next/navigation';
import EditGearPage from '../edit-gear/[id]/page';
import GearDetailsClient from './[id]/GearDetailsClient';
import { useAuth } from '@/components/auth/AuthProvider';
import toast from 'react-hot-toast';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
  redirect: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
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

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt="" />;
  },
}));

// Mock Google Analytics
jest.mock('@/lib/gtag', () => ({
  event: jest.fn(),
}));

// Mock fetch API
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('GearDetailsClient', () => {
  const mockPush = jest.fn();
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };
  const mockGear = {
    id: 'gear-123',
    title: 'Test Gear',
    description: 'A test gear item',
    dailyRate: 10.0,
    weeklyRate: 60,
    monthlyRate: 150,
    city: 'Test City',
    state: 'TS',
    images: ['/image1.jpg'],
    category: 'cameras',
    userId: 'test-user-id',
    user: {
      id: 'test-user-id',
      full_name: 'Test User',
      email: 'test@example.com',
      averageRating: 4.5,
      totalReviews: 10,
    },
    brand: 'Test Brand',
    model: 'Test Model',
    condition: 'good',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
  });

  it('displays gear details and edit button for owner', async () => {
    const isOwnGear = true; // Simulate owner
    await act(async () => {
      render(<GearDetailsClient gear={mockGear} currentUserId={mockUser.id} />);
    });

    expect(screen.getByText(mockGear.title)).toBeInTheDocument();
    expect(screen.getByText(mockGear.description)).toBeInTheDocument();
    expect(screen.getByText(`$${mockGear.dailyRate}/day`)).toBeInTheDocument();

    // For owners, check for edit button
    expect(screen.getByText(/edit listing/i)).toBeInTheDocument();
  });

  it('does not show edit button for non-owner', async () => {
    await act(async () => {
      render(<GearDetailsClient gear={mockGear} currentUserId={'other-user-id'} />);
    });

    expect(screen.getByText(mockGear.title)).toBeInTheDocument();

    // Check that edit button is not present for non-owner
    expect(screen.queryByText(/edit listing/i)).not.toBeInTheDocument();
    // Instead, non-owner should see request rental button
    expect(screen.getByText(/request rental/i)).toBeInTheDocument();
  });

  it('calls router.push to edit page for owner', async () => {
    await act(async () => {
      render(<GearDetailsClient gear={mockGear} currentUserId={mockUser.id} />);
    });

    const editButton = screen.getByText(/edit listing/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/gear/${mockGear.id}/edit`);
    });
  });
});

describe('EditGearPage', () => {
  const mockPush = jest.fn();
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
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
    userId: 'test-user-id',
    brand: 'Test Brand',
    model: 'Test Model',
    condition: 'good',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ id: mockGear.id });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGear),
    });
  });

  it('redirects to login if user is not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    await act(async () => {
      render(<EditGearPage />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('redirects to gear details if user is not the owner', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, id: 'other-user-id' },
      loading: false,
    });

    await act(async () => {
      render(<EditGearPage />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/gear/${mockGear.id}`);
    });
  });

  it('displays form pre-filled with gear data for owner', async () => {
    await act(async () => {
      render(<EditGearPage />);
    });

    // Use findByDisplayValue to wait for the elements to appear
    expect(await screen.findByDisplayValue(mockGear.title)).toBeInTheDocument();
    expect(await screen.findByDisplayValue(mockGear.description)).toBeInTheDocument();
    expect(await screen.findByDisplayValue(mockGear.dailyRate.toString())).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /update gear/i })).toBeInTheDocument();
  });

  it('calls PUT API and redirects on successful update', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...mockGear, title: 'Updated Title' }),
    });

    await act(async () => {
      render(<EditGearPage />);
    });

    // Wait for the title input and update button to appear
    const titleInput = await screen.findByLabelText(/title/i);
    const updateButton = await screen.findByRole('button', { name: /update gear/i });

    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`/api/gear/${mockGear.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Title',
          description: mockGear.description,
          dailyRate: mockGear.dailyRate,
          city: mockGear.city,
          state: mockGear.state,
          images: mockGear.images,
          brand: mockGear.brand,
          model: mockGear.model,
          condition: mockGear.condition,
        }),
      });
      expect(toast.success).toHaveBeenCalledWith('Gear updated successfully!');
      expect(mockPush).toHaveBeenCalledWith(`/gear/${mockGear.id}`);
    });
  });

  it('displays error toast on failed update', async () => {
    // Mock the initial fetch call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGear),
    });

    // Mock the failed update API call
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to update' }),
    });

    await act(async () => {
      render(<EditGearPage />);
    });

    const updateButton = await screen.findByRole('button', { name: /update gear/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});