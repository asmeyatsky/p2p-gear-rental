import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import GearDetailsPage from '../gear/[id]/page';
import EditGearPage from '../edit-gear/[id]/page';
import { useAuth } from '@/components/auth/AuthProvider';
import toast from 'react-hot-toast';
import Image from 'next/image'; // Import Image for mocking

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
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

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock fetch API
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('GearDetailsPage', () => {
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
    images: ['/image1.jpg'], // Changed to absolute path for next/image
    category: 'cameras',
    userId: 'test-user-id',
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

  it('displays gear details and edit/delete buttons for owner', async () => {
    render(<GearDetailsPage />);

    // Use findByText to wait for the element to appear
    expect(await screen.findByText(mockGear.title)).toBeInTheDocument();
    expect(await screen.findByText(mockGear.description)).toBeInTheDocument();
    expect(await screen.findByText(`$${mockGear.dailyRate.toFixed(2)}`)).toBeInTheDocument(); // Wait for dailyRate
    expect(await screen.findByText(/edit gear/i)).toBeInTheDocument();
    expect(await screen.findByText(/delete gear/i)).toBeInTheDocument();
  });

  it('does not display edit/delete buttons for non-owner', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, id: 'other-user-id' },
      loading: false,
    });

    render(<GearDetailsPage />);

    // Wait for the gear details to load before asserting on button absence
    expect(await screen.findByText(mockGear.title)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/edit gear/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/delete gear/i)).not.toBeInTheDocument();
    });
  });

  it('calls delete API and redirects on successful deletion', async () => {
    window.confirm = jest.fn(() => true); // Mock confirm dialog
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Gear deleted successfully' }),
    });

    render(<GearDetailsPage />);

    // Wait for the delete button to appear before clicking
    const deleteButton = await screen.findByText(/delete gear/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`/api/gear/${mockGear.id}`, {
        method: 'DELETE',
      });
      expect(toast.success).toHaveBeenCalledWith('Gear deleted successfully!');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('displays error toast on failed deletion', async () => {
    window.confirm = jest.fn(() => true); // Mock confirm dialog
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to delete' }),
    });

    render(<GearDetailsPage />);

    // Wait for the delete button to appear before clicking
    const deleteButton = await screen.findByText(/delete gear/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error deleting gear: Failed to delete');
      expect(mockPush).not.toHaveBeenCalled();
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
    brand: '',
    model: '',
    condition: '',
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

    render(<EditGearPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('redirects to gear details if user is not the owner', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, id: 'other-user-id' },
      loading: false,
    });

    render(<EditGearPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/gear/${mockGear.id}`);
    });
  });

  it('displays form pre-filled with gear data for owner', async () => {
    render(<EditGearPage />);

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

    render(<EditGearPage />);

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
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to update' }),
    });

    render(<EditGearPage />);

    const updateButton = await screen.findByRole('button', { name: /update gear/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});