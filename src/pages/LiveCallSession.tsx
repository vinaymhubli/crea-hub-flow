import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AgoraCall from '@/components/AgoraCall';
import { ScreenShareModal } from '@/components/ScreenShareModal';
import SessionSidePanel from '@/components/SessionSidePanel';
import { toast } from "sonner";

export default function LiveCallSession() {
  const { sessionId: sessionIdWithPrefix = '' } = useParams();
  const sessionId = sessionIdWithPrefix.startsWith('live_') ? sessionIdWithPrefix.slice(5) : sessionIdWithPrefix;
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const isDesigner = profile?.user_type === 'designer';

  const [showScreenShare, setShowScreenShare] = useState(false);
  const [designerName, setDesignerName] = useState<string>('Designer');
  const [customerName, setCustomerName] = useState<string>('Customer');
  const [bothJoined, setBothJoined] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(5.00); // Default rate like ScreenShare
  const [formatMultiplier, setFormatMultiplier] = useState(1);
  const [screenShareNotification, setScreenShareNotification] = useState<string | null>(null);
  const [customerBalance, setCustomerBalance] = useState(0);
  const [bookingData, setBookingData] = useState<{
    id: string;
    customer_id: string;
    customer: { first_name: string; last_name: string; id?: string; user_id?: string };
    designer: { hourly_rate: number; user: { first_name: string; last_name: string } };
  } | null>(null);

  // Broadcast helper
  const channel = useMemo(() => supabase.channel(`session_control_${sessionId}`), [sessionId]);

  useEffect(() => {
    const sub = channel
      .on('broadcast', { event: 'session_start' }, (payload) => {
        setIsPaused(false);
      })
      .on('broadcast', { event: 'session_pause' }, () => setIsPaused(true))
      .on('broadcast', { event: 'session_resume' }, () => setIsPaused(false))
      .on('broadcast', { event: 'pricing_change' }, (p) => setRate(p.payload.newRate))
      .on('broadcast', { event: 'multiplier_change' }, (p) => setFormatMultiplier(p.payload.newMultiplier))
      .on('broadcast', { event: 'timer_sync' }, (p) => {
        if (!isDesigner) setDuration(p.payload.duration);
      })
      .on('broadcast', { event: 'session_start' }, (payload) => {
        console.log('📡 Customer received session_start event');
        // Customer should start billing when session starts
        if (!isDesigner) {
          console.log('💰 Customer starting billing - rate:', rate);
        }
      })
      .on('broadcast', { event: 'screen_share_started' }, (p) => {
        setScreenShareNotification(`${p.payload.userName} started screen sharing`);
        setTimeout(() => setScreenShareNotification(null), 3000);
      })
      .on('broadcast', { event: 'screen_share_stopped' }, (p) => {
        setScreenShareNotification(`${p.payload.userName} stopped screen sharing`);
        setTimeout(() => setScreenShareNotification(null), 3000);
      })
      .on('broadcast', { event: 'session_end' }, (p) => {
        console.log('📡 Customer received session_end event:', p.payload);
        // Customer should redirect when designer ends session
        if (!isDesigner) {
          console.log('🔄 Customer redirecting due to session end by designer');
          navigate('/customer-dashboard');
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [channel, isDesigner]);

  // Timer - sync duration across both sides
  useEffect(() => {
    if (!bothJoined || isPaused) return;
    const t = setInterval(() => {
      setDuration(d => {
        const newDuration = d + 1;
        // Sync every second for exact ticking parity
        if (isDesigner) {
          channel.send({ 
            type: 'broadcast', 
            event: 'timer_sync', 
            payload: { duration: newDuration } 
          });
        }
        return newDuration;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [bothJoined, isPaused, isDesigner, channel]);

  // Stable profile values to prevent infinite re-renders
  const profileFirstName = profile?.first_name;
  const profileLastName = profile?.last_name;

  useEffect(() => {
    // Load names from profiles via active_sessions to display in panels
    const loadNames = async () => {
      const { data } = await supabase
        .from('active_sessions')
        .select('customer_id, designers(user_id), profiles!active_sessions_customer_id_fkey(first_name, last_name)')
        .eq('session_id', sessionId)
        .maybeSingle();
      if (data?.profiles) setCustomerName(`${data.profiles.first_name || ''} ${data.profiles.last_name || ''}`.trim() || 'Customer');
      // Designer name from current user
      if (profileFirstName || profileLastName) {
        setDesignerName(`${profileFirstName || ''} ${profileLastName || ''}`.trim() || 'Designer');
      }
    };
    if (sessionId) loadNames();
  }, [sessionId, profileFirstName, profileLastName]);

  // Load booking data - EXACT copy from ScreenShare
  const loadBookingData = async () => {
    try {
      // Get booking_id from active_sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('active_sessions')
        .select('booking_id')
        .eq('session_id', sessionId)
        .single();

      if (sessionError || !sessionData?.booking_id) {
        console.log('No booking_id found, loading current user data');
        loadCurrentUserData();
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!customer_id(first_name, last_name),
          designer:designers!designer_id(
            hourly_rate,
            user:profiles!user_id(first_name, last_name)
          )
        `)
        .eq('id', sessionData.booking_id)
        .single();

      if (error) throw error;

      setBookingData(data);
      if (data.designer?.hourly_rate) {
        setRate(data.designer.hourly_rate / 60); // Convert hourly to per minute
        console.log('💰 Loaded rate from booking:', data.designer.hourly_rate / 60, 'per minute');
      }
      setCustomerBalance(0);
    } catch (error) {
      console.error('Error loading booking data:', error);
      loadCurrentUserData();
    }
  };

  const loadCurrentUserData = async () => {
    try {
      if (isDesigner && user?.id) {
        const { data: designerData, error: designerError } = await supabase
          .from('designers')
          .select('hourly_rate')
          .eq('user_id', user.id)
          .single();

        if (!designerError && designerData?.hourly_rate) {
          setRate(designerData.hourly_rate / 60);
          console.log('💰 Loaded designer rate from user data:', designerData.hourly_rate / 60, 'per minute');
        }
      }
      setCustomerBalance(0);
    } catch (error) {
      console.error('Error loading current user data:', error);
    }
  };

  // Load booking data on mount
  useEffect(() => {
    if (sessionId) {
      loadBookingData();
    }
  }, [sessionId, isDesigner, user?.id]);

  const handleEndByDesigner = async () => {
    console.log('🛑 Ending session immediately...');
    
    // 1. IMMEDIATELY update database to end all related sessions - EXACT copy from ScreenShare
    try {
      console.log('🔄 Updating database - ending all sessions for this session...');
      
      // End active session in database
      const { error: activeSessionError } = await supabase
        .from('active_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (activeSessionError) {
        console.error('Error ending active session:', activeSessionError);
      } else {
        console.log('✅ Active session ended in database');
      }

      // End any related live session requests
      if (bookingData?.designer_id) {
        const { error: liveSessionError } = await supabase
          .from('live_session_requests')
          .update({
            status: 'rejected', // Using rejected as completed isn't allowed
            updated_at: new Date().toISOString()
          })
          .eq('designer_id', bookingData.designer_id)
          .eq('status', 'accepted');

        if (liveSessionError) {
          console.error('Error ending live session request:', liveSessionError);
        } else {
          console.log('✅ Live session request ended in database');
        }
      }

      // End any related bookings if this is a booking session
      if (bookingData?.id) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingData.id);

        if (bookingError) {
          console.error('Error ending booking:', bookingError);
        } else {
          console.log('✅ Booking ended in database');
        }
      }

    } catch (error) {
      console.error('Error in database cleanup:', error);
      // Continue with local cleanup even if database update fails
    }
    
    // 2. Auto-generate invoice if session has duration and no invoice exists
    if (duration > 0 && isDesigner) {
      console.log('🧾 Checking if invoice exists for session...');
      
      try {
        // Check if invoice already exists
        const { data: existingInvoices, error: invoiceCheckError } = await supabase
          .from('invoices')
          .select('id')
          .eq('session_id', sessionId);

        if (invoiceCheckError) {
          console.error('Error checking existing invoices:', invoiceCheckError);
        } else if (!existingInvoices || existingInvoices.length === 0) {
          console.log('🧾 No invoice found, auto-generating invoice...');
          
          // Auto-generate invoice
          const durationMinutes = Math.ceil(duration / 60);
          const ratePerMinute = rate || 5.00;
          const subtotal = durationMinutes * ratePerMinute * formatMultiplier;
          const gstAmount = subtotal * 0.18;
          const total = subtotal + gstAmount;

          const { error: invoiceError } = await supabase
            .from('invoices')
            .insert({
              session_id: sessionId,
              designer_name: designerName,
              customer_name: customerName,
              duration_minutes: durationMinutes,
              rate_per_minute: ratePerMinute,
              subtotal: subtotal,
              gst_amount: gstAmount,
              total_amount: total,
              invoice_date: new Date().toISOString(),
              status: 'generated'
            });

          if (invoiceError) {
            console.error('Error auto-generating invoice:', invoiceError);
          } else {
            console.log('✅ Auto-generated invoice for session');
          }
        } else {
          console.log('✅ Invoice already exists for this session');
        }
      } catch (invoiceError) {
        console.error('Error in invoice generation:', invoiceError);
      }
    }
    
    // 3. Broadcast session end to sync with other participants - EXACT copy from ScreenShare
    console.log('🛑 Broadcasting session_end event from handleEndByDesigner');
    channel.send({ 
      type: 'broadcast', 
      event: 'session_end', 
      payload: { 
        endedBy: isDesigner ? designerName : customerName,
        reason: 'Session ended by user'
      } 
    });
    
    // 4. Show success message and redirect both users
    toast.success('Session ended');
    console.log('🔄 Redirecting users...');
    navigate(isDesigner ? '/designer-dashboard' : '/customer-dashboard');
  };

  const handleLocalJoined = () => {
    // local joined
  };
  const handleRemoteJoined = () => {
    setBothJoined(true);
    // start session broadcast by designer only
    if (isDesigner) {
      channel.send({ type: 'broadcast', event: 'session_start', payload: { started_at: new Date().toISOString() } });
      // Also broadcast current rate to customer
      if (rate > 0) {
        channel.send({ 
          type: 'broadcast', 
          event: 'pricing_change', 
          payload: { 
            newRate: rate,
            changedBy: designerName
          } 
        });
        console.log('💰 Broadcasting initial rate to customer:', rate);
      }
    }
  };
  const handleRemoteLeft = () => {
    setBothJoined(false);
  };

  // Stable callback functions to prevent SessionSidePanel re-renders
  const handlePauseSession = useCallback(async () => {
    setIsPaused(true);
    if (isDesigner) {
      channel.send({ type: 'broadcast', event: 'session_pause', payload: {} });
    }
  }, [isDesigner, channel]);

  const handleResumeSession = useCallback(async () => {
    setIsPaused(false);
    if (isDesigner) {
      channel.send({ type: 'broadcast', event: 'session_resume', payload: {} });
    }
  }, [isDesigner, channel]);

  const handleScreenShareStarted = useCallback(() => {
    const userName = isDesigner ? designerName : customerName;
    channel.send({ 
      type: 'broadcast', 
      event: 'screen_share_started', 
      payload: { userName } 
    });
  }, [channel, isDesigner, designerName, customerName]);

  const handleScreenShareStopped = useCallback(() => {
    const userName = isDesigner ? designerName : customerName;
    channel.send({ 
      type: 'broadcast', 
      event: 'screen_share_stopped', 
      payload: { userName } 
    });
  }, [channel, isDesigner, designerName, customerName]);

  const handleRateChange = useCallback((newRate: number) => {
    console.log('💰 Rate changed to:', newRate);
    setRate(newRate);
    
    // Broadcast rate change to sync with customer - EXACT copy from ScreenShare
    channel.send({ 
      type: 'broadcast', 
      event: 'pricing_change', 
      payload: { 
        newRate: newRate,
        changedBy: isDesigner ? designerName : customerName
      } 
    });
  }, [channel, isDesigner, designerName, customerName]);

  const handleMultiplierChange = useCallback((newMultiplier: number) => {
    console.log('📊 Multiplier changed to:', newMultiplier);
    setFormatMultiplier(newMultiplier);
    
    // Broadcast multiplier change to sync with customer - EXACT copy from ScreenShare
    channel.send({ 
      type: 'broadcast', 
      event: 'multiplier_change', 
      payload: { 
        newMultiplier: newMultiplier,
        changedBy: isDesigner ? designerName : customerName
      } 
    });
  }, [channel, isDesigner, designerName, customerName]);

  // Critical debugging: Track component lifecycle and auth state
  const userId = user?.id;
  const userType = profile?.user_type;
  useEffect(() => {
    console.log('🔥 LiveCallSession MOUNTED:', { 
      sessionId, 
      userId, 
      isDesigner, 
      loading, 
      hasUser: !!user, 
      userType 
    });
  }, [sessionId, userId, isDesigner, loading, user, userType]);

  // Wait for auth to load before rendering
  if (loading) {
    console.log('⏳ LiveCallSession: Auth still loading...');
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-lg">Loading session...</div>
      </div>
    );
  }

  if (!user || !sessionId) {
    console.error('❌ LiveCallSession: Missing user or sessionId', { user: !!user, sessionId, loading });
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Error: Missing user or session ID</div>
      </div>
    );
  }

  // Component is ready to render with stable props

  return (
    <div className="w-full h-screen flex">
      {/* Screen Share Notification */}
      {screenShareNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          {screenShareNotification}
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top status bar with timer and pause/resume */}
        <div className="w-full flex items-center justify-end gap-3 px-3 py-2 border-b bg-white/80 backdrop-blur">
          <div className="text-sm font-medium tabular-nums">{Math.floor(duration/60)}:{(duration%60).toString().padStart(2,'0')}</div>
          {isDesigner && (
            isPaused ? (
              <button onClick={() => { setIsPaused(false); channel.send({ type:'broadcast', event:'session_resume', payload:{} }); }} className="px-3 py-1 text-xs rounded bg-emerald-600 text-white">Resume</button>
            ) : (
              <button onClick={() => { setIsPaused(true); channel.send({ type:'broadcast', event:'session_pause', payload:{} }); }} className="px-3 py-1 text-xs rounded bg-amber-600 text-white">Pause</button>
            )
          )}
        </div>
        <AgoraCall
          sessionId={sessionId}
          userId={user.id}
          isDesigner={!!isDesigner}
          onEndByDesigner={handleEndByDesigner}
          onLocalJoined={handleLocalJoined}
          onRemoteUserJoined={handleRemoteJoined}
          onRemoteUserLeft={handleRemoteLeft}
          onScreenShareStarted={handleScreenShareStarted}
          onScreenShareStopped={handleScreenShareStopped}
        />
        {/* Remove old screen share modal - using native Agora sharing */}
      </div>
      <div className="w-[380px] max-w-full border-l">
        <SessionSidePanel
          sessionId={sessionId}
          designerName={designerName}
          customerName={customerName}
          isDesigner={!!isDesigner}
          duration={duration}
          rate={rate}
          balance={customerBalance}
          onPauseSession={handlePauseSession}
          onResumeSession={handleResumeSession}
          isPaused={isPaused}
          userId={user.id}
          onRateChange={handleRateChange}
          onMultiplierChange={handleMultiplierChange}
          formatMultiplier={formatMultiplier}
        />
      </div>
    </div>
  );
}


