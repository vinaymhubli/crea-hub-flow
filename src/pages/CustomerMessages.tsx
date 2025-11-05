import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  MoreVertical,
  Monitor,
  ArrowLeft,
  LayoutDashboard,
  Wallet,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CustomerSidebar } from "@/components/CustomerSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { RingingBell } from "@/components/RingingBell";
import NotificationBell from '@/components/NotificationBell';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ScreenShareModal } from "@/components/ScreenShareModal";
import { checkForContactInfo } from "@/utils/chatMonitor";

interface Message {
  id: string;
  sender_id: string;
  conversation_id: string;
  content: string;
  message_type: string;
  file_url: string | null;
  created_at: string;
}

interface Conversation {
  conversation_id: string;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [showScreenShare, setShowScreenShare] = useState(false);
  const [screenShareNotification, setScreenShareNotification] = useState<{
    show: boolean;
    designerName: string;
    roomId: string;
  }>({ show: false, designerName: '', roomId: '' });
  const [isScreenShareActive, setIsScreenShareActive] = useState(false);
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Debug: Show authentication state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Not Authenticated</h1>
          <p className="text-gray-600">Please log in to access messages.</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (profile.user_type !== 'client') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">This page is only for customers.</p>
        </div>
      </div>
    );
  }


  const designerId = searchParams.get('designer_id');

  // Helper function to clear unread count for a conversation
  const clearUnreadCount = useCallback(async (conversation: Conversation) => {
    if (conversation.unread_count > 0) {
      try {
        // Update local state immediately for better UX
        setConversations(prev => 
          prev.map(c => 
            c.conversation_id === conversation.conversation_id
              ? { ...c, unread_count: 0 }
              : c
          )
        );

        // Store the last viewed timestamp in localStorage to track read status
        const lastViewedKey = `last_viewed_conversation_${conversation.conversation_id}`;
        
        localStorage.setItem(lastViewedKey, new Date().toISOString());
      } catch (error) {
        console.error('Error clearing unread count:', error);
      }
    }
  }, []);

  const fetchConversations = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Only fetch direct conversations - no booking-related chats
      const directConversations = await fetchDirectConversations();
      setConversations(directConversations);
      
      console.log('URL params - designerId:', designerId);
      
      
      if (designerId) {
        // Find or create a direct conversation with this designer
        const designerConversation = directConversations.find(c => c.designer_id === designerId);
        if (designerConversation) {
          console.log('Found existing conversation with designer:', designerConversation);
          setSelectedConversation(designerConversation);
          clearUnreadCount(designerConversation);
          // Remove designer_id from URL after successful selection
          setSearchParams(prev => {
            prev.delete('designer_id');
            return prev;
          });
          return;
        } else {
          // Create a new conversation with this designer
          console.log('Creating new conversation for designer:', designerId);
          await createDirectConversation(designerId);
          return;
        }
      }
      
      // Only auto-select first conversation on desktop (not on mobile)
      if (directConversations.length > 0 && !selectedConversation && window.innerWidth >= 640) {
        const firstConversation = directConversations[0];
        setSelectedConversation(firstConversation);
        clearUnreadCount(firstConversation);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [designerId, selectedConversation, user?.id, setSearchParams]); // eslint-disable-line react-hooks/exhaustive-deps


  const fetchDirectConversations = useCallback(async () => {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        designer_id,
        created_at,
        last_message_at
      `)
      .eq('customer_id', user?.id)
      .order('last_message_at', { ascending: false });

    if (error || !conversations) return [];

    const designerIds = conversations.map(c => c.designer_id);
    if (designerIds.length === 0) return [];

    const { data: designers } = await supabase
      .from('designers')
      .select('id, user_id, rating, is_online')
      .in('id', designerIds);

    if (!designers) return [];

    const userIds = designers.map(d => d.user_id);
    const { data: designerProfiles } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', userIds);

    const conversationPromises = conversations.map(async (conversation) => {
      const designer = designers?.find(d => d.id === conversation.designer_id);
      const designerProfile = designerProfiles?.find(p => p.user_id === designer?.user_id);
      
      const designerName = designerProfile 
        ? `${designerProfile.first_name || ''} ${designerProfile.last_name || ''}`.trim() || 'Designer'
        : 'Designer';
      const designerInitials = designerProfile 
        ? `${designerProfile.first_name?.[0] || ''}${designerProfile.last_name?.[0] || ''}` || 'D'
        : 'D';

      const { data: latestMessage } = await supabase
        .from('conversation_messages')
        .select('content, created_at')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get the last viewed timestamp from localStorage
      const lastViewedKey = `last_viewed_conversation_${conversation.id}`;
      const lastViewed = localStorage.getItem(lastViewedKey);
      
      let unreadCount = 0;
      if (lastViewed) {
        // Count messages after the last viewed timestamp
        const { count } = await supabase
          .from('conversation_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .neq('sender_id', user?.id)
          .gt('created_at', lastViewed);
        unreadCount = count || 0;
      } else {
        // If no last viewed timestamp, count all messages from others
        const { count } = await supabase
          .from('conversation_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .neq('sender_id', user?.id);
        unreadCount = count || 0;
      }

      return {
        conversation_id: conversation.id,
        designer_id: conversation.designer_id,
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

    return Promise.all(conversationPromises);
  }, [user?.id]);

  const createDirectConversation = useCallback(async (designerId: string) => {
    try {
      setIsCreatingConversation(true);
      console.log('Creating conversation with designer:', designerId);
      
      const { data: conversationData, error } = await supabase
        .from('conversations')
        .insert({
          customer_id: user?.id,
          designer_id: designerId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        toast.error('Failed to start conversation');
        return;
      }

      console.log('Created conversation:', conversationData);

      // Get designer info for optimistic UI update
      const { data: designer } = await supabase
        .from('designers')
        .select('id, user_id, rating, is_online')
        .eq('id', designerId)
        .single();

      const { data: designerProfile } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('user_id', designer?.user_id)
        .single();

      const designerName = designerProfile 
        ? `${designerProfile.first_name || ''} ${designerProfile.last_name || ''}`.trim() || 'Designer'
        : 'Designer';
      const designerInitials = designerProfile 
        ? `${designerProfile.first_name?.[0] || ''}${designerProfile.last_name?.[0] || ''}` || 'D'
        : 'D';

      // Create optimistic conversation object
      const newConversation: Conversation = {
        conversation_id: conversationData.id,
        designer_id: designerId,
        designer_name: designerName,
        designer_rating: designer?.rating || 0,
        designer_initials: designerInitials,
        designer_online: designer?.is_online || false,
        last_message: 'Start chatting...',
        last_message_time: new Date().toLocaleDateString(),
        unread_count: 0
      };

      console.log('Optimistically selecting new conversation:', newConversation);
      setSelectedConversation(newConversation);
      
      // Update conversations list
      setConversations(prev => [newConversation, ...prev]);
      
      // Remove designer_id from URL after successful creation
      setSearchParams(prev => {
        prev.delete('designer_id');
        return prev;
      });

      toast.success('Started conversation with designer');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to start conversation');
    } finally {
      setIsCreatingConversation(false);
    }
  }, [user?.id, setSearchParams]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!selectedConversation) return;

    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', selectedConversation.conversation_id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
      // Scroll to bottom after messages are loaded
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [selectedConversation, scrollToBottom]);

  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || isSending) return;

    // Check for contact information (phone numbers and email addresses)
    // Pass conversation ID and user ID for pattern detection across messages
    const contactCheck = checkForContactInfo(
      messageInput.trim(),
      selectedConversation.conversation_id,
      user?.id
    );
    if (contactCheck.hasContactInfo) {
      toast.error(contactCheck.message);
      return;
    }

    const messageContent = messageInput.trim();
    const tempId = `temp_${Date.now()}`;
    
    // Optimistic UI update
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: user?.id || '',
      conversation_id: selectedConversation.conversation_id,
      content: messageContent,
      message_type: 'text',
      file_url: null,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');
    // Scroll to bottom when sending message
    setTimeout(() => scrollToBottom(), 100);

    try {
      setIsSending(true);

      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: selectedConversation.conversation_id,
          sender_id: user?.id,
          content: messageContent,
          message_type: 'text'
        });

      if (error) {
        console.error('Error sending message:', error);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setMessageInput(messageContent); // Restore message input
        toast.error('Failed to send message. Please try again.');
        return;
      }

      // Remove optimistic message - real message will come via realtime
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } catch (error) {
      console.error('Error:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessageInput(messageContent); // Restore message input
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const setupRealtimeSubscription = useCallback((conversationId: string) => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`customer-conversation-${selectedConversation.conversation_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${selectedConversation.conversation_id}`
        },
        (payload) => {
          console.log('New conversation message received:', payload.new);
          setMessages(prev => [...prev, payload.new as Message]);
          // Scroll to bottom when new message is received
          setTimeout(() => scrollToBottom(), 100);
          // Throttle conversation refresh
          setTimeout(() => fetchConversations(), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, scrollToBottom]); // eslint-disable-line react-hooks/exhaustive-deps

  const setupScreenShareNotification = useCallback((roomId: string) => {
    if (!selectedConversation) return;

    console.log('🎬 Setting up screen share notification for room:', roomId);
    
    const channel = supabase
      .channel(`screen-share-${roomId}`)
      .on('broadcast', { event: 'offer' }, (payload) => {
        if (payload.payload.roomId === roomId) {
          console.log('📺 Screen share started by designer:', selectedConversation.designer_name);
          setIsScreenShareActive(true);
          setScreenShareNotification({
            show: true,
            designerName: selectedConversation.designer_name,
            roomId: roomId
          });
        }
      })
      .on('broadcast', { event: 'screen-share-ended' }, (payload) => {
        if (payload.payload.roomId === roomId) {
          console.log('📺 Screen share ended by designer');
          setIsScreenShareActive(false);
          setScreenShareNotification(prev => ({ ...prev, show: false }));
          setShowScreenShare(false);
        }
      })
      .subscribe((status) => {
        console.log('🔌 Screen share notification channel status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up screen share notification channel');
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const joinScreenShare = () => {
    setShowScreenShare(true);
    setScreenShareNotification(prev => ({ ...prev, show: false }));
  };

  // useEffect hooks
  useEffect(() => {
    if (user) {
      // Only show loading on initial load or when URL params change
      const shouldShowLoading = initialLoad || Boolean(designerId);
      fetchConversations(shouldShowLoading);
    }
  }, [user, designerId, initialLoad, fetchConversations]);

  // Separate effect to handle initial load state
  useEffect(() => {
    if (user && initialLoad) {
      setInitialLoad(false);
    }
  }, [user, initialLoad]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let screenShareCleanup: (() => void) | undefined;
    
    if (selectedConversation) {
      fetchMessages(selectedConversation.conversation_id);
      cleanup = setupRealtimeSubscription(selectedConversation.conversation_id);
      screenShareCleanup = setupScreenShareNotification(selectedConversation.conversation_id);
    }
    
    return () => {
      if (cleanup) cleanup();
      if (screenShareCleanup) screenShareCleanup();
      setIsScreenShareActive(false);
      setScreenShareNotification({ show: false, designerName: '', roomId: '' });
    };
  }, [selectedConversation, fetchMessages, setupRealtimeSubscription, setupScreenShareNotification]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const filteredConversations = conversations.filter(conv =>
    conv.designer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && initialLoad) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-teal-50/30 to-blue-50/20">
          <CustomerSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">
                {designerId && isCreatingConversation 
                  ? 'Starting chat with designer...' 
                  : 'Loading messages...'
                }
              </p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CustomerSidebar />

        <main className="flex-1">
          <DashboardHeader
            title="Messages"
            subtitle="Chat with your designers and collaborate in real-time"
            icon={<MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
            userInitials={profile?.first_name && profile?.last_name 
              ? `${profile.first_name[0]}${profile.last_name[0]}`
              : user?.email ? user.email.substring(0, 2).toUpperCase()
              : 'CU'}
            isOnline={true}
            actionButton={
              <div className="flex items-center space-x-2 sm:space-x-4">
                <NotificationBell />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0">
                      <span className="text-white font-semibold text-xs sm:text-sm">
                        {profile?.first_name && profile?.last_name 
                          ? `${profile.first_name[0]}${profile.last_name[0]}`
                          : user?.email ? user.email.substring(0, 2).toUpperCase()
                          : 'CU'}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="min-w-64 w-fit p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 min-w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {profile?.first_name && profile?.last_name 
                              ? `${profile.first_name[0]}${profile.last_name[0]}`
                              : user?.email ? user.email.substring(0, 2).toUpperCase()
                              : 'CU'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {profile?.first_name && profile?.last_name 
                              ? `${profile.first_name} ${profile.last_name}`
                              : user?.email || 'Customer'}
                          </p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <Link 
                          to="/customer-dashboard" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link 
                          to="/customer-dashboard/wallet" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Wallet className="w-4 h-4 mr-3" />
                          Wallet
                        </Link>
                        <Link 
                          to="/customer-dashboard/profile" 
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Separator className="my-2" />
                        <button 
                          onClick={async () => {
                            try {
                              await signOut();
                            } catch (error) {
                              console.error('Error signing out:', error);
                            }
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            }
          />

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)]">
              {/* Conversations List */}
              <Card className={`lg:col-span-1 overflow-hidden border-0 shadow-lg ${
                selectedConversation ? 'hidden lg:flex' : 'flex'
              } flex-col`}>
                <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 sm:p-6">
                  <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                    <span>Conversations</span>
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white text-xs"
                    >
                      {conversations.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                  {/* Search */}
                  <div className="p-3 sm:p-4 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>
                  </div>

                  {/* Conversations */}
                  <div className="overflow-y-auto flex-1">
                    {filteredConversations.length === 0 ? (
                      <div className="p-6 sm:p-8 text-center">
                        <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                          No conversations
                        </h3>
                        <p className="text-gray-600 text-sm sm:text-base px-4">
                          Start a project to begin messaging with designers
                        </p>
                      </div>
                    ) : (
                      filteredConversations.map((conversation) => (
                        <div
                          key={conversation.conversation_id}
                          onClick={() => {
                            setSelectedConversation(conversation);
                            clearUnreadCount(conversation);
                          }}
                          className={`p-3 sm:p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedConversation?.conversation_id === conversation.conversation_id
                              ? 'bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500'
                              : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative">
                              <Avatar>
                                <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                                  {conversation.designer_initials}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {conversation.designer_name}
                                </h3>
                                {conversation.unread_count > 0 && (
                                  <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs">
                                    {conversation.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {conversation.last_message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">
                                  {conversation.last_message_time}
                                </span>
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
              <Card className={`lg:col-span-2 overflow-hidden border-0 shadow-lg ${
                selectedConversation ? 'flex' : 'hidden lg:flex'
              } flex-col`}>
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 sm:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          {/* Mobile Back Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedConversation(null)}
                            className="lg:hidden text-white hover:bg-white/20 p-2 h-8 w-8 flex-shrink-0"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </Button>
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                            <AvatarFallback className="bg-white/20 text-white text-sm sm:text-base">
                              {selectedConversation.designer_initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm sm:text-base truncate">
                              {selectedConversation.designer_name}
                            </h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20 p-2 h-8 w-8"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Messages Area */}
                    <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                        {messages.length === 0 ? (
                          <div className="text-center py-6 sm:py-8">
                            <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                            <p className="text-gray-600 text-sm sm:text-base px-4">
                              No messages yet. Start the conversation!
                            </p>
                          </div>
                        ) : (
                          messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.sender_id === user?.id
                                  ? 'justify-end'
                                  : 'justify-start'
                              }`}
                            >
                              <div
                                className={`flex items-start space-x-2 max-w-[85%] sm:max-w-[70%] ${
                                  message.sender_id === user?.id
                                    ? 'flex-row-reverse space-x-reverse'
                                    : ''
                                }`}
                              >
                                <div
                                  className={`rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                                    message.sender_id === user?.id
                                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                                      : 'bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  <p className="text-xs sm:text-sm break-words">{message.content}</p>
                                  <p
                                    className={`text-xs mt-1 ${
                                      message.sender_id === user?.id
                                        ? 'text-white/70'
                                        : 'text-gray-500'
                                    }`}
                                  >
                                    {new Date(message.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        {/* Scroll anchor */}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Message Input */}
                      <div className="border-t border-gray-200 p-3 sm:p-4">
                        <div className="flex items-end gap-2 sm:space-x-3">
                          <div className="flex-1">
                            <Input
                              placeholder="Type your message..."
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              className="min-h-[50px] sm:min-h-[60px] resize-none border-gray-300 focus:border-green-500 text-sm"
                              disabled={isSending}
                            />
                          </div>
                          <Button
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim() || isSending}
                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-3 sm:px-6 h-[50px] sm:h-auto"
                          >
                            <Send className="w-4 h-4" />
                            {isSending && (
                              <span className="ml-2 hidden sm:inline">Sending...</span>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 hidden sm:block">
                          Press Enter to send, Shift + Enter for new line
                        </p>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 px-4">
                        Select a conversation
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base px-4">
                        Choose a conversation from the left to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Screen Share Notification */}
      {screenShareNotification.show && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 bg-white border border-primary/20 rounded-lg shadow-lg p-3 sm:p-4 max-w-sm mx-auto sm:mx-0">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-xs sm:text-sm">Screen Share Started</h4>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {screenShareNotification.designerName} is sharing their screen
              </p>
              <div className="flex gap-2 mt-2 sm:mt-3">
                <Button size="sm" onClick={joinScreenShare} className="text-xs">
                  View Screen
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setScreenShareNotification(prev => ({ ...prev, show: false }))}
                  className="text-xs"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Share Modal */}
      {selectedConversation && (
        <ScreenShareModal
          isOpen={showScreenShare}
          onClose={() => setShowScreenShare(false)}
          roomId={selectedConversation.conversation_id}
          isHost={false}
          participantName={selectedConversation.designer_name}
        />
      )}
    </SidebarProvider>
  );
}