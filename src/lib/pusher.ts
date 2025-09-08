import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher instance
export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

// Channel naming conventions
export const channels = {
  rental: (rentalId: string) => `rental-${rentalId}`,
  user: (userId: string) => `user-${userId}`,
  conversation: (conversationId: string) => `conversation-${conversationId}`,
};

// Event types
export const events = {
  MESSAGE_SENT: 'message-sent',
  MESSAGE_READ: 'message-read',
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',
  RENTAL_STATUS_UPDATED: 'rental-status-updated',
  NEW_RENTAL_REQUEST: 'new-rental-request',
  USER_ONLINE: 'user-online',
  USER_OFFLINE: 'user-offline',
} as const;