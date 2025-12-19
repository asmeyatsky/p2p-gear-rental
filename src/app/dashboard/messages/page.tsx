'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { realTimeChatClient } from '@/lib/realtime/chat-client';
import { Button } from '@/components/ui/Button';
import Header from '@/components/Header';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'location' | 'payment_request' | 'typing';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  isEdited: boolean;
  createdAt: Date;
  deletedAt?: Date;
}

interface Conversation {
  id: string;
  participants: string[];
  type: 'direct' | 'group' | 'support';
  title?: string;
  rentalId?: string;
  gearId?: string;
  lastMessage?: Message;
  lastActivity: Date;
  isArchived: boolean;
  metadata: {
    isEncrypted: boolean;
    allowFileSharing: boolean;
    allowLocationSharing: boolean;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  };
  createdAt: Date;
}

export default function DashboardMessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        
        // Load conversations for the current user
        const userConversations = await realTimeChatClient.getUserConversations(user?.id || '');
        setConversations(userConversations);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadConversations();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="mt-2 text-gray-600">Chat with renters and listers</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {conversations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg 
                  className="w-8 h-8 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-600 mb-6">When you send or receive messages, they'll appear here</p>
              <Button>
                Browse Gear
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conversations.map(conversation => {
                const otherParticipant = conversation.participants.find(id => id !== user?.id);
                const lastMessage = conversation.lastMessage;
                
                return (
                  <div 
                    key={conversation.id} 
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      // Navigate to the specific conversation
                      window.location.href = `/messages?conversationId=${conversation.id}`;
                    }}
                  >
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white font-bold">
                          {otherParticipant?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {conversation.title || 'User'}
                          </h3>
                          {lastMessage && (
                            <p className="text-sm text-gray-500 ml-4">
                              {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                        
                        {lastMessage && (
                          <p className="text-gray-600 truncate mt-1">
                            {lastMessage.content}
                          </p>
                        )}
                        
                        <div className="flex items-center mt-2">
                          {conversation.type === 'direct' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Direct
                            </span>
                          )}
                          {conversation.type === 'group' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Group
                            </span>
                          )}
                          
                          {conversation.gearId && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Gear Inquiry
                            </span>
                          )}
                          
                          {conversation.rentalId && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Rental Discussion
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}