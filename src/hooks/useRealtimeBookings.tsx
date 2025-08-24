import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  customer_id: string;
  designer_id: string;
  service: string;
  status: string;
  scheduled_date: string;
  duration_hours: number;
  total_amount: number;
  description?: string;
  customer?: {
    first_name?: string;
    last_name?: string;
  };
  designer?: {
    user_id: string;
    specialty: string;
    rating: number;
    user?: {
      first_name?: string;
      last_name?: string;
    };
  };
}

export const useRealtimeBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeSession, setActiveSession] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const channelRef = useRef<any>(null);
  const [onNewBooking, setOnNewBooking] = useState<((booking: Booking) => void) | null>(null);

  useEffect(() => {
    if (!profile) return;

    fetchBookings();
    
    // Set up real-time subscription after fetching bookings
    const setupRealtimeSubscription = async () => {
      // Clean up existing channel
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      if (profile.user_type === 'designer') {
        // For designers, we need to get their designer ID first
        const { data: designerData } = await supabase
          .from('designers')
          .select('id')
          .eq('user_id', profile.user_id)
          .single();
        
        if (designerData) {
          channelRef.current = supabase
            .channel('bookings-changes')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'bookings',
                filter: `designer_id=eq.${designerData.id}`
              },
              (payload) => {
                console.log('Booking change detected:', payload);
                handleRealtimeChange(payload);
              }
            )
            .subscribe();
        }
      } else {
        // For customers, use customer_id directly
        channelRef.current = supabase
          .channel('bookings-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'bookings',
              filter: `customer_id=eq.${profile.user_id}`
            },
            (payload) => {
              console.log('Booking change detected:', payload);
              handleRealtimeChange(payload);
            }
          )
          .subscribe();
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [profile]);

  const fetchBookings = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!customer_id(first_name, last_name),
          designer:designers!designer_id(
            user_id,
            specialty,
            rating,
            user:profiles!user_id(first_name, last_name)
          )
        `);

      // Filter based on user type
      if (profile.user_type === 'designer') {
        // For designers, first get their designer ID
        const { data: designerData } = await supabase
          .from('designers')
          .select('id')
          .eq('user_id', profile.user_id)
          .single();
        
        if (designerData) {
          query = query.eq('designer_id', designerData.id);
        } else {
          // No designer profile found, return empty
          setBookings([]);
          setLoading(false);
          return;
        }
      } else {
        query = query.eq('customer_id', profile.user_id);
      }

      const { data, error } = await query.order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      setBookings(data || []);
      
      // Check for active sessions
      const activeBooking = data?.find(booking => 
        booking.status === 'in_progress' && 
        new Date(booking.scheduled_date) <= new Date()
      );
      
      setActiveSession(activeBooking || null);
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeChange = async (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        // Fetch full booking details with relations
        const { data: fullBooking } = await supabase
          .from('bookings')
          .select(`
            *,
            customer:profiles!customer_id(first_name, last_name),
            designer:designers!designer_id(
              user_id,
              specialty,
              rating,
              user:profiles!user_id(first_name, last_name)
            )
          `)
          .eq('id', newRecord.id)
          .single();

        if (fullBooking) {
          setBookings(prev => [...prev, fullBooking]);
          
          // For designers, show notification for new pending bookings
          if (profile?.user_type === 'designer' && fullBooking.status === 'pending') {
            const customerName = fullBooking.customer 
              ? `${fullBooking.customer.first_name || ''} ${fullBooking.customer.last_name || ''}`.trim()
              : 'A customer';
            
            toast({
              title: "New Booking Request!",
              description: `${customerName} wants to book ${fullBooking.service}`,
              duration: 10000,
            });

            // Call the callback if provided
            if (onNewBooking) {
              onNewBooking(fullBooking);
            }
          }
        }
        break;
      case 'UPDATE':
        // Fetch updated booking with relations
        const { data: updatedBooking } = await supabase
          .from('bookings')
          .select(`
            *,
            customer:profiles!customer_id(first_name, last_name),
            designer:designers!designer_id(
              user_id,
              specialty,
              rating,
              user:profiles!user_id(first_name, last_name)
            )
          `)
          .eq('id', newRecord.id)
          .single();

        if (updatedBooking) {
          setBookings(prev => 
            prev.map(booking => 
              booking.id === updatedBooking.id ? updatedBooking : booking
            )
          );
          
          // Check if this is a session status change
          if (updatedBooking.status === 'in_progress' && oldRecord?.status !== 'in_progress') {
            setActiveSession(updatedBooking);
          } else if (updatedBooking.status !== 'in_progress' && oldRecord?.status === 'in_progress') {
            setActiveSession(null);
          }
        }
        break;
      case 'DELETE':
        setBookings(prev => prev.filter(booking => booking.id !== oldRecord.id));
        if (activeSession?.id === oldRecord.id) {
          setActiveSession(null);
        }
        break;
    }
  };

  const startSession = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'in_progress' })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error starting session:', error);
      return { success: false, error };
    }
  };

  const endSession = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      
      setActiveSession(null);
      return { success: true, data };
    } catch (error) {
      console.error('Error ending session:', error);
      return { success: false, error };
    }
  };

  const getUpcomingBookings = () => {
    return bookings.filter(booking => 
      booking.status === 'confirmed' || booking.status === 'pending'
    );
  };

  const getCompletedBookings = () => {
    return bookings.filter(booking => booking.status === 'completed');
  };

  const acceptBooking = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Create notification for customer
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        await supabase
          .from('notifications')
          .insert({
            user_id: booking.customer_id,
            title: 'Booking Confirmed',
            message: `Your booking for ${booking.service} has been confirmed!`,
            type: 'booking_confirmed',
            related_id: bookingId
          });
      }

      toast({
        title: "Booking Accepted",
        description: "The booking has been confirmed successfully.",
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast({
        title: "Error",
        description: "Failed to accept booking. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const declineBooking = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Create notification for customer
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        await supabase
          .from('notifications')
          .insert({
            user_id: booking.customer_id,
            title: 'Booking Declined',
            message: `Your booking for ${booking.service} has been declined.`,
            type: 'booking_cancelled',
            related_id: bookingId
          });
      }

      toast({
        title: "Booking Declined",
        description: "The booking has been declined.",
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error declining booking:', error);
      toast({
        title: "Error",
        description: "Failed to decline booking. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const rescheduleBooking = async (bookingId: string, newDate: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ scheduled_date: newDate })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Create notification for customer
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        await supabase
          .from('notifications')
          .insert({
            user_id: booking.customer_id,
            title: 'Booking Rescheduled',
            message: `Your booking for ${booking.service} has been rescheduled.`,
            type: 'booking_rescheduled',
            related_id: bookingId
          });
      }

      toast({
        title: "Booking Rescheduled",
        description: "The booking has been rescheduled successfully.",
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule booking. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const setNewBookingCallback = (callback: (booking: Booking) => void) => {
    setOnNewBooking(() => callback);
  };

  return {
    bookings,
    activeSession,
    loading,
    startSession,
    endSession,
    acceptBooking,
    declineBooking,
    rescheduleBooking,
    getUpcomingBookings,
    getCompletedBookings,
    setNewBookingCallback,
    refetch: fetchBookings
  };
};