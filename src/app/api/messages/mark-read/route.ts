// /app/api/messages/mark-read/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

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

// Schema for mark messages as read request body
const MarkMessagesReadBodySchema = z.object({
  messageIds: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = MarkMessagesReadBodySchema.safeParse(body);
    
    if (!validationResult.success) {
      return Response.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        }, 
        { status: 400 }
      );
    }
    
    const { messageIds } = validationResult.data;
    
    // In a real implementation, we'd authenticate the user and update message read status in DB
    // Since we're not implementing a full messages table, we'll just return success
    // In a real app, this would update message read status in the database
    
    return Response.json({ success: true, updatedCount: messageIds.length });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return Response.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}