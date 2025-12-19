/**
 * Real-time Communication Platform
 * Client-side WebSocket communication layer for chat functionality
 * This file handles real-time messaging UI and connects to server API routes
 */

import { logger } from '@/lib/logger';
// Note: Client-side fraud detection import removed to avoid server-side dependency issues
// Fraud detection happens on the server via API

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'typing' | 'location' | 'payment_request';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    imageUrl?: string;
    location?: { lat: number; lng: number; address: string };
    paymentAmount?: number;
    isEncrypted?: boolean;
    threadId?: string;
    replyToId?: string;
  };
  status: 'sent' | 'delivered' | 'read' | 'failed';
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  deletedAt?: Date;
}

export interface Conversation {
  id: string;
  participants: string[];
  type: 'direct' | 'group' | 'support';
  title?: string;
  rentalId?: string;
  gearId?: string;
  lastMessage?: ChatMessage;
  lastActivity: Date;
  isArchived: boolean;
  metadata: {
    isEncrypted: boolean;
    allowFileSharing: boolean;
    allowLocationSharing: boolean;
    autoDeleteAfter?: number; // hours
    priority: 'low' | 'normal' | 'high' | 'urgent';
  };
  createdAt: Date;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  currentActivity?: string;
  deviceInfo: {
    type: 'mobile' | 'desktop' | 'tablet';
    platform: string;
    browser?: string;
  };
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface VideoCallSession {
  id: string;
  conversationId: string;
  participants: string[];
  status: 'initiating' | 'ringing' | 'active' | 'ended' | 'failed';
  startedAt: Date;
  endedAt?: Date;
  recordingEnabled: boolean;
  screenSharingEnabled: boolean;
  metadata: {
    quality: 'low' | 'medium' | 'high';
    bandwidth: number;
    duration?: number;
  };
}

class RealTimeChatClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private readonly RECONNECT_INTERVAL = 3000;
  private readonly TYPING_TIMEOUT = 3000; // 3 seconds
  private callbacks: Map<string, (data: any) => void> = new Map();
  private userId: string | null = null;

  /**
   * Initialize real-time chat client
   */
  async initialize(): Promise<void> {
    logger.info('Initializing real-time chat client', {}, 'CHAT_CLIENT');
  }

  /**
   * Connect to real-time messaging service
   */
  async connect(userId: string, token?: string): Promise<void> {
    this.userId = userId;
    
    // Use environment variable to determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL 
      ? `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}?token=${token}`
      : `${protocol}//${window.location.host}/api/ws`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        logger.info('Connected to chat service', { userId }, 'CHAT_CLIENT');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          logger.error('Failed to parse WebSocket message', { error }, 'CHAT_CLIENT');
        }
      };
      
      this.ws.onclose = () => {
        logger.warn('Disconnected from chat service', { userId }, 'CHAT_CLIENT');
        this.isConnected = false;
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(userId, token);
          }, this.RECONNECT_INTERVAL);
        }
      };
      
      this.ws.onerror = (error) => {
        logger.error('WebSocket error', { error }, 'CHAT_CLIENT');
      };
    } catch (error) {
      logger.error('Failed to connect to chat service', { error, userId }, 'CHAT_CLIENT');
    }
  }

  /**
   * Disconnect from the service
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  /**
   * Send a message to the server
   */
  async sendMessage(
    conversationId: string,
    content: string,
    type: ChatMessage['type'] = 'text',
    metadata?: ChatMessage['metadata']
  ): Promise<void> {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to chat service');
    }

    // Note: Fraud detection happens on server-side via API call
    // Client only sends the message, server performs fraud checks

    const message = {
      type: 'send_message',
      data: {
        conversationId,
        content,
        type,
        metadata,
        senderId: this.userId,
        timestamp: new Date().toISOString()
      }
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    // Call API route to get conversations
    const response = await fetch(`/api/conversations?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }
    return response.json();
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, userId: string, limit: number = 50, before?: string): Promise<{ messages: ChatMessage[], hasMore: boolean, nextCursor?: string }> {
    // Call API route to get messages
    const params = new URLSearchParams({ conversationId, limit: limit.toString() });
    if (before) params.append('before', before);
    
    const response = await fetch(`/api/conversations/${conversationId}/messages?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    return response.json();
  }

  /**
   * Create or get direct conversation
   */
  async createOrGetDirectConversation(userId: string, otherUserId: string): Promise<Conversation> {
    // Call API route to create or get conversation
    const response = await fetch('/api/conversations/direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, otherUserId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create or get conversation');
    }
    
    return response.json();
  }

  /**
   * Indicate typing status
   */
  sendTypingStatus(conversationId: string, isTyping: boolean): void {
    if (!this.isConnected || !this.ws) {
      return;
    }

    const typingMessage = {
      type: 'typing_status',
      data: {
        conversationId,
        userId: this.userId,
        isTyping,
        timestamp: new Date().toISOString()
      }
    };

    this.ws.send(JSON.stringify(typingMessage));
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    // Call API route to mark messages as read
    const response = await fetch('/api/messages/mark-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageIds })
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    switch (data.type) {
      case 'new_message':
        // Handle new message event
        this.callbacks.get('onNewMessage')?.(data.data);
        break;
        
      case 'message_delivered':
        // Handle message delivery confirmation
        this.callbacks.get('onMessageDelivered')?.(data.data);
        break;
        
      case 'message_read':
        // Handle message read confirmation
        this.callbacks.get('onMessageRead')?.(data.data);
        break;
        
      case 'user_typing':
        // Handle typing indicator
        this.callbacks.get('onUserTyping')?.(data.data);
        break;
        
      case 'user_presence':
        // Handle presence update
        this.callbacks.get('onUserPresence')?.(data.data);
        break;
        
      case 'video_call_notification':
        // Handle video call events
        this.callbacks.get('onVideoCallEvent')?.(data.data);
        break;
        
      default:
        logger.warn('Unknown message type received', { type: data.type }, 'CHAT_CLIENT');
    }
  }

  /**
   * Register callback for specific events
   */
  on(event: 'new_message' | 'message_delivered' | 'message_read' | 'user_typing' | 'user_presence' | 'video_call_notification', callback: (data: any) => void): void {
    this.callbacks.set(event, callback);
  }

  /**
   * Remove callback for specific event
   */
  off(event: 'new_message' | 'message_delivered' | 'message_read' | 'user_typing' | 'user_presence' | 'video_call_notification'): void {
    this.callbacks.delete(event);
  }
}

export const realTimeChatClient = new RealTimeChatClient();

/**
 * Initialize chat system client
 */
export async function initializeChatClient(): Promise<void> {
  await realTimeChatClient.initialize();
}

/**
 * Send a chat message via WebSocket
 */
export async function sendChatMessage(
  senderId: string,
  receiverId: string,
  content: string,
  type?: ChatMessage['type'],
  metadata?: ChatMessage['metadata']
): Promise<ChatMessage> {
  // For now, send via API route since we're not fully implementing WebSocket messaging in this iteration
  const response = await fetch('/api/messages/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receiverId,
      content,
      type: type || 'text',
      metadata
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  
  return response.json();
}