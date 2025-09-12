import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DesignerActivity {
  is_online: boolean;
  last_seen: string;
  is_in_schedule: boolean;
  activity_status: 'active' | 'idle' | 'offline';
}

export const useDesignerActivity = () => {
  const { user, profile } = useAuth();
  const [activity, setActivity] = useState<DesignerActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  // Heartbeat interval (every 30 seconds)
  const HEARTBEAT_INTERVAL = 30000;
  // Idle timeout (5 minutes)
  const IDLE_TIMEOUT = 300000;

  const updateActivity = async (status: 'active' | 'idle' | 'offline') => {
    if (!user?.id || profile?.user_type !== 'designer') return;

    // TEMPORARILY DISABLED TO STOP DATABASE OVERLOAD
    console.warn('⚠️ Activity updates temporarily disabled due to database issues');
    return;

    try {
      const now = new Date();
      lastActivityRef.current = now;

      const { error } = await supabase
        .from('designer_activity')
        .upsert({
          designer_id: user.id,
          last_seen: now.toISOString(),
          activity_status: status,
          is_online: status !== 'offline'
        }, {
          onConflict: 'designer_id'
        });

      if (error) {
        console.error('Error updating activity:', error);
      } else {
        setActivity(prev => ({
          ...prev,
          is_online: status !== 'offline',
          last_seen: now.toISOString(),
          activity_status: status
        }));
      }
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const startHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    heartbeatRef.current = setInterval(() => {
      const now = new Date();
      const timeSinceLastActivity = now.getTime() - lastActivityRef.current.getTime();
      
      if (timeSinceLastActivity > IDLE_TIMEOUT) {
        updateActivity('idle');
      } else {
        updateActivity('active');
      }
    }, HEARTBEAT_INTERVAL);
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    updateActivity('offline');
  };

  const trackUserActivity = () => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      lastActivityRef.current = new Date();
      updateActivity('active');
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  };

  const checkScheduleAvailability = async (designerId: string) => {
    try {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      // Check weekly schedule
      const { data: weeklySchedule, error: weeklyError } = await supabase
        .from('designer_weekly_schedule')
        .select('start_time, end_time')
        .eq('designer_id', designerId)
        .eq('day_of_week', parseInt(currentDay.toString()))
        .single();

      if (!weeklyError && weeklySchedule) {
        const isInSchedule = currentTime >= weeklySchedule.start_time && 
                            currentTime <= weeklySchedule.end_time;
        
        if (isInSchedule) {
          return true;
        }
      }

      // Check special days (overrides weekly schedule)
      const today = now.toISOString().split('T')[0];
      const { data: specialDay, error: specialError } = await supabase
        .from('designer_special_days')
        .select('start_time, end_time, is_available')
        .eq('designer_id', designerId)
        .eq('date', today)
        .single();

      if (!specialError && specialDay) {
        if (!specialDay.is_available) {
          return false; // Explicitly unavailable
        }
        
        const isInSpecialSchedule = currentTime >= specialDay.start_time && 
                                  currentTime <= specialDay.end_time;
        return isInSpecialSchedule;
      }

      return false;
    } catch (error) {
      console.error('Error checking schedule availability:', error);
      return false;
    }
  };

  const getCombinedOnlineStatus = async () => {
    if (!user?.id || profile?.user_type !== 'designer') return;

    try {
      // Get current activity status
      const { data: activityData, error: activityError } = await supabase
        .from('designer_activity')
        .select('*')
        .eq('designer_id', user.id)
        .single();

      // Check if in scheduled hours
      const isInSchedule = await checkScheduleAvailability(user.id);

      // Determine combined online status
      const isActive = activityData?.activity_status === 'active';
      const isIdle = activityData?.activity_status === 'idle';
      const isOnline = isActive || (isIdle && isInSchedule) || isInSchedule;

      setActivity({
        is_online: isOnline,
        last_seen: activityData?.last_seen || new Date().toISOString(),
        is_in_schedule: isInSchedule,
        activity_status: (activityData?.activity_status as "active" | "offline" | "idle") || 'offline'
      });

      // Update designers table with combined status
      const { error: updateError } = await supabase
        .from('designers')
        .update({ is_online: isOnline })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating designer online status:', updateError);
      }

    } catch (error) {
      console.error('Error getting combined online status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id || profile?.user_type !== 'designer') {
      setLoading(false);
      return;
    }

    getCombinedOnlineStatus();
    startHeartbeat();
    const cleanupActivity = trackUserActivity();

    return () => {
      stopHeartbeat();
      cleanupActivity();
    };
  }, [user?.id, profile?.user_type]);

  return {
    activity,
    loading,
    updateActivity,
    checkScheduleAvailability
  };
};
