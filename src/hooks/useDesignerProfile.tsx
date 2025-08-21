import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DesignerProfile {
  id: string;
  user_id: string;
  specialty: string;
  hourly_rate: number;
  portfolio_images: string[];
  response_time: string;
  location: string;
  skills: string[];
  bio: string;
  is_online: boolean;
  completion_rate: number;
  reviews_count: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export const useDesignerProfile = () => {
  const { user } = useAuth();
  const [designerProfile, setDesignerProfile] = useState<DesignerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDesignerProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('designers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching designer profile:', error);
        setError(error.message);
        return;
      }

      setDesignerProfile(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch designer profile');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalEarnings = async () => {
    if (!user?.id) return 0;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('total_amount')
        .eq('designer_id', designerProfile?.id)
        .eq('status', 'completed');

      if (error) {
        console.error('Error calculating earnings:', error);
        return 0;
      }

      return data?.reduce((total, booking) => total + Number(booking.total_amount), 0) || 0;
    } catch (err) {
      console.error('Error calculating earnings:', err);
      return 0;
    }
  };

  useEffect(() => {
    fetchDesignerProfile();
  }, [user?.id]);

  return {
    designerProfile,
    loading,
    error,
    refetch: fetchDesignerProfile,
    calculateTotalEarnings
  };
};