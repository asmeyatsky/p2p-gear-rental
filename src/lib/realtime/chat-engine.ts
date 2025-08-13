/**
 * Real-time Communication Platform
 * Provides live chat, notifications, and real-time collaboration features
 */

import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import { fraudDetectionEngine } from '@/lib/ai/fraud-detection';

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

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
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

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  messageSound: boolean;
  quietHours: { start: string; end: string } | null;
  frequency: 'immediate' | 'batched' | 'daily_digest';
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

class RealTimeChatEngine {
  private wsConnections = new Map<string, WebSocket>();
  private userPresence = new Map<string, UserPresence>();
  private typingIndicators = new Map<string, TypingIndicator[]>();
  private readonly MESSAGE_BATCH_SIZE = 50;
  private readonly TYPING_TIMEOUT = 3000; // 3 seconds

  /**
   * Initialize real-time chat system
   */
  async initialize(): Promise<void> {
    logger.info('Initializing real-time chat engine', {}, 'CHAT_ENGINE');
    
    // Set up cleanup intervals
    setInterval(() => this.cleanupTypingIndicators(), 5000);
    setInterval(() => this.updateUserPresence(), 30000);
    setInterval(() => this.processMessageQueue(), 1000);
  }

  /**
   * Handle WebSocket connection
   */
  async handleWebSocketConnection(
    websocket: WebSocket,
    userId: string,
    deviceInfo: UserPresence['deviceInfo']
  ): Promise<void> {
    logger.info('New WebSocket connection', { userId }, 'CHAT_ENGINE');

    // Store connection
    this.wsConnections.set(userId, websocket);

    // Update user presence
    await this.updateUserPresenceStatus(userId, 'online', deviceInfo);

    // Set up message handlers
    websocket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        await this.handleWebSocketMessage(userId, data);
      } catch (error) {
        logger.error('WebSocket message error', { userId, error }, 'CHAT_ENGINE');
      }
    };

    websocket.onclose = async () => {
      logger.info('WebSocket connection closed', { userId }, 'CHAT_ENGINE');
      this.wsConnections.delete(userId);
      await this.updateUserPresenceStatus(userId, 'offline', deviceInfo);
    };

    websocket.onerror = (error) => {
      logger.error('WebSocket error', { userId, error }, 'CHAT_ENGINE');
    };

    // Send initial presence data
    await this.sendToUser(userId, {
      type: 'presence_update',
      data: await this.getPresenceData(userId)
    });
  }

  /**
   * Send a message
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    type: ChatMessage['type'] = 'text',
    metadata?: ChatMessage['metadata'],
    conversationId?: string
  ): Promise<ChatMessage> {
    // Fraud check
    const fraudCheck = await fraudDetectionEngine.assessRisk(senderId, 'send_message', {
      message: content
    });

    if (!fraudCheck.allowTransaction) {
      throw new Error('Message blocked due to security concerns');
    }

    // Get or create conversation
    const conversation = conversationId
      ? await this.getConversation(conversationId)
      : await this.createOrGetDirectConversation(senderId, receiverId);

    if (!conversation) {
      throw new Error('Failed to create conversation');
    }

    // Create message
    const message: ChatMessage = {
      id: this.generateMessageId(),
      conversationId: conversation.id,
      senderId,
      receiverId,
      content,
      type,
      metadata: {
        ...metadata,
        isEncrypted: conversation.metadata.isEncrypted
      },
      status: 'sent',
      isEdited: false,
      createdAt: new Date()
    };

    // Encrypt if needed
    if (conversation.metadata.isEncrypted) {
      message.content = await this.encryptMessage(message.content);
    }

    // Store message
    await this.storeMessage(message);

    // Update conversation
    await this.updateConversationLastActivity(conversation.id, message);

    // Send real-time notifications
    await this.notifyParticipants(conversation, message);

    // Update delivery status
    await this.updateMessageStatus(message.id, 'delivered');

    logger.info('Message sent', {
      messageId: message.id,
      conversationId: conversation.id,
      senderId,
      receiverId,
      type
    }, 'CHAT_ENGINE');

    return message;
  }

  /**
   * Get conversation messages with pagination
   */
  async getMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    before?: string
  ): Promise<{
    messages: ChatMessage[];
    hasMore: boolean;
    nextCursor?: string;
  }> {
    // Verify user access
    const conversation = await this.getConversation(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error('Access denied to conversation');
    }

    const cacheKey = CacheManager.keys.custom(`messages:${conversationId}:${before || 'latest'}:${limit}`);
    const cached = await CacheManager.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Get messages from database
    const messages = await this.fetchMessagesFromDB(conversationId, limit, before);

    // Decrypt messages if needed
    const decryptedMessages = await Promise.all(
      messages.map(async (msg) => {
        if (msg.metadata?.isEncrypted) {
          return {
            ...msg,
            content: await this.decryptMessage(msg.content)
          };
        }
        return msg;
      })
    );

    // Mark messages as read
    await this.markMessagesAsRead(
      decryptedMessages.filter(m => m.receiverId === userId).map(m => m.id)
    );

    const result = {
      messages: decryptedMessages,
      hasMore: messages.length === limit,
      nextCursor: messages.length > 0 ? messages[messages.length - 1].id : undefined
    };

    await CacheManager.set(cacheKey, result, 300); // 5 minutes

    return result;
  }

  /**
   * Start typing indicator
   */
  async startTyping(userId: string, conversationId: string): Promise<void> {
    const indicator: TypingIndicator = {
      conversationId,
      userId,
      isTyping: true,
      timestamp: new Date()
    };

    // Update typing indicators
    const indicators = this.typingIndicators.get(conversationId) || [];
    const existingIndex = indicators.findIndex(i => i.userId === userId);
    
    if (existingIndex >= 0) {
      indicators[existingIndex] = indicator;
    } else {
      indicators.push(indicator);
    }
    
    this.typingIndicators.set(conversationId, indicators);

    // Notify other participants
    await this.notifyTypingStatus(conversationId, userId, true);

    // Auto-stop typing after timeout
    setTimeout(() => {
      this.stopTyping(userId, conversationId);
    }, this.TYPING_TIMEOUT);
  }

  /**
   * Stop typing indicator
   */
  async stopTyping(userId: string, conversationId: string): Promise<void> {
    const indicators = this.typingIndicators.get(conversationId) || [];
    const updatedIndicators = indicators.filter(i => i.userId !== userId);
    
    this.typingIndicators.set(conversationId, updatedIndicators);

    // Notify other participants
    await this.notifyTypingStatus(conversationId, userId, false);
  }

  /**
   * Initiate video call
   */
  async initiateVideoCall(
    callerId: string,
    receiverId: string,
    conversationId?: string
  ): Promise<VideoCallSession> {
    // Get or create conversation
    const conversation = conversationId
      ? await this.getConversation(conversationId)
      : await this.createOrGetDirectConversation(callerId, receiverId);

    if (!conversation) {
      throw new Error('Failed to create conversation for video call');
    }

    const session: VideoCallSession = {
      id: this.generateCallId(),
      conversationId: conversation.id,
      participants: [callerId, receiverId],
      status: 'initiating',
      startedAt: new Date(),
      recordingEnabled: false,
      screenSharingEnabled: false,
      metadata: {
        quality: 'medium',
        bandwidth: 0
      }
    };

    // Store session
    await this.storeVideoCallSession(session);

    // Send call notification to receiver
    await this.sendToUser(receiverId, {
      type: 'incoming_call',
      data: {
        sessionId: session.id,
        callerId,
        conversationId: conversation.id,
        type: 'video'
      }
    });

    // Send call status to caller
    await this.sendToUser(callerId, {
      type: 'call_initiated',
      data: session
    });

    logger.info('Video call initiated', {
      sessionId: session.id,
      callerId,
      receiverId,
      conversationId: conversation.id
    }, 'CHAT_ENGINE');

    return session;
  }

  /**
   * Answer video call
   */
  async answerVideoCall(sessionId: string, userId: string): Promise<VideoCallSession> {
    const session = await this.getVideoCallSession(sessionId);
    
    if (!session || !session.participants.includes(userId)) {
      throw new Error('Invalid call session');
    }

    session.status = 'active';
    await this.updateVideoCallSession(session);

    // Notify all participants
    await Promise.all(
      session.participants.map(participantId =>
        this.sendToUser(participantId, {
          type: 'call_answered',
          data: session
        })
      )
    );

    return session;
  }

  /**
   * End video call
   */
  async endVideoCall(sessionId: string, userId: string): Promise<void> {
    const session = await this.getVideoCallSession(sessionId);
    
    if (!session || !session.participants.includes(userId)) {
      throw new Error('Invalid call session');
    }

    session.status = 'ended';
    session.endedAt = new Date();
    session.metadata.duration = session.endedAt.getTime() - session.startedAt.getTime();

    await this.updateVideoCallSession(session);

    // Notify all participants
    await Promise.all(
      session.participants.map(participantId =>
        this.sendToUser(participantId, {
          type: 'call_ended',
          data: session
        })
      )
    );

    logger.info('Video call ended', {
      sessionId,
      duration: session.metadata.duration,
      endedBy: userId
    }, 'CHAT_ENGINE');
  }

  /**
   * Share location in chat
   */
  async shareLocation(
    senderId: string,
    receiverId: string,
    location: { lat: number; lng: number; address: string },
    conversationId?: string
  ): Promise<ChatMessage> {
    return this.sendMessage(
      senderId,
      receiverId,
      `📍 Shared location: ${location.address}`,
      'location',
      { location },
      conversationId
    );
  }

  /**
   * Send payment request
   */
  async sendPaymentRequest(
    senderId: string,
    receiverId: string,
    amount: number,
    description: string,
    conversationId?: string
  ): Promise<ChatMessage> {
    return this.sendMessage(
      senderId,
      receiverId,
      `💳 Payment request: $${amount} - ${description}`,
      'payment_request',
      { paymentAmount: amount },
      conversationId
    );
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error('Access denied');
    }

    conversation.isArchived = true;
    await this.updateConversation(conversation);

    // Clear from cache
    await CacheManager.del(CacheManager.keys.custom(`conversation:${conversationId}`));
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(
    userId: string,
    includeArchived: boolean = false
  ): Promise<Conversation[]> {
    const cacheKey = CacheManager.keys.custom(`user_conversations:${userId}:${includeArchived}`);
    const cached = await CacheManager.get<Conversation[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const conversations = await this.fetchUserConversationsFromDB(userId, includeArchived);
    
    await CacheManager.set(cacheKey, conversations, 300); // 5 minutes
    return conversations;
  }

  /**
   * Search messages
   */
  async searchMessages(
    userId: string,
    query: string,
    conversationId?: string,
    limit: number = 20
  ): Promise<ChatMessage[]> {
    // Get user's accessible conversations
    const userConversations = await this.getUserConversations(userId);
    const accessibleConversationIds = userConversations.map(c => c.id);

    // Search in specific conversation or all accessible conversations
    const searchConversationIds = conversationId
      ? [conversationId]
      : accessibleConversationIds;

    return this.searchMessagesInDB(query, searchConversationIds, limit);
  }

  // Private helper methods
  private async handleWebSocketMessage(userId: string, data: any): Promise<void> {
    switch (data.type) {
      case 'send_message':
        await this.sendMessage(
          userId,
          data.receiverId,
          data.content,
          data.messageType || 'text',
          data.metadata,
          data.conversationId
        );
        break;

      case 'typing_start':
        await this.startTyping(userId, data.conversationId);
        break;

      case 'typing_stop':
        await this.stopTyping(userId, data.conversationId);
        break;

      case 'mark_read':
        await this.markMessagesAsRead(data.messageIds);
        break;

      case 'update_presence':
        await this.updateUserPresenceStatus(userId, data.status, data.deviceInfo);
        break;

      case 'ping':
        await this.sendToUser(userId, { type: 'pong' });
        break;

      default:
        logger.warn('Unknown WebSocket message type', { userId, type: data.type }, 'CHAT_ENGINE');
    }
  }

  private async sendToUser(userId: string, data: any): Promise<void> {
    const connection = this.wsConnections.get(userId);
    
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(data));
    } else {
      // User is offline, store message for later delivery
      await this.storeOfflineMessage(userId, data);
    }
  }

  private async notifyParticipants(conversation: Conversation, message: ChatMessage): Promise<void> {
    const notifications = conversation.participants
      .filter(participantId => participantId !== message.senderId)
      .map(async (participantId) => {
        // Send real-time notification
        await this.sendToUser(participantId, {
          type: 'new_message',
          data: message
        });

        // Send push notification if user is offline
        const presence = this.userPresence.get(participantId);
        if (!presence || presence.status === 'offline') {
          await this.sendPushNotification(participantId, message);
        }
      });

    await Promise.all(notifications);
  }

  private async notifyTypingStatus(
    conversationId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) return;

    const otherParticipants = conversation.participants.filter(p => p !== userId);
    
    await Promise.all(
      otherParticipants.map(participantId =>
        this.sendToUser(participantId, {
          type: 'typing_indicator',
          data: {
            conversationId,
            userId,
            isTyping
          }
        })
      )
    );
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async encryptMessage(content: string): Promise<string> {
    // Implement end-to-end encryption
    // For now, return as-is (would use proper encryption in production)
    return content;
  }

  private async decryptMessage(encryptedContent: string): Promise<string> {
    // Implement decryption
    // For now, return as-is (would use proper decryption in production)
    return encryptedContent;
  }

  private cleanupTypingIndicators(): void {
    const cutoff = new Date(Date.now() - this.TYPING_TIMEOUT);
    
    for (const [conversationId, indicators] of this.typingIndicators.entries()) {
      const activeIndicators = indicators.filter(i => i.timestamp > cutoff);
      
      if (activeIndicators.length !== indicators.length) {
        this.typingIndicators.set(conversationId, activeIndicators);
      }
    }
  }

  private async updateUserPresence(): Promise<void> {
    // Update presence for all connected users
    for (const [userId, connection] of this.wsConnections.entries()) {
      if (connection.readyState === WebSocket.OPEN) {
        const presence = this.userPresence.get(userId);
        if (presence) {
          presence.lastSeen = new Date();
        }
      }
    }
  }

  private async processMessageQueue(): Promise<void> {
    // Process any queued messages or notifications
    // This would handle message delivery retries, etc.
  }

  // Database operations (simplified - would be implemented with actual DB calls)
  private async storeMessage(message: ChatMessage): Promise<void> {
    // Store in database
    logger.debug('Storing message', { messageId: message.id }, 'CHAT_ENGINE');
  }

  private async getConversation(conversationId: string): Promise<Conversation | null> {
    // Get from cache or database
    const cacheKey = CacheManager.keys.custom(`conversation:${conversationId}`);
    return CacheManager.get<Conversation>(cacheKey);
  }

  private async createOrGetDirectConversation(userId1: string, userId2: string): Promise<Conversation> {
    // Create or get existing direct conversation
    const conversation: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participants: [userId1, userId2],
      type: 'direct',
      lastActivity: new Date(),
      isArchived: false,
      metadata: {
        isEncrypted: true,
        allowFileSharing: true,
        allowLocationSharing: true,
        priority: 'normal'
      },
      createdAt: new Date()
    };

    // Store in cache and database
    await CacheManager.set(
      CacheManager.keys.custom(`conversation:${conversation.id}`),
      conversation,
      3600
    );

    return conversation;
  }

  private async updateConversationLastActivity(conversationId: string, message: ChatMessage): Promise<void> {
    // Update conversation with last message and activity
    logger.debug('Updating conversation activity', { conversationId }, 'CHAT_ENGINE');
  }

  private async updateMessageStatus(messageId: string, status: ChatMessage['status']): Promise<void> {
    // Update message status in database
    logger.debug('Updating message status', { messageId, status }, 'CHAT_ENGINE');
  }

  private async markMessagesAsRead(messageIds: string[]): Promise<void> {
    // Mark messages as read in database
    logger.debug('Marking messages as read', { messageIds }, 'CHAT_ENGINE');
  }

  private async fetchMessagesFromDB(
    conversationId: string,
    limit: number,
    before?: string
  ): Promise<ChatMessage[]> {
    // Fetch messages from database with pagination
    return [];
  }

  private async fetchUserConversationsFromDB(userId: string, includeArchived: boolean): Promise<Conversation[]> {
    // Fetch user conversations from database
    return [];
  }

  private async searchMessagesInDB(
    query: string,
    conversationIds: string[],
    limit: number
  ): Promise<ChatMessage[]> {
    // Search messages in database
    return [];
  }

  private async storeOfflineMessage(userId: string, data: any): Promise<void> {
    // Store message for offline user delivery
    logger.debug('Storing offline message', { userId }, 'CHAT_ENGINE');
  }

  private async sendPushNotification(userId: string, message: ChatMessage): Promise<void> {
    // Send push notification to user's devices
    logger.debug('Sending push notification', { userId, messageId: message.id }, 'CHAT_ENGINE');
  }

  private async updateUserPresenceStatus(
    userId: string,
    status: UserPresence['status'],
    deviceInfo: UserPresence['deviceInfo']
  ): Promise<void> {
    const presence: UserPresence = {
      userId,
      status,
      lastSeen: new Date(),
      deviceInfo
    };

    this.userPresence.set(userId, presence);

    // Broadcast presence update to contacts
    await this.broadcastPresenceUpdate(userId, presence);
  }

  private async broadcastPresenceUpdate(userId: string, presence: UserPresence): Promise<void> {
    // Broadcast to user's contacts
    logger.debug('Broadcasting presence update', { userId, status: presence.status }, 'CHAT_ENGINE');
  }

  private async getPresenceData(userId: string): Promise<any> {
    // Get presence data for user
    return {
      onlineUsers: Array.from(this.userPresence.entries())
        .filter(([, p]) => p.status === 'online')
        .map(([id, p]) => ({ userId: id, status: p.status, lastSeen: p.lastSeen }))
    };
  }

  private async storeVideoCallSession(session: VideoCallSession): Promise<void> {
    // Store video call session
    logger.debug('Storing video call session', { sessionId: session.id }, 'CHAT_ENGINE');
  }

  private async getVideoCallSession(sessionId: string): Promise<VideoCallSession | null> {
    // Get video call session
    return null;
  }

  private async updateVideoCallSession(session: VideoCallSession): Promise<void> {
    // Update video call session
    logger.debug('Updating video call session', { sessionId: session.id }, 'CHAT_ENGINE');
  }

  private async updateConversation(conversation: Conversation): Promise<void> {
    // Update conversation in database
    logger.debug('Updating conversation', { conversationId: conversation.id }, 'CHAT_ENGINE');
  }
}

export const realTimeChatEngine = new RealTimeChatEngine();

/**
 * Initialize chat system
 */
export async function initializeChatSystem(): Promise<void> {
  await realTimeChatEngine.initialize();
}

/**
 * Handle WebSocket connection for real-time chat
 */
export async function handleChatWebSocket(
  websocket: WebSocket,
  userId: string,
  deviceInfo: UserPresence['deviceInfo']
): Promise<void> {
  await realTimeChatEngine.handleWebSocketConnection(websocket, userId, deviceInfo);
}

/**
 * Send a chat message
 */
export async function sendChatMessage(
  senderId: string,
  receiverId: string,
  content: string,
  type?: ChatMessage['type'],
  metadata?: ChatMessage['metadata']
): Promise<ChatMessage> {
  return realTimeChatEngine.sendMessage(senderId, receiverId, content, type, metadata);
}