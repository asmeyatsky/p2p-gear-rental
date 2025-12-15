import type Pusher from 'pusher';
import type PusherClient from 'pusher-js';

// Skip during build time to prevent hanging on static page generation
const SKIP_DURING_BUILD = process.env.SKIP_DB_DURING_BUILD === 'true';

// Lazy-loaded Pusher instances
let _pusher: Pusher | null = null;
let _pusherClient: PusherClient | null = null;

// Server-side Pusher instance - getter function for lazy initialization
export function getPusher(): Pusher | null {
  if (SKIP_DURING_BUILD) return null;

  if (!_pusher && process.env.PUSHER_APP_ID) {
    // Dynamic import to avoid loading the library during build
    const PusherLib = require('pusher');
    _pusher = new PusherLib({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return _pusher;
}

// Client-side Pusher instance - getter function for lazy initialization
export function getPusherClient(): PusherClient | null {
  if (SKIP_DURING_BUILD) return null;
  if (typeof window === 'undefined') return null; // Only initialize on client

  if (!_pusherClient && process.env.NEXT_PUBLIC_PUSHER_KEY) {
    // Dynamic import to avoid loading the library during build
    const PusherClientLib = require('pusher-js');
    _pusherClient = new PusherClientLib(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return _pusherClient;
}

// Legacy exports for backwards compatibility (deprecated - use getPusher/getPusherClient)
export const pusher = null as Pusher | null; // Lazy - use getPusher()
export const pusherClient = null as PusherClient | null; // Lazy - use getPusherClient()

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