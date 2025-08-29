import { useState, useEffect } from 'react';
import { 
  MessageSquare,
  Send, 
  Search, 
  MoreVertical, 
  Bell,
  LogOut,
  LayoutDashboard,
  User,
  DollarSign,
  Clock
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DesignerSidebar } from '@/components/DesignerSidebar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";


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
  customer_id: string;
  customer_name: string;
  customer_initials: string;
  service: string;
  status: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function DesignerMessages() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [designerId, setDesignerId] = useState<string | null>(null);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user) {
      fetchDesignerProfile();
    }
  }, [user]);

  useEffect(() => {
    if (designerId) {
      fetchConversations();
    }
  }, [designerId]);

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

  useEffect(() => {
    // Check for booking_id in URL params to auto-select conversation
    const bookingId = searchParams.get('booking_id');
    if (bookingId && conversations.length > 0) {
      const conversation = conversations.find(c => c.booking_id === bookingId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    } else if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, searchParams]);

  const fetchDesignerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('designers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching designer profile:', error);
        toast.error('Failed to load designer profile');
        return;
      }

      setDesignerId(data.id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // First, get all bookings for this designer
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, customer_id, service, status, updated_at')
        .eq('designer_id', designerId)
        .order('updated_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        toast.error('Failed to load conversations');
        return;
      }

      if (!bookings || bookings.length === 0) {
        setConversations([]);
        return;
      }

      // Get customer profiles for all unique customer IDs
      const customerIds = [...new Set(bookings.map(b => b.customer_id))];
      const { data: customerProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', customerIds);

      if (profilesError) {
        console.error('Error fetching customer profiles:', profilesError);
      }

      // Build conversations with customer info and message data
      const conversationPromises = bookings.map(async (booking) => {
        // Find customer profile
        const customerProfile = customerProfiles?.find(p => p.user_id === booking.customer_id);
        const customerName = customerProfile 
          ? `${customerProfile.first_name || ''} ${customerProfile.last_name || ''}`.trim() || 'Customer'
          : 'Customer';
        const customerInitials = customerProfile 
          ? `${customerProfile.first_name?.[0] || ''}${customerProfile.last_name?.[0] || ''}` || 'C'
          : 'C';

        // Get latest message
        const { data: latestMessage } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('booking_id', booking.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count (messages from customer that I haven't seen)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('booking_id', booking.id)
          .eq('sender_id', booking.customer_id);

        return {
          booking_id: booking.id,
          customer_id: booking.customer_id,
          customer_name: customerName,
          customer_initials: customerInitials,
          service: booking.service,
          status: booking.status,
          last_message: latestMessage?.content || 'No messages yet',
          last_message_time: latestMessage?.created_at 
            ? new Date(latestMessage.created_at).toLocaleDateString()
            : '',
          unread_count: Math.min(unreadCount || 0, 9)
        };
      });

      const conversationsList = await Promise.all(conversationPromises);
      setConversations(conversationsList);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load conversations');
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

  const setupRealtimeSubscription = (bookingId: string) => {
    const channel = supabase
      .channel('messages')
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          booking_id: selectedConversation.booking_id,
          sender_id: user?.id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send message');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DesignerSidebar />
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
      <div className="min-h-screen flex w-full bg-background">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-gradient-to-r from-green-400 to-blue-500 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white hover:bg-white/20" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Messages</h1>
                  <p className="text-white/80">Communicate with your clients and manage project discussions</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white/80 text-sm font-medium">Online</span>
                </div>
                <Bell className="w-5 h-5 text-white/80" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <span className="text-white font-semibold text-xs">MD</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-xs">MD</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Meet My Designer</p>
                          <p className="text-sm text-muted-foreground">lvbn200@gmail.com</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <Link 
                          to="/designer-dashboard" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link 
                          to="/designer-dashboard/earnings" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <DollarSign className="w-4 h-4 mr-3" />
                          Earnings
                        </Link>
                        <Link 
                          to="/designer-dashboard/profile" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Separator className="my-2" />
                        <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
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

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
              {/* Conversations List */}
              <Card className="lg:col-span-1 overflow-hidden border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <span>Conversations</span>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {conversations.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Search */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Conversations */}
                  <div className="overflow-y-auto max-h-[500px]">
                    {filteredConversations.length === 0 ? (
                      <div className="p-8 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations</h3>
                        <p className="text-gray-600">You'll see client conversations here once you have bookings</p>
                      </div>
                    ) : (
                      filteredConversations.map((conversation) => (
                        <div
                          key={conversation.booking_id}
                          onClick={() => setSelectedConversation(conversation)}
                          className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedConversation?.booking_id === conversation.booking_id ? 'bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative">
                              <Avatar>
                                <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                                  {conversation.customer_initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                                conversation.status === 'confirmed' || conversation.status === 'in_progress' ? 'bg-green-500' : 
                                conversation.status === 'pending' ? 'bg-yellow-500' : 
                                'bg-gray-400'
                              }`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 truncate">{conversation.customer_name}</h3>
                                {conversation.unread_count > 0 && (
                                  <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs">
                                    {conversation.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate mt-1">{conversation.service}</p>
                              <p className="text-sm text-gray-600 truncate mt-1">{conversation.last_message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {conversation.last_message_time}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    conversation.status === 'confirmed' || conversation.status === 'in_progress' ? 'border-green-500 text-green-600' :
                                    conversation.status === 'pending' ? 'border-yellow-500 text-yellow-600' :
                                    'border-gray-400 text-gray-600'
                                  }`}
                                >
                                  {conversation.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Chat Area */}
              <Card className="lg:col-span-2 overflow-hidden border-0 shadow-lg flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-white/20 text-white">
                              {selectedConversation.customer_initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{selectedConversation.customer_name}</h3>
                            <p className="text-white/80 text-sm">Project: {selectedConversation.service}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    {/* Messages Area */}
                    <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">No messages yet. Start the conversation!</p>
                          </div>
                        ) : (
                          messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`flex items-start space-x-2 max-w-[70%] ${
                                message.sender_id === user?.id ? 'flex-row-reverse space-x-reverse' : ''
                              }`}>
                                {message.sender_id !== user?.id && (
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                      {selectedConversation.customer_initials}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div className={`rounded-2xl px-4 py-3 ${
                                  message.sender_id === user?.id
                                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}>
                                  <p className="text-sm">{message.content}</p>
                                  <p className={`text-xs mt-1 ${
                                    message.sender_id === user?.id ? 'text-white/70' : 'text-gray-500'
                                  }`}>
                                    {new Date(message.created_at).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="border-t border-gray-200 p-4">
                        <div className="flex items-end space-x-3">
                          <div className="flex-1">
                            <Textarea
                              placeholder="Type your message..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              className="min-h-[60px] resize-none border-gray-300 focus:border-green-500"
                            />
                          </div>
                          <Button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift + Enter for new line</p>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                      <p className="text-gray-600">Choose a conversation from the left to start messaging</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}