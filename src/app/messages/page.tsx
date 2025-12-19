'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { realTimeChatClient } from '@/lib/realtime/chat-client';
import { sendChatMessage } from '@/lib/realtime/chat-client';
import { Button } from '@/components/ui/Button';
import Header from '@/components/Header';
import { event } from '@/lib/gtag';

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

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const gearId = searchParams.get('gearId');
  
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        
        // Load conversations for the current user
        const userConversations = await realTimeChatClient.getUserConversations(user?.id || '');
        setConversations(userConversations);
        
        // If coming from gear page, select/create conversation with the owner
        if (user && userId && gearId) {
          const existingConv = userConversations.find(conv => 
            conv.participants.includes(userId) && conv.gearId === gearId
          );
          
          if (existingConv) {
            setSelectedConversation(existingConv);
            await loadMessages(existingConv.id);
          } else {
            // Create new conversation
            const newConv = await realTimeChatClient.createOrGetDirectConversation(user.id, userId);
            setConversations(prev => [newConv, ...prev]);
            setSelectedConversation(newConv);
            
            // Optionally add gear reference to conversation
            // We'll have this conversation for messaging about this specific gear
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadConversations();
    }
  }, [user, userId, gearId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const result = await realTimeChatClient.getMessages(conversationId, user?.id || '');
      setMessages(result.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      const receiverId = selectedConversation.participants.find(id => id !== user.id);
      if (!receiverId) return;

      const message = await sendChatMessage(
        user.id,
        receiverId,
        newMessage,
        'text'
      );

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Track the event
      event({
        action: 'send_message',
        category: 'messaging',
        label: 'message_sent',
        value: 1,
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Header />
      
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col">
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Chat with renters and listers</p>
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Conversations sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <svg 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {conversations.map(conversation => {
                  const otherParticipant = conversation.participants.find(id => id !== user?.id);
                  return (
                    <div
                      key={conversation.id}
                      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                        selectedConversation?.id === conversation.id ? 'bg-purple-50' : ''
                      }`}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        loadMessages(conversation.id);
                      }}
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-bold">
                            {otherParticipant?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.title || 'User'}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                        {conversation.lastMessage && (
                          <div className="text-xs text-gray-500">
                            {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Messages area */}
            <div className="w-2/3 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat header */}
                  <div className="border-b border-gray-200 p-4 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">
                        {selectedConversation.participants.find(id => id !== user?.id)?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {selectedConversation.title || 'Conversation'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {!selectedConversation.participants.includes(user?.id || '') ? 'Online' : 'Active'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="space-y-4">
                      {messages.map(message => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderId === user?.id
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className={`text-xs mt-1 ${message.senderId === user?.id ? 'text-purple-200' : 'text-gray-500'}`}>
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  
                  {/* Message input */}
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex items-center">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                        rows={1}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="rounded-l-none rounded-r-lg h-10 px-4"
                      >
                        <svg 
                          className="w-5 h-5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg 
                        className="w-8 h-8 text-gray-500" 
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
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No conversation selected</h3>
                    <p className="text-gray-600">Select a conversation from the list or start a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}