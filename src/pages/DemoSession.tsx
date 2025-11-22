import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AgoraCall from "@/components/AgoraCall";
import { ScreenShareModal } from "@/components/ScreenShareModal";
import SessionSidePanel from "@/components/SessionSidePanel";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';

interface DemoSessionData {
  id: string;
  session_id: string;
  requester_name: string;
  status: string;
  scheduled_date: string;
  duration_minutes: number;
  started_at: string | null;
  ended_at: string | null;
}

export default function DemoSession() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const isDesigner = profile?.user_type === "designer" || profile?.is_admin;

  const [showScreenShare, setShowScreenShare] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [bothJoined, setBothJoined] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(50); // Demo rate (not used for billing)
  const [formatMultiplier, setFormatMultiplier] = useState(1);
  const [screenShareNotification, setScreenShareNotification] = useState<string | null>(null);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);
  const agoraCallRef = useRef<any>(null);
  const [demoSession, setDemoSession] = useState<DemoSessionData | null>(null);
  const [isMobileSidePanelOpen, setIsMobileSidePanelOpen] = useState(false);

  // Broadcast helper
  const channel = useMemo(
    () => supabase.channel(`demo_session_control_${sessionId}`),
    [sessionId]
  );

  // Close mobile panel if viewport grows beyond lg breakpoint
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidePanelOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load session data on component mount
  useEffect(() => {
    if (sessionId) {
      fetchDemoSession();
    }
  }, [sessionId]);

  const fetchDemoSession = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('demo_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error('This demo session does not exist.');
        navigate('/');
        return;
      }

      if (data.status === 'expired' || data.status === 'completed') {
        toast.error('This demo session has already ended.');
        navigate('/');
        return;
      }

      if (data.status !== 'approved') {
        toast.error('This demo session is not yet approved.');
        navigate('/');
        return;
      }

      setDemoSession(data as DemoSessionData);
    } catch (err: any) {
      console.error('Error fetching demo session:', err);
      toast.error('Failed to load demo session');
      navigate('/');
    }
  };

  const joinSession = async () => {
    if (!participantName.trim()) {
      toast.error('Please enter your name to join');
      return;
    }

    try {
      // Record participant
      const { error } = await (supabase as any)
        .from('demo_session_participants')
        .insert({
          demo_session_id: demoSession?.id,
          participant_name: participantName,
          participant_type: 'guest'
        });

      if (error) throw error;

      // Update session start time if not already started
      if (!demoSession?.started_at) {
        await (supabase as any)
          .from('demo_sessions')
          .update({
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', demoSession?.id);
      }

      setHasJoined(true);
      toast.success('Joined successfully');
    } catch (err: any) {
      console.error('Error joining session:', err);
      toast.error('Failed to join session');
    }
  };

  useEffect(() => {
    const sub = channel
      .on("broadcast", { event: "session_pause" }, () => setIsPaused(true))
      .on("broadcast", { event: "session_resume" }, () => setIsPaused(false))
      .on("broadcast", { event: "pricing_change" }, (p) =>
        setRate(p.payload.newRate)
      )
      .on("broadcast", { event: "multiplier_change" }, (p) =>
        setFormatMultiplier(p.payload.newMultiplier)
      )
      .on("broadcast", { event: "timer_sync" }, (p) => {
        if (!isDesigner) setDuration(p.payload.duration);
      })
      .on("broadcast", { event: "screen_share_start" }, (p) => {
        console.log("📡 Screen share started by:", p.payload);
        setRemoteScreenSharing(true);
        setScreenShareNotification(
          `${isDesigner ? "Customer" : "Designer"} is sharing their screen`
        );
        setTimeout(() => setScreenShareNotification(null), 3000);
      })
      .on("broadcast", { event: "screen_share_stop" }, (p) => {
        console.log("📡 Screen share stopped by:", p.payload);
        setRemoteScreenSharing(false);
        setScreenShareNotification(
          `${isDesigner ? "Customer" : "Designer"} stopped sharing`
        );
        setTimeout(() => setScreenShareNotification(null), 3000);
      })
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [channel, isDesigner]);

  // Timer tick
  useEffect(() => {
    if (!isPaused && bothJoined) {
      const interval = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          // Auto-end after 30 minutes
          if (newDuration >= 1800) {
            handleEnd();
            return prev;
          }
          return newDuration;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPaused, bothJoined]);

  const handleEnd = useCallback(async () => {
    try {
      // Mark session as completed
      await (supabase as any)
        .from('demo_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', demoSession?.id);

      toast.success('Demo session ended');
      navigate('/');
    } catch (err) {
      console.error('Error ending session:', err);
      toast.error('Failed to end session');
    }
  }, [demoSession, navigate]);

  const handleLocalJoined = useCallback(() => {
    console.log("✅ Local user joined");
  }, []);

  const handleRemoteUserJoined = useCallback((remoteUserId: string | number) => {
    console.log("✅ Remote user joined:", remoteUserId);
    setBothJoined(true);
    toast.success("Participant joined");
  }, []);

  const handleRemoteUserLeft = useCallback(async (remoteUserId: string | number) => {
    console.log("❌ Remote user left:", remoteUserId);
    setBothJoined(false);
    toast.info("Participant disconnected - ending demo session");
    
    // End the demo session when someone disconnects
    setTimeout(() => {
      handleEnd();
    }, 2000); // Give 2 seconds to show the message
  }, [handleEnd]);

  const handleScreenShareStart = useCallback(() => {
    console.log("📺 Local screen share started");
    channel.send({
      type: "broadcast",
      event: "screen_share_start",
      payload: { sharedBy: isDesigner ? "Designer" : "Customer" },
    });
  }, [channel, isDesigner]);

  const handleScreenShareStop = useCallback(() => {
    console.log("📺 Local screen share stopped");
    channel.send({
      type: "broadcast",
      event: "screen_share_stop",
      payload: { stoppedBy: isDesigner ? "Designer" : "Customer" },
    });
  }, [channel, isDesigner]);

  const handleRemoteScreenShareStopped = useCallback(() => {
    console.log("📺 Remote screen share stopped");
    setRemoteScreenSharing(false);
  }, []);

  const handlePauseSession = useCallback(() => {
    setIsPaused(true);
    channel.send({
      type: "broadcast",
      event: "session_pause",
      payload: {},
    });
  }, [channel]);

  const handleResumeSession = useCallback(() => {
    setIsPaused(false);
    channel.send({
      type: "broadcast",
      event: "session_resume",
      payload: {},
    });
  }, [channel]);

  const handleRateChange = useCallback(
    (newRate: number) => {
      setRate(newRate);
      channel.send({
        type: "broadcast",
        event: "pricing_change",
        payload: { newRate },
      });
      toast.success(`Rate updated to ₹${newRate}/min (Demo only - no billing)`);
    },
    [channel]
  );

  const handleMultiplierChange = useCallback(
    (newMultiplier: number, fileFormat?: string) => {
      setFormatMultiplier(newMultiplier);
      channel.send({
        type: "broadcast",
        event: "multiplier_change",
        payload: { newMultiplier, fileFormat },
      });
      toast.success(`Multiplier updated to ${newMultiplier}x (Demo only - no billing)`);
    },
    [channel]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6" />
                <CardTitle>Join Demo Session</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Duration:</strong> 30 minutes
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Scheduled:</strong>{' '}
                  {demoSession?.scheduled_date
                    ? new Date(demoSession.scheduled_date).toLocaleString('en-IN')
                    : 'Not scheduled'}
                </p>
              </div>

              <Badge className="bg-yellow-500 text-black font-bold">
                FREE DEMO SESSION - NO BILLING
              </Badge>

              <div className="space-y-2">
                <Label htmlFor="participant_name">Your Name</Label>
                <Input
                  id="participant_name"
                  type="text"
                  placeholder="Enter your name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && joinSession()}
                />
              </div>

              <Button
                onClick={joinSession}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                Join Demo Session
              </Button>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-800 font-semibold">✅ 100% Free Demo</p>
                <p className="text-xs text-gray-600 mt-1">
                  No billing, no payment required. Experience all live session features for free.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black relative">
      {/* FREE DEMO Banner */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <Badge className="bg-yellow-500 text-black font-bold text-sm px-4 py-2">
          FREE DEMO - NO BILLING
        </Badge>
      </div>

      {screenShareNotification && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {screenShareNotification}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <div className={`flex-1 transition-all duration-300 ${isMobileSidePanelOpen ? '' : 'lg:mr-80'}`}>
          <AgoraCall
            ref={agoraCallRef}
            sessionId={`demo_${sessionId}`}
            userId={user?.id || `guest_${Date.now()}`}
            isDesigner={isDesigner}
            onEndByDesigner={handleEnd}
            onLocalJoined={handleLocalJoined}
            onRemoteUserJoined={handleRemoteUserJoined}
            onRemoteUserLeft={handleRemoteUserLeft}
            onOpenShare={() => setShowScreenShare(true)}
            onScreenShareStarted={handleScreenShareStart}
            onScreenShareStopped={handleScreenShareStop}
            onRemoteScreenShareStopped={handleRemoteScreenShareStopped}
            onSessionEnd={handleEnd}
            remoteScreenSharing={remoteScreenSharing}
            isPaused={isPaused}
            onPauseSession={handlePauseSession}
            onResumeSession={handleResumeSession}
            onRateChange={handleRateChange}
            onMultiplierChange={handleMultiplierChange}
            currentRate={rate}
          />
        </div>

        <SessionSidePanel
          sessionId={`demo_${sessionId}`}
          designerName={isDesigner ? participantName : "Designer"}
          customerName={!isDesigner ? participantName : "Customer"}
          isDesigner={isDesigner}
          rate={rate}
          duration={duration}
          balance={0}
          formatMultiplier={formatMultiplier}
          isPaused={isPaused}
          onPauseSession={handlePauseSession}
          onResumeSession={handleResumeSession}
          onRateChange={handleRateChange}
          onMultiplierChange={handleMultiplierChange}
          defaultTab="chat"
        />
      </div>

      <ScreenShareModal
        isOpen={showScreenShare}
        onClose={() => setShowScreenShare(false)}
        sessionId={`demo_${sessionId}`}
        onScreenShareStarted={handleScreenShareStart}
        onScreenShareStopped={handleScreenShareStop}
      />
    </div>
  );
}
