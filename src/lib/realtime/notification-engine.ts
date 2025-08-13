/**
 * Real-time Notification Engine
 * Handles push notifications, email alerts, and in-app notifications
 */

import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import { prisma } from '@/lib/prisma';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms' | 'in_app';
  subject?: string;
  content: string;
  htmlContent?: string;
  variables: string[];
  category: 'rental' | 'payment' | 'messaging' | 'system' | 'marketing';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isActive: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'rental_request' | 'rental_approved' | 'rental_rejected' | 'payment_received' | 
        'payment_failed' | 'message_received' | 'review_received' | 'gear_returned' |
        'system_maintenance' | 'price_alert' | 'availability_alert' | 'security_alert';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  data?: Record<string, any>;
  channels: ('email' | 'push' | 'sms' | 'in_app')[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  scheduledFor?: Date;
  expiresAt?: Date;
  createdAt: Date;
  sentAt?: Date;
  readAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  frequency: {
    email: 'immediate' | 'daily' | 'weekly' | 'never';
    push: 'immediate' | 'batched' | 'never';
    sms: 'urgent_only' | 'never';
  };
  categories: {
    rental: boolean;
    payment: boolean;
    messaging: boolean;
    system: boolean;
    marketing: boolean;
  };
}

export interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceType: 'mobile' | 'desktop';
  browser: string;
  isActive: boolean;
  createdAt: Date;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
  variables: Record<string, string>;
}

class NotificationEngine {
  private readonly BATCH_SIZE = 100;
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds

