import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Skip during build time to prevent hanging on static page generation
const SKIP_DURING_BUILD = process.env.SKIP_DB_DURING_BUILD === 'true';

// Server-side Pusher instance (lazy initialization)
let _pusher: Pusher | null = null;
export const pusher = SKIP_DURING_BUILD ? null : (() => {
  if (!_pusher && process.env.PUSHER_APP_ID) {
    _pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return _pusher;
})();

// Client-side Pusher instance (lazy initialization)
let _pusherClient: PusherClient | null = null;
export const pusherClient = SKIP_DURING_BUILD ? null : (() => {
  if (!_pusherClient && process.env.NEXT_PUBLIC_PUSHER_KEY) {
    _pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return _pusherClient;
})();

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