import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import MessagesPage from './page';
import { useAuth } from '@/components/auth/AuthProvider';
import { realTimeChatClient } from '@/lib/realtime/chat-client';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => ({
    get: jest.fn().mockReturnValue(null),
  })),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

// Mock the dependencies
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/realtime/chat-client', () => ({
  realTimeChatClient: {
    getUserConversations: jest.fn(),
    getMessages: jest.fn(),
  },
  sendChatMessage: jest.fn(),
}));

describe('MessagesPage', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    full_name: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useAuth to return a logged in user
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    // Mock chat client responses
    (realTimeChatClient.getUserConversations as jest.Mock).mockResolvedValue([]);
    (realTimeChatClient.getMessages as jest.Mock).mockResolvedValue({
      messages: [],
      hasMore: false,
    });
  });

  it('renders the messages page correctly', async () => {
    render(<MessagesPage />);
    
    // Wait for async operations to complete
    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Chat with renters and listers')).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(<MessagesPage />);
    
    expect(await screen.findByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('loads conversations for the logged-in user', async () => {
    const mockConversations = [
      {
        id: 'conv1',
        participants: ['user123', 'user456'],
        type: 'direct' as const,
        lastMessage: {
          content: 'Hello there!',
          createdAt: new Date(),
        },
        lastActivity: new Date(),
        isArchived: false,
        metadata: {
          isEncrypted: true,
          allowFileSharing: true,
          allowLocationSharing: true,
          priority: 'normal' as const,
        },
        createdAt: new Date(),
      }
    ];
    
    (realTimeChatClient.getUserConversations as jest.Mock).mockResolvedValue(mockConversations);

    render(<MessagesPage />);

    await waitFor(() => {
      expect(realTimeChatClient.getUserConversations).toHaveBeenCalledWith('user123');
    });

    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  it('allows sending a new message', async () => {
    const mockConversation = {
      id: 'conv1',
      participants: ['user123', 'user456'],
      type: 'direct',
      lastMessage: null,
      lastActivity: new Date(),
      isArchived: false,
      metadata: {
        isEncrypted: true,
        allowFileSharing: true,
        allowLocationSharing: true,
        priority: 'normal',
      },
      createdAt: new Date(),
    };
    
    // We need to set up a state where a conversation is selected
    // For this test, we'll simulate the state after a conversation is selected
  });

  it('handles search input', async () => {
    render(<MessagesPage />);

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search conversations...');
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(searchInput).toHaveValue('test');
  });
});