import { INotificationService } from '../../domain/ports/external-services';
import { NotificationEngine } from '../../lib/realtime/notification-engine';

export class NotificationServiceAdapter implements INotificationService {
  private notificationEngine: NotificationEngine;

  constructor() {
    this.notificationEngine = new NotificationEngine();
  }

  async sendNotification(recipientId: string, message: string, subject?: string): Promise<boolean> {
    try {
      // Send notification using the existing notification engine
      await this.notificationEngine.sendNotification({
        userId: recipientId,
        title: subject || 'Notification',
        message,
        type: 'general',
        channels: ['in_app', 'email'], // Default channels
        priority: 'normal',
      });
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  async sendRentalNotification(
    recipientId: string, 
    rentalId: string, 
    message: string, 
    subject?: string
  ): Promise<boolean> {
    try {
      await this.notificationEngine.sendNotification({
        userId: recipientId,
        title: subject || 'Rental Notification',
        message,
        type: 'rental',
        channels: ['in_app', 'email'],
        priority: 'normal',
        data: { rentalId },
        actionUrl: `/rentals/${rentalId}`,
      });
      return true;
    } catch (error) {
      console.error('Failed to send rental notification:', error);
      return false;
    }
  }

  async sendPaymentNotification(
    recipientId: string, 
    paymentId: string, 
    message: string, 
    subject?: string
  ): Promise<boolean> {
    try {
      await this.notificationEngine.sendNotification({
        userId: recipientId,
        title: subject || 'Payment Notification',
        message,
        type: 'payment',
        channels: ['in_app', 'email'],
        priority: 'normal',
        data: { paymentId },
        actionUrl: `/payments/${paymentId}`, // This URL may need to be adjusted
      });
      return true;
    } catch (error) {
      console.error('Failed to send payment notification:', error);
      return false;
    }
  }
}