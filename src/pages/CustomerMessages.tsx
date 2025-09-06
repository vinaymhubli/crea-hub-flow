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
import { toast } from "sonner";

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
    let cleanup: (() => void) | undefined;
    
    if (selectedConversation) {
      fetchMessages(selectedConversation.booking_id);
      cleanup = setupRealtimeSubscription(selectedConversation.booking_id);
    }
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // First, get all bookings for this customer
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, designer_id')
        .eq('customer_id', user?.id)
        .order('updated_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return;
      }

      if (!bookings || bookings.length === 0) {
        setConversations([]);
        return;
      }

      // Get designer info for all unique designer IDs
      const designerIds = [...new Set(bookings.map(b => b.designer_id))];
      
      // Guard against empty array for .in() query
      if (designerIds.length === 0) {
        setConversations([]);
        return;
      }
      
      const { data: designers, error: designersError } = await supabase
        .from('designers')
        .select('id, user_id, rating, is_online')
        .in('id', designerIds);

      if (designersError) {
        console.error('Error fetching designers:', designersError);
      }

      // Get designer profiles
      const designerUserIds = designers?.map(d => d.user_id) || [];
      
      // Guard against empty array for .in() query
      let designerProfiles: any[] = [];
      if (designerUserIds.length > 0) {
        const { data, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', designerUserIds);
          
        if (profilesError) {
          console.error('Error fetching designer profiles:', profilesError);
        } else {
          designerProfiles = data || [];
        }
      }


      // Build conversations with designer info and message data
      const conversationPromises = bookings.map(async (booking) => {
        // Find designer and profile
        const designer = designers?.find(d => d.id === booking.designer_id);
        const designerProfile = designerProfiles?.find(p => p.user_id === designer?.user_id);
        
        const designerName = designerProfile 
          ? `${designerProfile.first_name || ''} ${designerProfile.last_name || ''}`.trim() || 'Designer'
          : 'Designer';
        const designerInitials = designerProfile 
          ? `${designerProfile.first_name?.[0] || ''}${designerProfile.last_name?.[0] || ''}` || 'D'
          : 'D';

        // Get latest message
        const { data: latestMessage } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('booking_id', booking.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count (messages from designer that I haven't seen)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('booking_id', booking.id)
          .neq('sender_id', user?.id);

        return {
          booking_id: booking.id,
          designer_id: booking.designer_id,
          designer_name: designerName,
          designer_rating: designer?.rating || 0,
          designer_initials: designerInitials,
          designer_online: designer?.is_online || false,
          last_message: latestMessage?.content || 'No messages yet',
          last_message_time: latestMessage?.created_at 
            ? new Date(latestMessage.created_at).toLocaleDateString()
            : '',
          unread_count: Math.min(unreadCount || 0, 9)
        };
      });

      const conversationsList = await Promise.all(conversationPromises);
      setConversations(conversationsList);
      
      // Check for booking_id in URL params to auto-select conversation
      const urlParams = new URLSearchParams(window.location.search);
      const bookingId = urlParams.get('booking_id');
      if (bookingId) {
        const conversation = conversationsList.find(c => c.booking_id === bookingId);
        if (conversation) {
          setSelectedConversation(conversation);
          return;
        }
      }
      
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

  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || isSending) return;

    try {
      setIsSending(true);
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
        toast.error('Failed to send message. Please try again.');
        return;
      }

      setMessageInput('');
      // Refresh messages
      fetchMessages(selectedConversation.booking_id);
      // Refresh conversations to update last message
      fetchConversations();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const setupRealtimeSubscription = (bookingId: string) => {
    const channel = supabase
      .channel(`customer-messages-${bookingId}`)
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
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                          className="pr-24"
                          disabled={isSending}
                        />
                      </div>
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || isSending}
                        className="bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600"
                      >
                        <Send className="w-4 h-4" />
                        {isSending && <span className="ml-2">Sending...</span>}
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