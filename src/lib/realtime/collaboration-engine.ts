/**
 * Real-time Collaboration Engine
 * Provides live activity feeds, collaborative editing, and real-time updates
 */

import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import { prisma } from '@/lib/prisma';

export interface ActivityEvent {
  id: string;
  type: 'gear_created' | 'gear_updated' | 'rental_created' | 'rental_updated' | 
        'payment_completed' | 'review_added' | 'user_joined' | 'message_sent' |
        'price_changed' | 'availability_changed' | 'status_updated';
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  targetType: 'gear' | 'rental' | 'user' | 'message' | 'review';
  targetId: string;
  targetName?: string;
  action: string; // Human readable action description
  details: Record<string, any>;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    location?: { city: string; state: string; };
    device?: string;
    source: 'web' | 'mobile' | 'api' | 'system';
  };
  visibility: 'public' | 'participants' | 'owner' | 'private';
  isImportant: boolean;
  createdAt: Date;
}

export interface LiveUpdate {
  id: string;
  channel: string; // e.g., 'gear:123', 'rental:456', 'user:789'
  type: 'field_update' | 'status_change' | 'new_comment' | 'price_change' | 'availability_update';
  data: {
    field?: string;
    oldValue?: any;
    newValue?: any;
    userId: string;
    userName: string;
    timestamp: Date;
  };
  targetAudience: string[]; // User IDs who should receive this update
}

export interface CollaborativeSession {
  id: string;
  type: 'gear_editing' | 'rental_negotiation' | 'support_session';
  resourceId: string; // ID of the gear, rental, etc.
  participants: CollaborativeParticipant[];
  status: 'active' | 'paused' | 'ended';
  startedAt: Date;
  endedAt?: Date;
  metadata: {
    purpose?: string;
    permissions: Record<string, string[]>; // userId -> [read, write, admin]
    settings: {
      allowAnonymous: boolean;
      requireApproval: boolean;
      maxParticipants: number;
    };
  };
}

export interface CollaborativeParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'owner' | 'collaborator' | 'viewer';
  joinedAt: Date;
  lastSeenAt: Date;
  cursor?: {
    x: number;
    y: number;
    element?: string;
  };
  isTyping: boolean;
  status: 'active' | 'idle' | 'away';
}

export interface ActivityFeed {
  id: string;
  ownerId: string;
  type: 'personal' | 'gear' | 'rental' | 'public' | 'following';
  filters: {
    eventTypes: ActivityEvent['type'][];
    targetTypes: ActivityEvent['targetType'][];
    actorIds: string[];
    since?: Date;
    importance?: 'all' | 'important_only';
  };
  events: ActivityEvent[];
  lastUpdated: Date;
  isRealTime: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  channel: string;
  filters?: {
    eventTypes?: string[];
    importance?: 'all' | 'important_only';
  };
  isActive: boolean;
  createdAt: Date;
}

class CollaborationEngine {
  private wsConnections = new Map<string, WebSocket>();
  private activeSubscriptions = new Map<string, Subscription[]>(); // userId -> subscriptions
  private collaborativeSessions = new Map<string, CollaborativeSession>();
  private readonly MAX_FEED_SIZE = 1000;
  private readonly UPDATE_BATCH_SIZE = 50;

  /**
   * Initialize collaboration engine
   */
  async initialize(): Promise<void> {
    logger.info('Initializing collaboration engine', {}, 'COLLABORATION');
    
    // Set up cleanup intervals
    setInterval(() => this.cleanupInactiveSessions(), 5 * 60 * 1000); // 5 minutes
    setInterval(() => this.processActivityBatches(), 1000); // 1 second
    setInterval(() => this.updateParticipantStatus(), 30 * 1000); // 30 seconds
  }

  /**
   * Track user activity event
   */
  async trackActivity(event: Omit<ActivityEvent, 'id' | 'createdAt'>): Promise<string> {
    const activityEvent: ActivityEvent = {
      ...event,
      id: this.generateActivityId(),
      createdAt: new Date()
    };

    // Store activity event
    await this.storeActivityEvent(activityEvent);

    // Add to relevant feeds
    await this.addToActivityFeeds(activityEvent);

    // Send real-time updates
    await this.broadcastActivity(activityEvent);

    logger.info('Activity tracked', {
      eventId: activityEvent.id,
      type: activityEvent.type,
      actorId: activityEvent.actorId,
      targetType: activityEvent.targetType,
      targetId: activityEvent.targetId
    }, 'COLLABORATION');

    return activityEvent.id;
  }

