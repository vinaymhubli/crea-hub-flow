import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AgoraCall from '@/components/AgoraCall';
import { ScreenShareModal } from '@/components/ScreenShareModal';
import SessionSidePanel from '@/components/SessionSidePanel';

export default function LiveCallSession() {
  const { sessionId: sessionIdWithPrefix = '' } = useParams();
  const sessionId = sessionIdWithPrefix.startsWith('live_') ? sessionIdWithPrefix.slice(5) : sessionIdWithPrefix;
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isDesigner = profile?.user_type === 'designer';

  const [showScreenShare, setShowScreenShare] = useState(false);
  const [designerName, setDesignerName] = useState<string>('Designer');
  const [customerName, setCustomerName] = useState<string>('Customer');
  const [bothJoined, setBothJoined] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(0);
  const [formatMultiplier, setFormatMultiplier] = useState(1);

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
      if (profile) setDesignerName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Designer');
    };
    if (sessionId) loadNames();
  }, [sessionId, profile]);

  const handleEndByDesigner = async () => {
    // Mark active session ended and redirect
    await supabase.from('active_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('status', 'active');
    navigate(isDesigner ? '/designer-dashboard' : '/customer-dashboard');
  };

  const handleLocalJoined = () => {
    // local joined
  };
  const handleRemoteJoined = () => {
    setBothJoined(true);
    // start session broadcast by designer only
    if (isDesigner) channel.send({ type: 'broadcast', event: 'session_start', payload: { started_at: new Date().toISOString() } });
  };
  const handleRemoteLeft = () => {
    setBothJoined(false);
  };

  if (!user || !sessionId) return null;

  return (
    <div className="w-full h-screen flex">
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
          balance={0}
          onPauseSession={async () => { setIsPaused(true); if (isDesigner) channel.send({ type: 'broadcast', event: 'session_pause', payload: {} }); }}
          onResumeSession={async () => { setIsPaused(false); if (isDesigner) channel.send({ type: 'broadcast', event: 'session_resume', payload: {} }); }}
          isPaused={isPaused}
          userId={user.id}
        />
      </div>
    </div>
  );
}


