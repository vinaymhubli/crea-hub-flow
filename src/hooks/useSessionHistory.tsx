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
  durationMinutes: number; // numeric duration in minutes for accurate stats
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

      // Fetch completed bookings with customer profiles and reviews
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

      // Also fetch completed live sessions with payment data
      const { data: liveSessionsData, error: liveSessionsError } = await supabase
        .from('active_sessions')
        .select(`
          id,
          session_id,
          customer_id,
          designer_id,
          started_at,
          ended_at,
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
        .eq('status', 'ended')
        .order('ended_at', { ascending: false });

      if (liveSessionsError) {
        console.error('Error fetching live sessions:', liveSessionsError);
      }

      if (bookingsError) {
        console.error('Error fetching sessions:', bookingsError);
        setError('Failed to fetch session history');
        return;
      }

      // Transform bookings data
      const transformedBookings: SessionData[] = (bookingsData || []).map(booking => {
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
          durationMinutes: Math.max(0, Number(booking.duration_hours || 0) * 60),
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

      // Get payment data for live sessions to show real earnings
      const sessionIds = (liveSessionsData || []).map(session => session.session_id);
      let paymentData: any[] = [];
      
      if (sessionIds.length > 0) {
        const { data: payments } = await supabase
          .from('wallet_transactions')
          .select('metadata, amount')
          .eq('transaction_type', 'deposit')
          .eq('status', 'completed')
          .in('metadata->>session_id', sessionIds);
        
        paymentData = payments || [];
      }

      // Get reviews for sessions
      const { data: reviewsData } = await supabase
        .from('session_reviews')
        .select('session_id, rating, review_text')
        .in('session_id', sessionIds);

      // Transform live sessions data
      const transformedLiveSessions: SessionData[] = (liveSessionsData || []).map(session => {
        const profile = Array.isArray(session.profiles) ? session.profiles[0] : session.profiles;
        const clientName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown Client';
        
        // Calculate duration from started_at and ended_at
        const startTime = new Date(session.started_at);
        const endTime = new Date(session.ended_at);
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
        const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        // Find payment for this session
        const payment = paymentData.find(p => p.metadata?.session_id === session.session_id);
        const earnings = payment ? Number(payment.amount) : 0;

        // Find review for this session
        const review = (reviewsData || []).find(r => r.session_id === session.session_id);
        
        return {
          id: session.id,
          client: {
            name: clientName,
            avatar: profile?.avatar_url || '',
            email: profile?.email || 'No email'
          },
          project: 'Live Design Session',
          date: new Date(session.ended_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          duration: `${durationHours}h ${durationMinutes}m`,
          durationMinutes: Math.max(0, Math.round(durationMs / (1000 * 60))),
          type: 'Live Session',
          status: 'completed',
          earnings: earnings,
          rating: review?.rating,
          feedback: review?.review_text,
          hasRecording: false, // Live sessions don't have recordings
          hasNotes: true,
          tools: ['Screen Share', 'Voice Chat'], // Live session tools
          service: 'Live Design Session',
          description: 'Live design consultation session'
        };
      });

      // Combine both types of sessions
      const transformedSessions = [...transformedBookings, ...transformedLiveSessions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

  // Compute aggregate rating from session_reviews for this designer
  const [aggregateRating, setAggregateRating] = useState<number>(0);

  useEffect(() => {
    const fetchAggregate = async () => {
      if (!user?.id) return;
      try {
        const { data: designerRow } = await supabase
          .from('designers')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (!designerRow) { setAggregateRating(0); return; }

        const { data: designerSessions } = await supabase
          .from('active_sessions')
          .select('session_id')
          .eq('designer_id', designerRow.id);
        const sessionIds = (designerSessions || []).map(s => s.session_id);

        // Ratings via session linkage
        let ratings: number[] = [];
        if (sessionIds.length > 0) {
          const { data: ratingsData } = await supabase
            .from('session_reviews')
            .select('rating')
            .in('session_id', sessionIds);
          ratings = (ratingsData || []).map(r => Number((r as any).rating) || 0);
        }

        // Fallback: ratings matched by designer_name text
        let byNameRatings: number[] = [];
        const { data: nameRow } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single();
        const fullName = nameRow ? `${nameRow.first_name || ''} ${nameRow.last_name || ''}`.trim() : '';
        if (fullName) {
          const { data: nameReviews } = await supabase
            .from('session_reviews')
            .select('rating')
            .eq('designer_name', fullName);
          byNameRatings = (nameReviews || []).map(r => Number((r as any).rating) || 0);
        }

        const all = [...ratings, ...byNameRatings];
        if (all.length === 0) { setAggregateRating(0); return; }
        const avgRaw = all.reduce((a, b) => a + b, 0) / all.length;
        const avg = Math.round(avgRaw * 10) / 10;
        setAggregateRating(avg);
      } catch {
        setAggregateRating(0);
      }
    };
    fetchAggregate();
  }, [user?.id]);

  const stats = {
    totalSessions: sessions.length,
    totalHours: sessions.reduce((acc, session) => acc + (session.durationMinutes || 0), 0) / 60,
    avgRating: aggregateRating,
    totalEarnings: sessions.reduce((acc, session) => acc + (Number(session.earnings) || 0), 0)
  };

  return {
    sessions,
    stats,
    loading,
    error,
    refetch: fetchSessions
  };
};