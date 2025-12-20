// /app/api/conversations/[id]/messages/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Define ChatMessage type
interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'location' | 'payment_request';
  metadata?: Record<string, unknown>;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  isEdited: boolean;
  createdAt: Date;
}

// Lazy initialization to prevent build-time errors
let _supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

// Schema for query parameters
const GetMessageQuerySchema = z.object({
  conversationId: z.string(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50).refine(val => !isNaN(val) && val > 0 && val <= 100, {
    message: 'Limit must be between 1 and 100'
  }),
  before: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const conversationId = id;
    
    // Extract and validate query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const before = searchParams.get('before');
    
    const validationResult = GetMessageQuerySchema.safeParse({ limit, before });
    
    if (!validationResult.success) {
      return Response.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        }, 
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    
    // In a real implementation, we'd fetch messages from a messages table
    // For now, we'll return empty array since we don't have a messages table
    // This is a simplified implementation that returns mock data
    const messages: ChatMessage[] = []; // In reality, you'd fetch from DB
    
    // Return messages with pagination info
    return Response.json({
      messages,
      hasMore: false,
      nextCursor: null
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return Response.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// Schema for sending a message
const SendMessageBodySchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(10000), // At least 1 char, max 10000 chars
  type: z.enum(['text', 'image', 'file', 'system', 'location', 'payment_request']).default('text'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const conversationId = id;
    const body = await request.json();
    
    const validationResult = SendMessageBodySchema.safeParse(body);
    
    if (!validationResult.success) {
      return Response.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        }, 
        { status: 400 }
      );
    }
    
    const { receiverId, content, type, metadata } = validationResult.data;
    
    // Get the current user from auth headers
    // This depends on your specific auth implementation
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // In a real implementation, you'd decode the JWT token to get the user ID
    // For this example, I'll skip authentication details and assume it's done
    
    // Create message in database (this is simplified)
    // In a real implementation you'd store in a messages table
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId: 'current_user_id_placeholder', // Would come from decoded token
      receiverId,
      content,
      type,
      metadata: metadata || {},
      status: 'sent',
      isEdited: false,
      createdAt: new Date(),
    };

    // In a real system, you'd save to database and broadcast via WebSocket
    // For this implementation, just return the message object
    return Response.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    return Response.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}