import { supabase } from '@/integrations/supabase/client';

/**
 * Clean up stale session data that might be causing availability issues
 */
export const cleanupStaleSessions = async () => {
  try {
    console.log('🧹 Starting session cleanup...');

    // 1. Clean up active sessions older than 6 hours
    const { data: staleActiveSessions, error: activeError } = await supabase
      .from('active_sessions')
      .update({ 
        status: 'ended', 
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('status', 'active')
      .lt('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .select();

    if (activeError) {
      console.warn('Error cleaning up active sessions:', activeError);
    } else {
      console.log('🗑️ Cleaned up', staleActiveSessions?.length || 0, 'stale active sessions');
    }

    // 2. Clean up accepted live session requests older than 30 minutes (more aggressive)
    // Note: Using 'completed' instead of 'expired' for compatibility
    const { data: staleLiveSessions, error: liveError } = await supabase
      .from('live_session_requests')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'accepted')
      .lt('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // 30 minutes instead of 2 hours
      .select();

    if (liveError) {
      console.warn('Error cleaning up live session requests:', liveError);
    } else {
      console.log('🗑️ Cleaned up', staleLiveSessions?.length || 0, 'stale live session requests');
    }

    // 3. Clean up in_progress bookings that are unreasonably old (12+ hours)
    const { data: staleBookings, error: bookingError } = await supabase
      .from('bookings')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'in_progress')
      .lt('scheduled_date', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
      .select();

    if (bookingError) {
      console.warn('Error cleaning up stale bookings:', bookingError);
    } else {
      console.log('🗑️ Cleaned up', staleBookings?.length || 0, 'stale bookings');
    }

    const totalCleaned = (staleActiveSessions?.length || 0) + 
                        (staleLiveSessions?.length || 0) + 
                        (staleBookings?.length || 0);

    console.log('✅ Session cleanup completed. Total records cleaned:', totalCleaned);
    
    return {
      success: true,
      cleaned: {
        activeSessions: staleActiveSessions?.length || 0,
        liveSessions: staleLiveSessions?.length || 0,
        bookings: staleBookings?.length || 0,
        total: totalCleaned
      }
    };

  } catch (error) {
    console.error('❌ Error during session cleanup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Check what stale sessions exist without cleaning them
 */
export const checkStaleSessionsCount = async () => {
  try {
    const cutoff6Hours = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const cutoff2Hours = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const cutoff12Hours = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

    // Count stale active sessions
    const { count: staleActiveCount } = await supabase
      .from('active_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lt('created_at', cutoff6Hours);

    // Count stale live session requests
    const { count: staleLiveCount } = await supabase
      .from('live_session_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .lt('created_at', cutoff2Hours);

    // Count stale bookings
    const { count: staleBookingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress')
      .lt('scheduled_date', cutoff12Hours);

    return {
      staleActiveSessions: staleActiveCount || 0,
      staleLiveSessions: staleLiveCount || 0,
      staleBookings: staleBookingCount || 0,
      total: (staleActiveCount || 0) + (staleLiveCount || 0) + (staleBookingCount || 0)
    };

  } catch (error) {
    console.error('Error checking stale sessions:', error);
    return null;
  }
};
