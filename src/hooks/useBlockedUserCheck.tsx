import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';

export function useBlockedUserCheck() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkBlockedStatus = async () => {
      if (!user) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('blocked, blocked_reason')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking blocked status:', error);
          return;
        }

        if (profile?.blocked) {
          // User is blocked, sign them out
          await supabase.auth.signOut();
          
          toast({
            title: "Account Blocked",
            description: profile.blocked_reason || "Your account has been blocked by admin.",
            variant: "destructive",
          });

          // Redirect to home page
          navigate('/');
        }
      } catch (error) {
        console.error('Error in blocked user check:', error);
      }
    };

    // Check immediately when component mounts
    checkBlockedStatus();

    // Set up real-time subscription to listen for profile changes
    const channel = supabase
      .channel('blocked-user-check')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.new.blocked) {
            // User was just blocked, sign them out immediately
            supabase.auth.signOut().then(() => {
              toast({
                title: "Account Blocked",
                description: payload.new.blocked_reason || "Your account has been blocked by admin.",
                variant: "destructive",
              });
              navigate('/');
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, toast]);
}

