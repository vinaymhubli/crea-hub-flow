import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

  useEffect(() => {
    if (!profile) return;

    fetchBookings();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: profile.user_type === 'designer' 
            ? `designer_id=eq.${profile.user_id}`
            : `customer_id=eq.${profile.user_id}`
        },
        (payload) => {
          console.log('Booking change detected:', payload);
          handleRealtimeChange(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
        query = query.eq('designer_id', profile.user_id);
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

  const handleRealtimeChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        setBookings(prev => [...prev, newRecord]);
        break;
      case 'UPDATE':
        setBookings(prev => 
          prev.map(booking => 
            booking.id === newRecord.id ? newRecord : booking
          )
        );
        
        // Check if this is a session status change
        if (newRecord.status === 'in_progress' && oldRecord?.status !== 'in_progress') {
          setActiveSession(newRecord);
        } else if (newRecord.status !== 'in_progress' && oldRecord?.status === 'in_progress') {
          setActiveSession(null);
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

  return {
    bookings,
    activeSession,
    loading,
    startSession,
    endSession,
    getUpcomingBookings,
    getCompletedBookings,
    refetch: fetchBookings
  };
};