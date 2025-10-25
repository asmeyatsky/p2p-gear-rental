import { Rental } from '../entities/Rental';

export interface IPaymentService {
  createPaymentIntent(amount: number, currency: string, metadata?: Record<string, string>): Promise<{ id: string; clientSecret: string }>;
  confirmPayment(paymentIntentId: string): Promise<boolean>;
  refundPayment(paymentIntentId: string): Promise<boolean>;
}

export interface INotificationService {
  sendNotification(recipientId: string, message: string, subject?: string): Promise<boolean>;
  sendRentalConfirmation(rental: Rental, recipientId: string): Promise<boolean>;
  sendRentalStatusUpdate(rental: Rental, recipientId: string): Promise<boolean>;
}