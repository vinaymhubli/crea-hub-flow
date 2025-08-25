
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminBooking {
  id: string;
  service: string;
  status: string;
  total_amount: number;
  scheduled_date: string;
  customer_id: string;
  designer_id: string;
  customer?: {
    first_name?: string;
    last_name?: string;
  };
  designer?: {
    user_id: string;
    specialty: string;
    user?: {
      first_name?: string;
      last_name?: string;
    };
  };
}

export const useAdminBookings = () => {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!customer_id(first_name, last_name),
          designer:designers!designer_id(
            user_id,
            specialty,
            user:profiles!user_id(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId ? { ...booking, status } : booking
        )
      );
      
      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return {
    bookings,
    loading,
    updateBookingStatus,
    refetch: fetchBookings,
  };
};