  /**
   * Send live update to subscribers
   */
  async sendLiveUpdate(update: Omit<LiveUpdate, 'id'>): Promise<void> {
    const liveUpdate: LiveUpdate = {
      ...update,
      id: this.generateUpdateId()
    };

    // Send to specific users
    await Promise.all(
      update.targetAudience.map(userId => this.sendUpdateToUser(userId, liveUpdate))
    );

    // Send to channel subscribers
    await this.broadcastToChannel(update.channel, liveUpdate);

    logger.debug('Live update sent', {
      updateId: liveUpdate.id,
      channel: update.channel,
      type: update.type,
      targetAudience: update.targetAudience.length
    }, 'COLLABORATION');
  }

  /**
   * Start collaborative session
   */
  async startCollaborativeSession(
    resourceId: string,
    type: CollaborativeSession['type'],
    ownerId: string,
    settings?: Partial<CollaborativeSession['metadata']['settings']>
  ): Promise<string> {
    const session: CollaborativeSession = {
      id: this.generateSessionId(),
      type,
      resourceId,
      participants: [{
        userId: ownerId,
        userName: await this.getUserName(ownerId),
        role: 'owner',
        joinedAt: new Date(),
        lastSeenAt: new Date(),
        isTyping: false,
        status: 'active'
      }],
      status: 'active',
      startedAt: new Date(),
      metadata: {
        permissions: {
          [ownerId]: ['read', 'write', 'admin']
        },
        settings: {
          allowAnonymous: false,
          requireApproval: true,
          maxParticipants: 10,
          ...settings
        }
      }
    };

    this.collaborativeSessions.set(session.id, session);

    // Track activity
    await this.trackActivity({
      type: 'user_joined',
      actorId: ownerId,
      actorName: await this.getUserName(ownerId),
      targetType: type === 'gear_editing' ? 'gear' : 'rental',
      targetId: resourceId,
      action: `Started ${type.replace('_', ' ')} session`,
      details: { sessionId: session.id },
      metadata: { source: 'web' },
      visibility: 'participants',
      isImportant: false
    });

    logger.info('Collaborative session started', {
      sessionId: session.id,
      type,
      resourceId,
      ownerId
    }, 'COLLABORATION');

    return session.id;
  }

  /**
   * Join collaborative session
   */
  async joinCollaborativeSession(
    sessionId: string,
    userId: string,
    role: CollaborativeParticipant['role'] = 'collaborator'
  ): Promise<CollaborativeSession> {
    const session = this.collaborativeSessions.get(sessionId);
    
    if (!session) {
      throw new Error('Collaborative session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Session is not active');
    }

    // Check if user is already in session
    const existingParticipant = session.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      existingParticipant.lastSeenAt = new Date();
      existingParticipant.status = 'active';
      return session;
    }

    // Check max participants
    if (session.participants.length >= session.metadata.settings.maxParticipants) {
      throw new Error('Session is full');
    }

    // Add participant
    const participant: CollaborativeParticipant = {
      userId,
      userName: await this.getUserName(userId),
      role,
      joinedAt: new Date(),
      lastSeenAt: new Date(),
      isTyping: false,
      status: 'active'
    };

    session.participants.push(participant);

    // Set permissions
    const permissions = role === 'owner' ? ['read', 'write', 'admin'] :
                      role === 'collaborator' ? ['read', 'write'] :
                      ['read'];
    session.metadata.permissions[userId] = permissions;

    // Notify other participants
    await this.notifySessionParticipants(session, {
      type: 'participant_joined',
      data: { participant }
    });

    // Track activity
    await this.trackActivity({
      type: 'user_joined',
      actorId: userId,
      actorName: participant.userName,
      targetType: session.type === 'gear_editing' ? 'gear' : 'rental',
      targetId: session.resourceId,
      action: `Joined ${session.type.replace('_', ' ')} session`,
      details: { sessionId, role },
      metadata: { source: 'web' },
      visibility: 'participants',
      isImportant: false
    });

    logger.info('User joined collaborative session', {
      sessionId,
      userId,
      role,
      participantCount: session.participants.length
    }, 'COLLABORATION');

