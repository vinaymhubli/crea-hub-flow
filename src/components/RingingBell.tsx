import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RingingBellProps {
  className?: string;
  onClick?: () => void;
}

export function RingingBell({ className = "w-5 h-5 text-white/80", onClick }: RingingBellProps) {
  const { user, profile } = useAuth();
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;

    const checkPendingRequests = async () => {
      try {
        if (profile.user_type === 'designer') {
          // Check for pending live session requests for designers
          const { data, error } = await supabase
            .from('live_session_requests')
            .select('id, status')
            .eq('designer_id', profile.id)
            .eq('status', 'pending');

          if (error) {
            console.error('Error checking pending requests:', error);
            return;
          }

          setHasPendingRequests(data && data.length > 0);
        } else if (profile.user_type === 'client') {
          // Check for pending live session requests for customers
          const { data, error } = await supabase
            .from('live_session_requests')
            .select('id, status')
            .eq('customer_id', user.id)
            .eq('status', 'pending');

          if (error) {
            console.error('Error checking pending requests:', error);
            return;
          }

          setHasPendingRequests(data && data.length > 0);
        }
      } catch (error) {
        console.error('Error checking pending requests:', error);
      }
    };

    // Initial check
    checkPendingRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel(`ringing_bell_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_session_requests',
          filter: profile.user_type === 'designer' 
            ? `designer_id=eq.${profile.id}`
            : `customer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Live session request updated:', payload);
          checkPendingRequests();
          
          // Trigger ringing animation for new requests
          if (payload.eventType === 'INSERT' && payload.new?.status === 'pending') {
            setIsRinging(true);
            setTimeout(() => setIsRinging(false), 3000); // Stop ringing after 3 seconds
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  return (
    <div className="relative">
      <Bell 
        className={`${className} ${isRinging ? 'animate-bounce' : ''} ${hasPendingRequests ? 'text-yellow-400' : ''}`}
        onClick={onClick}
      />
      {hasPendingRequests && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}
