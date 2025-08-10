import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from './login/page';
import SignupPage from './signup/page';
import { useAuth } from '@/components/auth/AuthProvider';
import toast from 'react-hot-toast';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock useAuth hook
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({
    signIn: jest.fn(),
    signUp: jest.fn(),
    user: null,
    loading: false,
  })),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const mockSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      signUp: jest.fn(),
      user: null,
      loading: false,
    });
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls signIn and redirects on successful login', async () => {
    mockSignIn.mockResolvedValue({ error: null });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(toast.success).toHaveBeenCalledWith('Logged in successfully!');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('displays error message on failed login', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});

describe('SignupPage', () => {
  const mockPush = jest.fn();
  const mockSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({
      signIn: jest.fn(),
      signUp: mockSignUp,
      user: null,
      loading: false,
    });
  });

  it('renders the signup form', () => {
    render(<SignupPage />);
    expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('calls signUp and redirects on successful signup', async () => {
    mockSignUp.mockResolvedValue({ error: null });

    render(<SignupPage />);

    fireEvent.change(screen.getByPlaceholderText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('john@example.com', 'password123', 'John Doe');
      expect(toast.success).toHaveBeenCalledWith('Account created successfully!');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('displays error message on failed signup', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'Email already in use' } });

    render(<SignupPage />);

    fireEvent.change(screen.getByPlaceholderText(/full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('jane@example.com', 'password123', 'Jane Doe');
      expect(toast.error).toHaveBeenCalledWith('Email already in use');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
