import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDesignerProfile } from './useDesignerProfile';
import { useToast } from '@/hooks/use-toast';

interface EarningsData {
  totalEarnings: number;
  availableBalance: number;
  completedSessions: number;
  avgHourlyRate: number;
  monthlyGrowth: number;
}

interface Transaction {
  id: string;
  client_name: string;
  service: string;
  total_amount: number;
  created_at: string;
  status: string;
  duration_hours: number;
}

interface MonthlyEarning {
  month: string;
  earnings: number;
}

export const useDesignerEarnings = () => {
  const { designerProfile } = useDesignerProfile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    availableBalance: 0,
    completedSessions: 0,
    avgHourlyRate: 0,
    monthlyGrowth: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyEarning[]>([]);

  const fetchEarningsData = async () => {
    if (!designerProfile?.id) return;

    try {
      setLoading(true);

      // Fetch completed bookings for this designer
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!bookings_customer_id_fkey(first_name, last_name)
        `)
        .eq('designer_id', designerProfile.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Calculate earnings data
      const completedBookings = bookingsData || [];
      const totalEarnings = completedBookings.reduce((sum, booking) => sum + booking.total_amount, 0);
      const completedSessions = completedBookings.length;
      const totalHours = completedBookings.reduce((sum, booking) => sum + (booking.duration_hours || 1), 0);
      const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

      // Get current month earnings
      const currentDate = new Date();
      const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const currentMonthBookings = completedBookings.filter(
        booking => new Date(booking.created_at) >= currentMonthStart
      );
      const currentMonthEarnings = currentMonthBookings.reduce((sum, booking) => sum + booking.total_amount, 0);

      // Get previous month earnings for growth calculation
      const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      const prevMonthBookings = completedBookings.filter(
        booking => {
          const bookingDate = new Date(booking.created_at);
          return bookingDate >= prevMonthStart && bookingDate <= prevMonthEnd;
        }
      );
      const prevMonthEarnings = prevMonthBookings.reduce((sum, booking) => sum + booking.total_amount, 0);
      
      const monthlyGrowth = prevMonthEarnings > 0 
        ? ((currentMonthEarnings - prevMonthEarnings) / prevMonthEarnings) * 100 
        : 0;

      setEarningsData({
        totalEarnings,
        availableBalance: totalEarnings, // In a real app, this would be total - withdrawn
        completedSessions,
        avgHourlyRate,
        monthlyGrowth,
      });

      // Format transactions
      const formattedTransactions = completedBookings.map(booking => ({
        id: booking.id,
        client_name: `${booking.customer?.first_name || ''} ${booking.customer?.last_name || ''}`.trim() || 'Unknown Client',
        service: booking.service,
        total_amount: booking.total_amount,
        created_at: booking.created_at,
        status: booking.status,
        duration_hours: booking.duration_hours || 1,
      }));

      setTransactions(formattedTransactions);

      // Calculate monthly data for the last 6 months
      const monthlyEarnings: MonthlyEarning[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
        
        const monthBookings = completedBookings.filter(booking => {
          const bookingDate = new Date(booking.created_at);
          return bookingDate >= monthDate && bookingDate < nextMonthDate;
        });

        const monthEarnings = monthBookings.reduce((sum, booking) => sum + booking.total_amount, 0);
        
        monthlyEarnings.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
          earnings: monthEarnings,
        });
      }

      setMonthlyData(monthlyEarnings);

    } catch (error) {
      console.error('Error fetching earnings data:', error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, [designerProfile?.id]);

  return {
    loading,
    earningsData,
    transactions,
    monthlyData,
    refetch: fetchEarningsData,
  };
};