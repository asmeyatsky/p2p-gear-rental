// /app/api/conversations/route.ts
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

// Define Zod schemas for validation
const GetConversationsQuerySchema = z.object({
  userId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  try {
    // Extract and validate query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const validationResult = GetConversationsQuerySchema.safeParse({ userId });
    
    if (!validationResult.success) {
      return Response.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        }, 
        { status: 400 }
      );
    }
    
    // Fetch user's conversations from database
    // This is a simplified implementation - in a real system you'd have a conversations table
    // For now, we'll return an empty list or mock data
    interface RentalRow {
      id: string;
      renter_id: string;
      owner_id: string;
      gear_id: string;
      start_date: string;
      end_date: string;
      status: string;
      created_at: string;
    }

    const { data, error } = await getSupabase()
      .from('rentals') // Simplified: using rentals as proxy for conversations (each rental creates a conversation)
      .select(`
        id,
        renter_id,
        owner_id,
        gear_id,
        start_date,
        end_date,
        status,
        created_at
      `)
      .or(`renter_id.eq.${validationResult.data.userId},owner_id.eq.${validationResult.data.userId}`)
      .order('created_at', { ascending: false })
      .limit(50) as { data: RentalRow[] | null; error: unknown };

    if (error) {
      console.error('Error fetching conversations:', error);
      return Response.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    // Transform rental data to conversation format
    const conversations = (data || []).map(rental => ({
      id: `rental_conv_${rental.id}`, // Create conversation ID based on rental
      participants: [rental.renter_id, rental.owner_id],
      type: 'direct' as const,
      rentalId: rental.id,
      gearId: rental.gear_id,
      lastActivity: new Date(rental.created_at),
      isArchived: false,
      metadata: {
        isEncrypted: true,
        allowFileSharing: true,
        allowLocationSharing: true,
        priority: 'normal' as const,
      },
      createdAt: new Date(rental.created_at),
      // Simplified: no actual last message in this implementation
    }));

    return Response.json({ conversations });
  } catch (error) {
    console.error('Unexpected error in GET /api/conversations:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Schema for creating direct conversation
const CreateDirectConversationBodySchema = z.object({
  userId: z.string().uuid(),
  otherUserId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = CreateDirectConversationBodySchema.safeParse(body);
    
    if (!validationResult.success) {
      return Response.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        }, 
        { status: 400 }
      );
    }
    
    const { userId, otherUserId } = validationResult.data;
    
    // In a real implementation, you'd create a conversation record in a conversations table
    // For now, simulate creating a conversation between two users
    const conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique conversation ID
      participants: [userId, otherUserId],
      type: 'direct' as const,
      lastActivity: new Date(),
      isArchived: false,
      metadata: {
        isEncrypted: true,
        allowFileSharing: true,
        allowLocationSharing: true,
        priority: 'normal' as const,
      },
      createdAt: new Date(),
    };

    return Response.json(conversation);
  } catch (error) {
    console.error('Error in POST /api/conversations:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}