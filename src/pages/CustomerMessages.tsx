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
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CustomerSidebar } from "@/components/CustomerSidebar";
import { RingingBell } from "@/components/RingingBell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ScreenShareModal } from "@/components/ScreenShareModal";

interface Message {
  id: string;
  sender_id: string;
  booking_id?: string;
  conversation_id?: string;
  content: string;
  message_type: string;
  file_url: string | null;
  created_at: string;
}

interface Conversation {
  conversation_id?: string;
  booking_id?: string;
  designer_id: string;
  designer_name: string;
  designer_rating: number;
  designer_initials: string;
  designer_online: boolean;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  type: 'booking' | 'direct';
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
  const { user, profile, loading: authLoading } = useAuth();

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
  const bookingId = searchParams.get('booking_id');

  // Helper function to clear unread count for a conversation
  const clearUnreadCount = useCallback(async (conversation: Conversation) => {
    if (conversation.unread_count > 0) {
      try {
        // Update local state immediately for better UX
        setConversations(prev => 
          prev.map(c => 
            c.conversation_id === conversation.conversation_id || 
            c.booking_id === conversation.booking_id
              ? { ...c, unread_count: 0 }
              : c
          )
        );

        // Store the last viewed timestamp in localStorage to track read status
        const lastViewedKey = conversation.booking_id 
          ? `last_viewed_booking_${conversation.booking_id}`
          : `last_viewed_conversation_${conversation.conversation_id}`;
        
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
      
      // Get both booking-based and direct conversations
      const [bookingConversations, directConversations] = await Promise.all([
        fetchBookingConversations(),
        fetchDirectConversations()
      ]);

      const allConversations = [...directConversations, ...bookingConversations];
      setConversations(allConversations);
      
      console.log('URL params - designerId:', designerId, 'bookingId:', bookingId);
      
      if (bookingId) {
        const conversation = allConversations.find(c => c.type === 'booking' && c.booking_id === bookingId);
        if (conversation) {
          console.log('Found existing booking conversation:', conversation);
          setSelectedConversation(conversation);
          clearUnreadCount(conversation);
          return;
        }
      }
      
      if (designerId) {
        // Find or create a direct conversation with this designer
        const designerConversation = allConversations.find(c => c.designer_id === designerId);
        if (designerConversation) {
          console.log('Found existing direct conversation:', designerConversation);
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
      if (allConversations.length > 0 && !selectedConversation && window.innerWidth >= 640) {
        const firstConversation = allConversations[0];
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
  }, [designerId, bookingId, selectedConversation, user?.id, setSearchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBookingConversations = useCallback(async () => {
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, designer_id')
      .eq('customer_id', user?.id)
      .order('updated_at', { ascending: false });

    if (bookingsError || !bookings) return [];

    const designerIds = [...new Set(bookings.map(b => b.designer_id))];
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

    const conversationPromises = bookings.map(async (booking) => {
      const designer = designers?.find(d => d.id === booking.designer_id);
      const designerProfile = designerProfiles?.find(p => p.user_id === designer?.user_id);
      
      const designerName = designerProfile 
        ? `${designerProfile.first_name || ''} ${designerProfile.last_name || ''}`.trim() || 'Designer'
        : 'Designer';
      const designerInitials = designerProfile 
        ? `${designerProfile.first_name?.[0] || ''}${designerProfile.last_name?.[0] || ''}` || 'D'
        : 'D';

      const { data: latestMessage } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get the last viewed timestamp from localStorage
      const lastViewedKey = `last_viewed_booking_${booking.id}`;
      const lastViewed = localStorage.getItem(lastViewedKey);
      
      let unreadCount = 0;
      if (lastViewed) {
        // Count messages after the last viewed timestamp
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('booking_id', booking.id)
          .neq('sender_id', user?.id)
          .gt('created_at', lastViewed);
        unreadCount = count || 0;
      } else {
        // If no last viewed timestamp, count all messages from others
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('booking_id', booking.id)
          .neq('sender_id', user?.id);
        unreadCount = count || 0;
      }

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
        unread_count: Math.min(unreadCount || 0, 9),
        type: 'booking' as const
      };
    });

    return Promise.all(conversationPromises);
  }, [user?.id]);

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
        unread_count: Math.min(unreadCount || 0, 9),
        type: 'direct' as const
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
        unread_count: 0,
        type: 'direct'
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

  const fetchMessages = useCallback(async (conversationOrBookingId: string) => {
    if (!selectedConversation) return;

    try {
      let data, error;
      
      if (selectedConversation.type === 'direct' && selectedConversation.conversation_id) {
        ({ data, error } = await supabase
          .from('conversation_messages')
          .select('*')
          .eq('conversation_id', selectedConversation.conversation_id)
          .order('created_at', { ascending: true }));
      } else if (selectedConversation.booking_id) {
        ({ data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('booking_id', selectedConversation.booking_id)
          .order('created_at', { ascending: true }));
      }

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [selectedConversation]);

  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || isSending) return;

    const messageContent = messageInput.trim();
    const tempId = `temp_${Date.now()}`;
    
    // Optimistic UI update
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: user?.id || '',
      booking_id: selectedConversation.booking_id,
      conversation_id: selectedConversation.conversation_id,
      content: messageContent,
      message_type: 'text',
      file_url: null,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');

    try {
      setIsSending(true);
      let error;

      if (selectedConversation.type === 'direct' && selectedConversation.conversation_id) {
        ({ error } = await supabase
          .from('conversation_messages')
          .insert({
            conversation_id: selectedConversation.conversation_id,
            sender_id: user?.id,
            content: messageContent,
            message_type: 'text'
          }));
      } else if (selectedConversation.booking_id) {
        ({ error } = await supabase
          .from('messages')
          .insert({
            booking_id: selectedConversation.booking_id,
            sender_id: user?.id,
            content: messageContent,
            message_type: 'text'
          }));
      }

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

  const setupRealtimeSubscription = useCallback((conversationOrBookingId: string) => {
    if (!selectedConversation) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    if (selectedConversation.type === 'direct' && selectedConversation.conversation_id) {
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
            setMessages(prev => [...prev, payload.new as Message]);
            // Throttle conversation refresh
            setTimeout(() => fetchConversations(), 1000);
          }
        )
        .subscribe();
      channels.push(channel);
    }

    if (selectedConversation.booking_id) {
      const channel = supabase
        .channel(`customer-messages-${selectedConversation.booking_id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `booking_id=eq.${selectedConversation.booking_id}`
          },
           (payload) => {
            console.log('New booking message received:', payload.new);
            setMessages(prev => [...prev, payload.new as Message]);
            // Throttle conversation refresh
            setTimeout(() => fetchConversations(), 1000);
          }
        )
        .subscribe();
      channels.push(channel);
    }

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [selectedConversation]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const shouldShowLoading = initialLoad || Boolean(designerId) || Boolean(bookingId);
      fetchConversations(shouldShowLoading);
    }
  }, [user, designerId, bookingId, initialLoad, fetchConversations]);

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
      fetchMessages(selectedConversation.conversation_id || selectedConversation.booking_id || '');
      cleanup = setupRealtimeSubscription(selectedConversation.conversation_id || selectedConversation.booking_id || '');
      screenShareCleanup = setupScreenShareNotification(selectedConversation.conversation_id || selectedConversation.booking_id || '');
    }
    
    return () => {
      if (cleanup) cleanup();
      if (screenShareCleanup) screenShareCleanup();
      setIsScreenShareActive(false);
      setScreenShareNotification({ show: false, designerName: '', roomId: '' });
    };
  }, [selectedConversation, fetchMessages, setupRealtimeSubscription, setupScreenShareNotification]);

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
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-teal-50/30 to-blue-50/20">
        <CustomerSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-gradient-to-br from-green-400 via-teal-500 to-blue-500 text-white px-4 sm:px-6 py-4 sm:py-8 flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <SidebarTrigger className="text-white flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 truncate">Messages</h1>
                  <p className="text-green-100 text-xs sm:text-sm hidden sm:block">Chat with your designers and collaborate in real-time</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                <RingingBell className="w-4 h-4 sm:w-5 sm:h-5 text-green-100" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <span className="text-white font-semibold text-xs sm:text-sm">U</span>
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

          <div className="flex-1 flex overflow-hidden">
            {/* Conversations List */}
            <div className={`w-full sm:w-80 bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border-r border-teal-200/30 flex flex-col ${selectedConversation ? 'hidden sm:flex' : 'flex'}`}>
              {/* Search */}
              <div className="p-3 sm:p-4 border-b border-teal-200/30">
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
                  <div className="p-6 sm:p-8 text-center">
                    <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No conversations</h3>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base">Start a project to begin messaging with designers</p>
                    <Link to="/designers">
                      <Button className="text-sm sm:text-base">Find Designers</Button>
                    </Link>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.conversation_id || conversation.booking_id}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        clearUnreadCount(conversation);
                      }}
                      className={`p-3 sm:p-4 border-b border-teal-200/20 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-50 ${
                        selectedConversation?.conversation_id === conversation.conversation_id || 
                        selectedConversation?.booking_id === conversation.booking_id
                          ? 'bg-gradient-to-r from-teal-100 to-blue-100 border-teal-300'
                          : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold text-xs sm:text-sm">{conversation.designer_initials}</span>
                          </div>
                          {conversation.designer_online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-foreground truncate text-sm sm:text-base">{conversation.designer_name}</p>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              {conversation.unread_count > 0 && (
                                <Badge className="bg-gradient-to-r from-green-400 to-teal-500 text-white text-xs px-2 py-0.5 shadow-lg">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 mb-1 sm:mb-2">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-muted-foreground">{conversation.designer_rating}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{conversation.last_message}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">{conversation.last_message_time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-gradient-to-br from-background to-teal-50/10 ${selectedConversation ? 'flex' : 'hidden sm:flex'}`}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border-b border-teal-200/30 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Back button for mobile */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="sm:hidden flex-shrink-0 p-2"
                          onClick={() => setSelectedConversation(null)}
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="relative flex-shrink-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold text-xs sm:text-sm">{selectedConversation.designer_initials}</span>
                          </div>
                          {selectedConversation.designer_online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground text-sm sm:text-base truncate">{selectedConversation.designer_name}</p>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs sm:text-sm text-muted-foreground">{selectedConversation.designer_rating}</span>
                            {selectedConversation.designer_online && (
                              <span className="text-xs sm:text-sm text-green-600">• Online</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <Button variant="ghost" size="sm" className="hover:bg-teal-100 p-2 hidden sm:flex">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-teal-100 p-2 hidden sm:flex">
                          <Video className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-teal-100 p-2 hidden sm:flex">
                          <Info className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-teal-100 p-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 text-sm sm:text-base">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-lg ${
                                message.sender_id === user?.id
                                  ? 'bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 text-white'
                                  : 'bg-white border border-teal-200/50 text-gray-900'
                              }`}
                            >
                              <p className="text-xs sm:text-sm break-words">{message.content}</p>
                              <p className={`text-xs mt-1 sm:mt-2 ${
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
                        ))}
                        
                        {/* Live Design Callout */}
                        {isScreenShareActive && (
                          <div className="flex justify-center px-2">
                            <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200/50 rounded-xl p-3 sm:p-4 w-full max-w-md shadow-sm">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-400 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-xs sm:text-sm text-gray-900">Live design started</h4>
                                  <p className="text-xs text-gray-600 mt-1 truncate">
                                    {selectedConversation.designer_name} is sharing their screen
                                  </p>
                                  <Button 
                                    size="sm" 
                                    onClick={joinScreenShare}
                                    className="mt-2 bg-gradient-to-r from-blue-400 to-teal-500 hover:from-blue-500 hover:to-teal-600 text-white text-xs h-7"
                                  >
                                    Join Live Design
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="bg-white border-t border-teal-200/30 p-3 sm:p-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Type your message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                          className="pr-4 text-sm sm:text-base"
                          disabled={isSending}
                        />
                      </div>
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || isSending}
                        className="bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 px-3 sm:px-4"
                        size="sm"
                      >
                        <Send className="w-4 h-4" />
                        {isSending && <span className="ml-2 hidden sm:inline">Sending...</span>}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No conversation selected</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Choose a conversation to start messaging</p>
                  </div>
                </div>
              )}
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
          roomId={selectedConversation.conversation_id || selectedConversation.booking_id || ''}
          isHost={false}
          participantName={selectedConversation.designer_name}
        />
      )}
    </SidebarProvider>
  );
}