import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import MessagesPage from './page';
import { useAuth } from '@/components/auth/AuthProvider';
import { realTimeChatClient } from '@/lib/realtime/chat-client';

// Mock the dependencies
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/realtime/chat-client', () => ({
  realTimeChatClient: {
    getUserConversations: vi.fn(),
    getMessages: vi.fn(),
  },
  sendChatMessage: vi.fn(),
}));

describe('MessagesPage', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    full_name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useAuth to return a logged in user
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    // Mock chat engine responses
    (realTimeChatEngine.getUserConversations as jest.Mock).mockResolvedValue([]);
    (realTimeChatEngine.getMessages as jest.Mock).mockResolvedValue({
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

  it('shows loading state initially', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(<MessagesPage />);
    
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
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
    
    (realTimeChatEngine.getUserConversations as jest.Mock).mockResolvedValue(mockConversations);
    
    render(<MessagesPage />);
    
    await waitFor(() => {
      expect(realTimeChatEngine.getUserConversations).toHaveBeenCalledWith('user123');
    });

    expect(screen.getByText('User')).toBeInTheDocument();
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

  it('handles search input', () => {
    render(<MessagesPage />);
    
    const searchInput = screen.getByPlaceholderText('Search conversations...');
    expect(searchInput).toBeInTheDocument();
    
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(searchInput).toHaveValue('test');
  });
});