    return session;
  }

  /**
   * Update cursor position in collaborative session
   */
  async updateCursor(
    sessionId: string,
    userId: string,
    cursor: CollaborativeParticipant['cursor']
  ): Promise<void> {
    const session = this.collaborativeSessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.find(p => p.userId === userId);
    if (!participant) return;

    participant.cursor = cursor;
    participant.lastSeenAt = new Date();

    // Broadcast cursor update to other participants
    await this.notifySessionParticipants(session, {
      type: 'cursor_update',
      data: { userId, cursor }
    }, [userId]); // Exclude the user who moved the cursor
  }

  /**
   * Subscribe to activity feed
   */
  async subscribeToActivityFeed(
    userId: string,
    feedType: ActivityFeed['type'],
    filters?: ActivityFeed['filters']
  ): Promise<string> {
    const feedId = this.generateFeedId();
    
    const feed: ActivityFeed = {
      id: feedId,
      ownerId: userId,
      type: feedType,
      filters: filters || {
        eventTypes: [],
        targetTypes: [],
        actorIds: []
      },
      events: await this.loadActivityEvents(userId, feedType, filters),
      lastUpdated: new Date(),
      isRealTime: true
    };

    // Store feed
    await this.storeActivityFeed(feed);

    // Set up real-time subscription
    await this.setupFeedSubscription(userId, feed);

    logger.info('User subscribed to activity feed', {
      userId,
      feedId,
      feedType
    }, 'COLLABORATION');

    return feedId;
  }

  /**
   * Get activity feed with pagination
   */
  async getActivityFeed(
    feedId: string,
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      since?: Date;
    } = {}
  ): Promise<{
    events: ActivityEvent[];
    hasMore: boolean;
    total: number;
  }> {
    const feed = await this.getActivityFeedById(feedId);
    
    if (!feed || feed.ownerId !== userId) {
      throw new Error('Activity feed not found or access denied');
    }

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Filter events
    let events = feed.events;
    
    if (options.since) {
      events = events.filter(event => event.createdAt > options.since!);
    }

    // Apply pagination
    const total = events.length;
    const paginatedEvents = events.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      events: paginatedEvents,
      hasMore,
      total
    };
  }

  /**
   * Subscribe to live updates for a specific channel
   */
  async subscribeToChannel(
    userId: string,
    channel: string,
    filters?: Subscription['filters']
  ): Promise<string> {
    const subscription: Subscription = {
      id: this.generateSubscriptionId(),
      userId,
      channel,
      filters,
      isActive: true,
      createdAt: new Date()
    };

    // Add to user's subscriptions
    const userSubscriptions = this.activeSubscriptions.get(userId) || [];
    userSubscriptions.push(subscription);
    this.activeSubscriptions.set(userId, userSubscriptions);

    logger.info('User subscribed to channel', {
      userId,
      channel,
      subscriptionId: subscription.id
    }, 'COLLABORATION');

    return subscription.id;
  }

  /**
   * Unsubscribe from channel
   */
  async unsubscribeFromChannel(userId: string, subscriptionId: string): Promise<void> {
    const userSubscriptions = this.activeSubscriptions.get(userId) || [];
    const updatedSubscriptions = userSubscriptions.filter(sub => sub.id !== subscriptionId);
    
    this.activeSubscriptions.set(userId, updatedSubscriptions);

    logger.info('User unsubscribed from channel', {
      userId,
      subscriptionId
    }, 'COLLABORATION');
  }

  /**
   * Handle WebSocket connection for collaboration
   */
  async handleCollaborationWebSocket(websocket: WebSocket, userId: string): Promise<void> {
    this.wsConnections.set(userId, websocket);

    websocket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        await this.handleCollaborationMessage(userId, data);
      } catch (error) {
        logger.error('Collaboration WebSocket message error', { userId, error }, 'COLLABORATION');
      }
    };

    websocket.onclose = () => {
      this.wsConnections.delete(userId);
      this.handleUserDisconnect(userId);
    };

    // Send initial state
    await this.sendToUser(userId, {
      type: 'collaboration_connected',
      data: {
        userId,
        subscriptions: this.activeSubscriptions.get(userId) || []
      }
    });
  }

  // Private helper methods
  private async handleCollaborationMessage(userId: string, data: any): Promise<void> {
    switch (data.type) {
      case 'join_session':
        await this.joinCollaborativeSession(data.sessionId, userId, data.role);
        break;

      case 'leave_session':
        await this.leaveCollaborativeSession(data.sessionId, userId);
        break;

      case 'update_cursor':
        await this.updateCursor(data.sessionId, userId, data.cursor);
        break;

      case 'subscribe_channel':
        await this.subscribeToChannel(userId, data.channel, data.filters);
        break;

      case 'unsubscribe_channel':
        await this.unsubscribeFromChannel(userId, data.subscriptionId);
        break;

      case 'activity_ping':
        await this.updateUserActivity(userId);
        break;

      default:
        logger.warn('Unknown collaboration message type', { userId, type: data.type }, 'COLLABORATION');
    }
  }

  private async leaveCollaborativeSession(sessionId: string, userId: string): Promise<void> {
    const session = this.collaborativeSessions.get(sessionId);
    if (!session) return;

    // Remove participant
    session.participants = session.participants.filter(p => p.userId !== userId);

    // Remove permissions
    delete session.metadata.permissions[userId];

    // Notify other participants
    await this.notifySessionParticipants(session, {
      type: 'participant_left',
      data: { userId }
    });

    // End session if no participants left
    if (session.participants.length === 0) {
      session.status = 'ended';
      session.endedAt = new Date();
      this.collaborativeSessions.delete(sessionId);
    }

    logger.info('User left collaborative session', {
      sessionId,
      userId,
      remainingParticipants: session.participants.length
    }, 'COLLABORATION');
  }

  private async notifySessionParticipants(
    session: CollaborativeSession,
    message: any,
    excludeUsers: string[] = []
  ): Promise<void> {
    const notifications = session.participants
      .filter(p => !excludeUsers.includes(p.userId))
      .map(participant => this.sendToUser(participant.userId, {
        type: 'session_update',
        sessionId: session.id,
        ...message
      }));

    await Promise.all(notifications);
  }

  private async sendUpdateToUser(userId: string, update: LiveUpdate): Promise<void> {
    await this.sendToUser(userId, {
      type: 'live_update',
      data: update
    });
  }

  private async broadcastToChannel(channel: string, update: LiveUpdate): Promise<void> {
    // Find all users subscribed to this channel
    for (const [userId, subscriptions] of this.activeSubscriptions.entries()) {
      const relevantSubscriptions = subscriptions.filter(sub => 
        sub.channel === channel && sub.isActive
      );

      if (relevantSubscriptions.length > 0) {
        await this.sendUpdateToUser(userId, update);
      }
    }
  }

  private async sendToUser(userId: string, data: any): Promise<void> {
    const connection = this.wsConnections.get(userId);
    
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(data));
    }
  }

  private async broadcastActivity(event: ActivityEvent): Promise<void> {
    // Determine who should receive this activity
    const targetAudience = await this.determineActivityAudience(event);

    // Send to relevant users
    await Promise.all(
      targetAudience.map(userId => this.sendToUser(userId, {
        type: 'activity_event',
        data: event
      }))
    );
  }

  private async determineActivityAudience(event: ActivityEvent): Promise<string[]> {
    const audience: string[] = [];

    switch (event.visibility) {
      case 'public':
        // Send to followers or public feed subscribers
        audience.push(...await this.getPublicFeedSubscribers());
        break;

      case 'participants':
        // Send to users involved in the target resource
        audience.push(...await this.getResourceParticipants(event.targetType, event.targetId));
        break;

      case 'owner':
        // Send only to resource owner
        audience.push(...await this.getResourceOwners(event.targetType, event.targetId));
        break;

      case 'private':
        // Send only to actor
        audience.push(event.actorId);
        break;
    }

    return [...new Set(audience)]; // Remove duplicates
  }

  private async addToActivityFeeds(event: ActivityEvent): Promise<void> {
    // Add to relevant activity feeds based on event type and visibility
    // This would update feeds in the database
    logger.debug('Adding event to activity feeds', { eventId: event.id }, 'COLLABORATION');
  }

  private async handleUserDisconnect(userId: string): Promise<void> {
    // Update participant status in active sessions
    for (const [sessionId, session] of this.collaborativeSessions.entries()) {
      const participant = session.participants.find(p => p.userId === userId);
      if (participant) {
        participant.status = 'away';
        participant.lastSeenAt = new Date();
        
        await this.notifySessionParticipants(session, {
          type: 'participant_status_change',
          data: { userId, status: 'away' }
        }, [userId]);
      }
    }
  }

  private cleanupInactiveSessions(): void {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes

    for (const [sessionId, session] of this.collaborativeSessions.entries()) {
      const hasActiveParticipants = session.participants.some(
        p => p.lastSeenAt > cutoff && p.status === 'active'
      );

      if (!hasActiveParticipants) {
        session.status = 'ended';
        session.endedAt = new Date();
        this.collaborativeSessions.delete(sessionId);
        
        logger.info('Inactive session cleaned up', { sessionId }, 'COLLABORATION');
      }
    }
  }

  private async processActivityBatches(): Promise<void> {
    // Process batched activity events
    // This would handle bulk operations for performance
  }

  private async updateParticipantStatus(): Promise<void> {
    // Update participant status based on activity
    const idleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes

    for (const session of this.collaborativeSessions.values()) {
      for (const participant of session.participants) {
        if (participant.lastSeenAt < idleThreshold && participant.status === 'active') {
          participant.status = 'idle';
          
          await this.notifySessionParticipants(session, {
            type: 'participant_status_change',
            data: { userId: participant.userId, status: 'idle' }
          }, [participant.userId]);
        }
      }
    }
  }

  private async updateUserActivity(userId: string): Promise<void> {
    // Update user's last activity timestamp
    for (const session of this.collaborativeSessions.values()) {
      const participant = session.participants.find(p => p.userId === userId);
      if (participant) {
        participant.lastSeenAt = new Date();
        if (participant.status !== 'active') {
          participant.status = 'active';
          
          await this.notifySessionParticipants(session, {
            type: 'participant_status_change',
            data: { userId, status: 'active' }
          }, [userId]);
        }
      }
    }
  }

  // Helper methods for generating IDs
  private generateActivityId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUpdateId(): string {
    return `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFeedId(): string {
    return `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Database and external service methods (simplified)
  private async storeActivityEvent(event: ActivityEvent): Promise<void> {
    await CacheManager.set(
      CacheManager.keys.custom(`activity:${event.id}`),
      event,
      3600
    );
  }

  private async storeActivityFeed(feed: ActivityFeed): Promise<void> {
    await CacheManager.set(
      CacheManager.keys.custom(`feed:${feed.id}`),
      feed,
      1800 // 30 minutes
    );
  }

  private async getActivityFeedById(feedId: string): Promise<ActivityFeed | null> {
    return CacheManager.get<ActivityFeed>(CacheManager.keys.custom(`feed:${feedId}`));
  }

  private async getUserName(userId: string): Promise<string> {
    // Get user name from database
    return `User ${userId.substring(0, 8)}`;
  }

  private async loadActivityEvents(
    userId: string,
    feedType: ActivityFeed['type'],
    filters?: ActivityFeed['filters']
  ): Promise<ActivityEvent[]> {
    // Load activity events from database based on feed type and filters
    return [];
  }

  private async setupFeedSubscription(userId: string, feed: ActivityFeed): Promise<void> {
    // Set up real-time subscription for the feed
    logger.debug('Setting up feed subscription', { userId, feedId: feed.id }, 'COLLABORATION');
  }

  private async getPublicFeedSubscribers(): Promise<string[]> {
    // Get users subscribed to public activity feed
    return [];
  }

  private async getResourceParticipants(targetType: string, targetId: string): Promise<string[]> {
    // Get users who are participants in the resource (gear owners, renters, etc.)
    return [];
  }

  private async getResourceOwners(targetType: string, targetId: string): Promise<string[]> {
    // Get owners of the resource
    return [];
  }
}

export const collaborationEngine = new CollaborationEngine();

/**
 * Initialize collaboration system
 */
export async function initializeCollaboration(): Promise<void> {
  await collaborationEngine.initialize();
}

/**
 * Track user activity
 */
export async function trackUserActivity(
  userId: string,
  action: string,
  targetType: ActivityEvent['targetType'],
  targetId: string,
  details?: Record<string, any>
): Promise<void> {
  await collaborationEngine.trackActivity({
    type: action as ActivityEvent['type'],
    actorId: userId,
    actorName: await getUserDisplayName(userId),
    targetType,
    targetId,
    action,
    details: details || {},
    metadata: { source: 'web' },
    visibility: 'participants',
    isImportant: false
  });
}

async function getUserDisplayName(userId: string): Promise<string> {
  // Get user display name from database
  return `User ${userId.substring(0, 8)}`;
}