import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SessionData {
  id: string;
  client: {
    name: string;
    avatar: string;
    email: string;
  };
  project: string;
  date: string;
  duration: string;
  type: string;
  status: string;
  rating?: number;
  feedback?: string;
  earnings: number;
  hasRecording: boolean;
  hasNotes: boolean;
  tools: string[];
  service: string;
  description?: string;
}

export const useSessionHistory = () => {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!user?.id || !profile) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get designer ID first
      const { data: designerData, error: designerError } = await supabase
        .from('designers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (designerError) {
        console.error('Error fetching designer:', designerError);
        setError('Failed to fetch designer profile');
        return;
      }

      // Fetch completed bookings with customer profiles
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          customer_id,
          service,
          description,
          scheduled_date,
          duration_hours,
          total_amount,
          status,
          created_at,
          profiles!inner(
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('designer_id', designerData.id)
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching sessions:', bookingsError);
        setError('Failed to fetch session history');
        return;
      }

      // Transform data to match session format
      const transformedSessions: SessionData[] = (bookingsData || []).map(booking => {
        const profile = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles;
        const clientName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown Client';
        
        return {
          id: booking.id,
          client: {
            name: clientName,
            avatar: profile?.avatar_url || '',
            email: profile?.email || 'No email'
          },
          project: booking.service || 'Design Consultation',
          date: new Date(booking.scheduled_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          duration: `${booking.duration_hours}h 00m`,
          type: 'Video Call',
          status: booking.status,
          earnings: Number(booking.total_amount) || 0,
          hasRecording: Math.random() > 0.5, // Random for now
          hasNotes: true,
          tools: ['Figma', 'Adobe XD'], // Default tools for now
          service: booking.service || 'Design Consultation',
          description: booking.description
        };
      });

      setSessions(transformedSessions);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch session history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user?.id, profile]);

  const stats = {
    totalSessions: sessions.length,
    totalHours: sessions.reduce((acc, session) => {
      const hours = parseFloat(session.duration.split('h')[0]);
      const minutesPart = session.duration.split('h')[1]?.split('m')[0];
      const minutes = minutesPart ? parseFloat(minutesPart) : 0;
      return acc + hours + (minutes / 60);
    }, 0),
    avgRating: sessions.length > 0 ? sessions.reduce((acc, session) => acc + (session.rating || 5), 0) / sessions.length : 0,
    totalEarnings: sessions.reduce((acc, session) => acc + session.earnings, 0)
  };

  return {
    sessions,
    stats,
    loading,
    error,
    refetch: fetchSessions
  };
};