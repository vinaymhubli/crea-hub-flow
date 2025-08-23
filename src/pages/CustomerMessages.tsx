import { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Bell,
  LogOut,
  Send,
  Search,
  Star,
  Phone,
  Video,
  Info,
  MoreVertical
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CustomerSidebar } from "@/components/CustomerSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  sender_id: string;
  booking_id: string;
  content: string;
  message_type: string;
  file_url: string | null;
  created_at: string;
}

interface Conversation {
  booking_id: string;
  designer_id: string;
  designer_name: string;
  designer_rating: number;
  designer_initials: string;
  designer_online: boolean;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function CustomerMessages() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.booking_id);
      setupRealtimeSubscription(selectedConversation.booking_id);
    }
    return () => {
      // Cleanup subscription
      supabase.removeAllChannels();
    };
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // Get bookings with messages
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          designer_id,
          designer:designers!inner(
            rating,
            is_online,
            profile:profiles!designers_user_id_fkey(
              first_name,
              last_name
            )
          ),
          messages!inner(
            content,
            created_at,
            sender_id
          )
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      // Process bookings to create conversations
      const conversationMap = new Map<string, Conversation>();
      
      bookings?.forEach(booking => {
        const bookingId = booking.id;
        const designer = booking.designer;
        const designerName = designer?.profile 
          ? `${designer.profile.first_name} ${designer.profile.last_name}`
          : 'Unknown Designer';
        
        if (!conversationMap.has(bookingId)) {
          // Find the latest message for this booking
          const latestMessage = booking.messages?.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          
          // Count unread messages (messages from designer that are newer than user's last read)
          const unreadCount = booking.messages?.filter(msg => 
            msg.sender_id !== user?.id
          ).length || 0;

          conversationMap.set(bookingId, {
            booking_id: bookingId,
            designer_id: booking.designer_id,
            designer_name: designerName,
            designer_rating: designer?.rating || 0,
            designer_initials: designer?.profile 
              ? `${designer.profile.first_name?.[0] || ''}${designer.profile.last_name?.[0] || ''}`
              : 'UD',
            designer_online: designer?.is_online || false,
            last_message: latestMessage?.content || 'No messages yet',
            last_message_time: latestMessage?.created_at 
              ? new Date(latestMessage.created_at).toLocaleDateString()
              : '',
            unread_count: Math.min(unreadCount, 9) // Cap at 9 for display
          });
        }
      });

      const conversationsList = Array.from(conversationMap.values());
      setConversations(conversationsList);
      
      if (conversationsList.length > 0 && !selectedConversation) {
        setSelectedConversation(conversationsList[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          booking_id: selectedConversation.booking_id,
          sender_id: user?.id,
          content: messageInput.trim(),
          message_type: 'text'
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setMessageInput('');
      // Refresh messages
      fetchMessages(selectedConversation.booking_id);
      // Refresh conversations to update last message
      fetchConversations();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const setupRealtimeSubscription = (bookingId: string) => {
    const channel = supabase
      .channel('customer-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          // Update conversation list
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredConversations = conversations.filter(conv =>
    conv.designer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-teal-50/30 to-blue-50/20">
          <CustomerSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading messages...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-teal-50/30 to-blue-50/20">
        <CustomerSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-gradient-to-br from-green-400 via-teal-500 to-blue-500 text-white px-6 py-8 flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white" />
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
                  <p className="text-green-100">Chat with your designers and collaborate in real-time</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-green-100" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <span className="text-white font-semibold text-sm">U</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">U</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">User</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <Link 
                          to="/customer-dashboard" 
                          className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          Dashboard
                        </Link>
                        <button className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors">
                          <LogOut className="w-4 h-4 mr-3" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </header>

          <div className="flex-1 flex">
            {/* Conversations List */}
            <div className="w-80 bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border-r border-teal-200/30 flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-teal-200/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500 w-4 h-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-teal-200/50 focus:border-teal-400 focus:ring-teal-400/20"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations</h3>
                    <p className="text-gray-600 mb-6">Start a project to begin messaging with designers</p>
                    <Link to="/designers">
                      <Button>Find Designers</Button>
                    </Link>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.booking_id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 border-b border-teal-200/20 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-50 ${
                        selectedConversation?.booking_id === conversation.booking_id
                          ? 'bg-gradient-to-r from-teal-100 to-blue-100 border-teal-300'
                          : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold text-sm">{conversation.designer_initials}</span>
                          </div>
                          {conversation.designer_online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-foreground truncate">{conversation.designer_name}</p>
                            <div className="flex items-center space-x-1">
                              {conversation.unread_count > 0 && (
                                <Badge className="bg-gradient-to-r from-green-400 to-teal-500 text-white text-xs px-2 py-1 shadow-lg">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 mb-2">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-muted-foreground">{conversation.designer_rating}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{conversation.last_message}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">{conversation.last_message_time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gradient-to-br from-background to-teal-50/10">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border-b border-teal-200/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold text-sm">{selectedConversation.designer_initials}</span>
                          </div>
                          {selectedConversation.designer_online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{selectedConversation.designer_name}</p>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-sm text-muted-foreground">{selectedConversation.designer_rating}</span>
                            {selectedConversation.designer_online && (
                              <span className="text-sm text-green-600">• Online</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="hover:bg-teal-100">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-teal-100">
                          <Video className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-teal-100">
                          <Info className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-teal-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
                              message.sender_id === user?.id
                                ? 'bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 text-white'
                                : 'bg-white border border-teal-200/50 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-2 ${
                              message.sender_id === user?.id 
                                ? 'text-white/70' 
                                : 'text-gray-500'
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="bg-white border-t border-teal-200/30 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Type your message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="pr-24"
                        />
                      </div>
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversation selected</h3>
                    <p className="text-gray-600">Choose a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}