  /**
   * Send notification to user
   */
  async sendNotification(notification: Omit<Notification, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const notificationWithId: Notification = {
      ...notification,
      id: this.generateNotificationId(),
      status: 'pending',
      createdAt: new Date()
    };

    // Check user preferences
    const preferences = await this.getUserPreferences(notification.userId);
    const filteredChannels = this.filterChannelsByPreferences(notification.channels, preferences, notification);

    if (filteredChannels.length === 0) {
      logger.info('Notification skipped due to user preferences', {
        notificationId: notificationWithId.id,
        userId: notification.userId,
        type: notification.type
      }, 'NOTIFICATIONS');
      return notificationWithId.id;
    }

    notificationWithId.channels = filteredChannels;

    // Store notification
    await this.storeNotification(notificationWithId);

    // Schedule or send immediately
    if (notification.scheduledFor && notification.scheduledFor > new Date()) {
      await this.scheduleNotification(notificationWithId);
    } else {
      await this.processNotification(notificationWithId);
    }

    logger.info('Notification queued', {
      notificationId: notificationWithId.id,
      userId: notification.userId,
      type: notification.type,
      channels: filteredChannels
    }, 'NOTIFICATIONS');

    return notificationWithId.id;
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    userIds: string[],
    notification: Omit<Notification, 'id' | 'userId' | 'status' | 'createdAt'>
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    // Process in batches
    for (let i = 0; i < userIds.length; i += this.BATCH_SIZE) {
      const batch = userIds.slice(i, i + this.BATCH_SIZE);
      
      const batchPromises = batch.map(async (userId) => {
        try {
          const notificationId = await this.sendNotification({
            ...notification,
            userId
          });
          return notificationId;
        } catch (error) {
          logger.error('Failed to send notification to user', {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, 'NOTIFICATIONS');
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      notificationIds.push(...batchResults.filter(id => id !== null) as string[]);

      // Small delay between batches to avoid overwhelming services
      if (i + this.BATCH_SIZE < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    logger.info('Bulk notifications sent', {
      totalUsers: userIds.length,
      successfulNotifications: notificationIds.length,
      type: notification.type
    }, 'NOTIFICATIONS');

    return notificationIds;
  }

  /**
   * Send push notification
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
    actionUrl?: string
  ): Promise<boolean> {
    const subscriptions = await this.getUserPushSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      logger.info('No push subscriptions found for user', { userId }, 'NOTIFICATIONS');
      return false;
    }

    const payload = {
      title,
      body,
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        ...data,
        url: actionUrl
      },
      actions: actionUrl ? [{
        action: 'open',
        title: 'View',
        icon: '/icons/view-icon.png'
      }] : []
    };

    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await this.sendWebPush(subscription, payload);
          return true;
        } catch (error) {
          logger.error('Failed to send push notification', {
            userId,
            subscriptionEndpoint: subscription.endpoint.substring(0, 50) + '...',
            error: error instanceof Error ? error.message : 'Unknown error'
          }, 'NOTIFICATIONS');
          
          // Remove invalid subscription
          await this.removeInvalidPushSubscription(subscription.endpoint);
          return false;
        }
      })
    );

    const successCount = results.filter(Boolean).length;
    
    logger.info('Push notifications sent', {
      userId,
      totalSubscriptions: subscriptions.length,
      successfulSends: successCount
    }, 'NOTIFICATIONS');

    return successCount > 0;
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(
    userId: string,
    templateName: string,
    variables: Record<string, string>,
    subject?: string
  ): Promise<boolean> {
    const user = await this.getUserEmail(userId);
    if (!user?.email) {
      logger.warn('No email found for user', { userId }, 'NOTIFICATIONS');
      return false;
    }

    const template = await this.getEmailTemplate(templateName, variables);
    if (!template) {
      logger.error('Email template not found', { templateName }, 'NOTIFICATIONS');
      return false;
    }

    try {
      await this.sendEmail({
        to: user.email,
        subject: subject || template.subject,
        html: template.html,
        text: template.text
      });

      logger.info('Email sent successfully', {
        userId,
        email: user.email,
        templateName
      }, 'NOTIFICATIONS');

      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        userId,
        email: user.email,
        templateName,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'NOTIFICATIONS');

      return false;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.getNotification(notificationId);
    
    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found or access denied');
    }

    notification.status = 'read';
    notification.readAt = new Date();

    await this.updateNotification(notification);

    // Clear from cache
    await CacheManager.del(CacheManager.keys.custom(`notification:${notificationId}`));
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      type?: Notification['type'];
      since?: Date;
    } = {}
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const cacheKey = CacheManager.keys.custom(`user_notifications:${userId}:${JSON.stringify(options)}`);
    const cached = await CacheManager.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const notifications = await this.fetchUserNotificationsFromDB(userId, options);
    const total = await this.countUserNotifications(userId, options);
    const unreadCount = await this.countUnreadNotifications(userId);

    const result = {
      notifications,
      total,
      unreadCount
    };

    await CacheManager.set(cacheKey, result, 300); // 5 minutes

    return result;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(
    userId: string,
    subscription: Omit<PushSubscription, 'userId' | 'isActive' | 'createdAt'>
  ): Promise<void> {
    const pushSubscription: PushSubscription = {
      ...subscription,
      userId,
      isActive: true,
      createdAt: new Date()
    };

    await this.storePushSubscription(pushSubscription);

    logger.info('User subscribed to push notifications', {
      userId,
      deviceType: subscription.deviceType,
      browser: subscription.browser
    }, 'NOTIFICATIONS');
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const currentPreferences = await this.getUserPreferences(userId);
    const updatedPreferences = { ...currentPreferences, ...preferences };

    await this.storeUserPreferences(updatedPreferences);

    // Clear cache
    await CacheManager.del(CacheManager.keys.custom(`notification_preferences:${userId}`));

    logger.info('Notification preferences updated', {
      userId,
      updatedFields: Object.keys(preferences)
    }, 'NOTIFICATIONS');
  }

  /**
   * Create notification template
   */
  async createNotificationTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<string> {
    const templateWithId: NotificationTemplate = {
      ...template,
      id: this.generateTemplateId()
    };

    await this.storeNotificationTemplate(templateWithId);

    logger.info('Notification template created', {
      templateId: templateWithId.id,
      name: template.name,
      type: template.type
    }, 'NOTIFICATIONS');

    return templateWithId.id;
  }

  /**
   * Send real-time in-app notification
   */
  async sendInAppNotification(
    userId: string,
    notification: {
      title: string;
      message: string;
      type: string;
      actionUrl?: string;
      data?: Record<string, any>;
    }
  ): Promise<void> {
    // Send via WebSocket if user is online
    await this.sendRealTimeNotification(userId, {
      type: 'notification',
      data: notification
    });
  }

  // Private helper methods
  private async processNotification(notification: Notification): Promise<void> {
    const promises: Promise<boolean>[] = [];

    for (const channel of notification.channels) {
      switch (channel) {
        case 'email':
          promises.push(this.sendEmailNotification(
            notification.userId,
            this.getEmailTemplateForType(notification.type),
            this.buildEmailVariables(notification)
          ));
          break;

        case 'push':
          promises.push(this.sendPushNotification(
            notification.userId,
            notification.title,
            notification.message,
            notification.data,
            notification.actionUrl
          ));
          break;

        case 'in_app':
          promises.push(this.sendInAppNotification(
            notification.userId,
            {
              title: notification.title,
              message: notification.message,
              type: notification.type,
              actionUrl: notification.actionUrl,
              data: notification.data
            }
          ).then(() => true));
          break;

        case 'sms':
          promises.push(this.sendSMSNotification(
            notification.userId,
            notification.message
          ));
          break;
      }
    }

    const results = await Promise.all(promises);
    const successCount = results.filter(Boolean).length;

    // Update notification status
    notification.status = successCount > 0 ? 'sent' : 'failed';
    notification.sentAt = new Date();

    await this.updateNotification(notification);

    logger.info('Notification processed', {
      notificationId: notification.id,
      channels: notification.channels.length,
      successfulChannels: successCount
    }, 'NOTIFICATIONS');
  }

  private filterChannelsByPreferences(
    channels: Notification['channels'],
    preferences: NotificationPreferences,
    notification: Notification
  ): Notification['channels'] {
    const filtered: Notification['channels'] = [];

    // Check if we're in quiet hours
    const isQuietHours = this.isInQuietHours(preferences);
    const urgentNotification = notification.priority === 'urgent';

    for (const channel of channels) {
      switch (channel) {
        case 'email':
          if (preferences.emailEnabled && preferences.categories[this.getNotificationCategory(notification.type)]) {
            // Check frequency preferences
            if (preferences.frequency.email === 'immediate' || urgentNotification) {
              filtered.push(channel);
            }
          }
          break;

        case 'push':
          if (preferences.pushEnabled && (!isQuietHours || urgentNotification)) {
            if (preferences.frequency.push === 'immediate' || urgentNotification) {
              filtered.push(channel);
            }
          }
          break;

        case 'sms':
          if (preferences.frequency.sms === 'urgent_only' && urgentNotification) {
            filtered.push(channel);
          }
          break;

        case 'in_app':
          if (preferences.inAppEnabled) {
            filtered.push(channel);
          }
          break;
      }
    }

    return filtered;
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const userTime = new Intl.DateTimeFormat('en-US', {
      timeZone: preferences.quietHours.timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);

    const [currentHour, currentMinute] = userTime.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = preferences.quietHours.start.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = preferences.quietHours.end.split(':').map(Number);
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes <= endMinutes) {
      // Same day quiet hours (e.g., 22:00 to 08:00)
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  private getNotificationCategory(type: Notification['type']): keyof NotificationPreferences['categories'] {
    const categoryMap: Record<Notification['type'], keyof NotificationPreferences['categories']> = {
      'rental_request': 'rental',
      'rental_approved': 'rental',
      'rental_rejected': 'rental',
      'gear_returned': 'rental',
      'payment_received': 'payment',
      'payment_failed': 'payment',
      'message_received': 'messaging',
      'review_received': 'rental',
      'system_maintenance': 'system',
      'price_alert': 'marketing',
      'availability_alert': 'marketing',
      'security_alert': 'system'
    };

    return categoryMap[type] || 'system';
  }

  private async scheduleNotification(notification: Notification): Promise<void> {
    // Schedule notification for future delivery
    // This would integrate with a job queue system like Bull or Agenda
    logger.info('Notification scheduled', {
      notificationId: notification.id,
      scheduledFor: notification.scheduledFor
    }, 'NOTIFICATIONS');
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTemplateId(): string {
    return `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getEmailTemplateForType(type: Notification['type']): string {
    const templateMap: Record<Notification['type'], string> = {
      'rental_request': 'rental_request_email',
      'rental_approved': 'rental_approved_email',
      'rental_rejected': 'rental_rejected_email',
      'payment_received': 'payment_confirmation_email',
      'payment_failed': 'payment_failed_email',
      'message_received': 'new_message_email',
      'review_received': 'new_review_email',
      'gear_returned': 'gear_returned_email',
      'system_maintenance': 'system_maintenance_email',
      'price_alert': 'price_alert_email',
      'availability_alert': 'availability_alert_email',
      'security_alert': 'security_alert_email'
    };

    return templateMap[type] || 'generic_notification_email';
  }

  private buildEmailVariables(notification: Notification): Record<string, string> {
    return {
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl || '',
      actionText: notification.actionText || 'View Details',
      ...notification.data
    };
  }

  // Database and external service methods (simplified)
  private async storeNotification(notification: Notification): Promise<void> {
    // Store in database
    await CacheManager.set(
      CacheManager.keys.custom(`notification:${notification.id}`),
      notification,
      3600
    );
  }

  private async getNotification(notificationId: string): Promise<Notification | null> {
    return CacheManager.get<Notification>(CacheManager.keys.custom(`notification:${notificationId}`));
  }

  private async updateNotification(notification: Notification): Promise<void> {
    await CacheManager.set(
      CacheManager.keys.custom(`notification:${notification.id}`),
      notification,
      3600
    );
  }

  private async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const cacheKey = CacheManager.keys.custom(`notification_preferences:${userId}`);
    const cached = await CacheManager.get<NotificationPreferences>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Default preferences
    const defaultPreferences: NotificationPreferences = {
      userId,
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      frequency: {
        email: 'immediate',
        push: 'immediate',
        sms: 'urgent_only'
      },
      categories: {
        rental: true,
        payment: true,
        messaging: true,
        system: true,
        marketing: false
      }
    };

    await CacheManager.set(cacheKey, defaultPreferences, 3600);
    return defaultPreferences;
  }

  private async storeUserPreferences(preferences: NotificationPreferences): Promise<void> {
    await CacheManager.set(
      CacheManager.keys.custom(`notification_preferences:${preferences.userId}`),
      preferences,
      3600
    );
  }

  private async getUserPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    // Get user's push subscriptions from database
    return [];
  }

  private async storePushSubscription(subscription: PushSubscription): Promise<void> {
    // Store push subscription in database
    logger.debug('Storing push subscription', { userId: subscription.userId }, 'NOTIFICATIONS');
  }

  private async removeInvalidPushSubscription(endpoint: string): Promise<void> {
    // Remove invalid push subscription from database
    logger.debug('Removing invalid push subscription', { endpoint: endpoint.substring(0, 50) }, 'NOTIFICATIONS');
  }

  private async getUserEmail(userId: string): Promise<{ email: string } | null> {
    // Get user email from database
    return { email: 'user@example.com' };
  }

  private async getEmailTemplate(templateName: string, variables: Record<string, string>): Promise<EmailTemplate | null> {
    // Get and process email template
    return {
      subject: 'Notification',
      html: '<h1>{{title}}</h1><p>{{message}}</p>',
      text: '{{title}}\n\n{{message}}',
      variables
    };
  }

  private async sendEmail(emailData: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    // Send email via service (SendGrid, AWS SES, etc.)
    logger.debug('Sending email', { to: emailData.to, subject: emailData.subject }, 'NOTIFICATIONS');
  }

  private async sendWebPush(subscription: PushSubscription, payload: any): Promise<void> {
    // Send web push notification
    logger.debug('Sending web push', { endpoint: subscription.endpoint.substring(0, 50) }, 'NOTIFICATIONS');
  }

  private async sendSMSNotification(userId: string, message: string): Promise<boolean> {
    // Send SMS notification
    logger.debug('Sending SMS', { userId }, 'NOTIFICATIONS');
    return true;
  }

  private async sendRealTimeNotification(userId: string, data: any): Promise<void> {
    // Send via WebSocket connection
    logger.debug('Sending real-time notification', { userId }, 'NOTIFICATIONS');
  }

  private async fetchUserNotificationsFromDB(
    userId: string,
    options: any
  ): Promise<Notification[]> {
    // Fetch notifications from database
    return [];
  }

  private async countUserNotifications(userId: string, options: any): Promise<number> {
    // Count user notifications
    return 0;
  }

  private async countUnreadNotifications(userId: string): Promise<number> {
    // Count unread notifications
    return 0;
  }

  private async storeNotificationTemplate(template: NotificationTemplate): Promise<void> {
    // Store notification template
    logger.debug('Storing notification template', { templateId: template.id }, 'NOTIFICATIONS');
  }
}

export const notificationEngine = new NotificationEngine();

/**
 * Quick notification helpers
 */

export async function notifyRentalRequest(ownerId: string, rentalId: string, renterName: string): Promise<void> {
  await notificationEngine.sendNotification({
    userId: ownerId,
    type: 'rental_request',
    title: 'New Rental Request',
    message: `${renterName} wants to rent your equipment`,
    actionUrl: `/rentals/${rentalId}`,
    actionText: 'Review Request',
    channels: ['email', 'push', 'in_app'],
    priority: 'normal'
  });
}

export async function notifyPaymentReceived(userId: string, amount: number, rentalId: string): Promise<void> {
  await notificationEngine.sendNotification({
    userId,
    type: 'payment_received',
    title: 'Payment Received',
    message: `You received $${amount} for your rental`,
    actionUrl: `/rentals/${rentalId}`,
    actionText: 'View Details',
    channels: ['email', 'push', 'in_app'],
    priority: 'normal',
    data: { amount: amount.toString(), rentalId }
  });
}

export async function notifySecurityAlert(userId: string, alertType: string, details: string): Promise<void> {
  await notificationEngine.sendNotification({
    userId,
    type: 'security_alert',
    title: 'Security Alert',
    message: `${alertType}: ${details}`,
    actionUrl: '/account/security',
    actionText: 'Review Security',
    channels: ['email', 'push', 'sms', 'in_app'],
    priority: 'urgent'
  });
}