import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AgoraCall from "@/components/AgoraCall";
import SessionSidePanel from "@/components/SessionSidePanel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface DemoSessionData {
  id: string;
  session_id: string;
  status: string;
  meeting_link: string;
  scheduled_date: string;
  requester_name: string;
  requester_email: string;
}

export default function DemoSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDesigner, setIsDesigner] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [demoSession, setDemoSession] = useState<DemoSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [bothJoined, setBothJoined] = useState(false);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(50); // Demo rate
  const [formatMultiplier, setFormatMultiplier] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [screenShareNotification, setScreenShareNotification] = useState<string | null>(null);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);
  const [isMobileSidePanelOpen, setIsMobileSidePanelOpen] = useState(false);
  
  // Email for guest users
  const [guestEmail, setGuestEmail] = useState('');
  const [guestUserId, setGuestUserId] = useState('');
  
  // Demo-specific approval dialogs (formality only, no actual billing)
  const [showRateApprovalDialog, setShowRateApprovalDialog] = useState(false);
  const [showMultiplierApprovalDialog, setShowMultiplierApprovalDialog] = useState(false);
  const [pendingRateChange, setPendingRateChange] = useState<number | null>(null);
  const [pendingMultiplierChange, setPendingMultiplierChange] = useState<number | null>(null);
  const [pendingFileFormat, setPendingFileFormat] = useState<string>('');

  const agoraCallRef = useRef<any>(null);

  const channel = useMemo(
    () => supabase.channel(`demo_session_${sessionId}`),
    [sessionId]
  );

  // 30-minute timer (1800 seconds)
  const MAX_DURATION = 1800;

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

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        // Guest user = Customer
        setIsAdmin(false);
        setIsDesigner(false);
        setCheckingAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_admin', {
          user_uuid: user.id
        });

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          setIsDesigner(false);
        } else {
          const adminStatus = data === true;
          setIsAdmin(adminStatus);
          setIsDesigner(adminStatus); // Admin = Designer in demo session
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setIsDesigner(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    const loadDemoSession = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('demo_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .eq('status', 'approved')
          .single();

        if (error) {
          toast.error('Demo session not found or expired');
          navigate('/');
          return;
        }

        const sessionData = data as DemoSessionData;

        // Check if session is expired (more than 24 hours after scheduled date)
        const scheduledDate = new Date(sessionData.scheduled_date);
        const now = new Date();
        const hoursSinceScheduled = (now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60);

        if (hoursSinceScheduled > 24) {
          toast.error('This demo session has expired');
          navigate('/');
          return;
        }

        setDemoSession(sessionData);
      } catch (error) {
        console.error('Error loading demo session:', error);
        toast.error('Failed to load demo session');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadDemoSession();
  }, [sessionId, navigate]);

  // Subscribe to real-time events
  useEffect(() => {
    const sub = channel
      .on("broadcast", { event: "session_pause" }, () => setIsPaused(true))
      .on("broadcast", { event: "session_resume" }, () => setIsPaused(false))
      .on("broadcast", { event: "rate_change_request" }, (p) => {
        console.log("📡 Received rate change request:", p.payload);
        if (!isDesigner) {
          setPendingRateChange(p.payload.newRate);
          setShowRateApprovalDialog(true);
        }
      })
      .on("broadcast", { event: "multiplier_change_request" }, (p) => {
        console.log("📡 Received multiplier change request:", p.payload);
        if (!isDesigner) {
          setPendingMultiplierChange(p.payload.newMultiplier);
          setPendingFileFormat(p.payload.fileFormat || '');
          setShowMultiplierApprovalDialog(true);
        }
      })
      .on("broadcast", { event: "rate_change_approved" }, (p) => {
        console.log("📡 Rate change approved:", p.payload);
        setRate(p.payload.newRate);
        toast.success(`Rate changed to ₹${p.payload.newRate}/min (Demo only)`);
      })
      .on("broadcast", { event: "multiplier_change_approved" }, (p) => {
        console.log("📡 Multiplier change approved:", p.payload);
        setFormatMultiplier(p.payload.newMultiplier);
        toast.success(`Multiplier changed to ${p.payload.newMultiplier}x for ${p.payload.fileFormat} (Demo only)`);
      })
      .on("broadcast", { event: "screen_share_start" }, (p) => {
        setRemoteScreenSharing(true);
        setScreenShareNotification(`${p.payload.sharedBy} is sharing their screen`);
        setTimeout(() => setScreenShareNotification(null), 3000);
      })
      .on("broadcast", { event: "screen_share_stop" }, () => {
        setRemoteScreenSharing(false);
        setScreenShareNotification(null);
      })
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [channel, isDesigner]);

  // Timer that counts up (not paused by isPaused - just counts total session time)
  useEffect(() => {
    if (!joined) return; // Start timer when local user joins

    const interval = setInterval(() => {
      setDuration((prev) => {
        if (prev >= MAX_DURATION) {
          clearInterval(interval);
          handleEnd();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [joined]); // Changed from bothJoined to joined - start when YOU join

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
    console.log("✅ Local user joined demo session");
    setJoined(true);
  }, []);

  const handleRemoteUserJoined = useCallback((remoteUserId: string | number) => {
    console.log("✅ Remote user joined demo session:", remoteUserId);
    setBothJoined(true);
    toast.success("Participant joined the demo session!");
  }, []);

  const handleRemoteUserLeft = useCallback(async (remoteUserId: string | number) => {
    console.log("❌ Remote user left demo session:", remoteUserId);
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
      payload: {},
    });
  }, [channel]);

  const handleRemoteScreenShareStopped = useCallback(() => {
    console.log("📺 Remote screen share stopped");
    setRemoteScreenSharing(false);
    setScreenShareNotification(null);
  }, []);

  const handlePauseSession = useCallback(() => {
    setIsPaused(true);
    if (isDesigner) {
      channel.send({ type: "broadcast", event: "session_pause", payload: {} });
    }
  }, [isDesigner, channel]);

  const handleResumeSession = useCallback(() => {
    setIsPaused(false);
    if (isDesigner) {
      channel.send({ type: "broadcast", event: "session_resume", payload: {} });
    }
  }, [isDesigner, channel]);

  const handleRateChange = useCallback((newRate: number) => {
    console.log("💰 Designer requesting rate change to:", newRate);
    if (isDesigner) {
      // Send request to customer (formality only)
      channel.send({
        type: "broadcast",
        event: "rate_change_request",
        payload: { newRate }
      });
      toast.info("Rate change request sent (Demo only - no actual charges)");
    }
  }, [isDesigner, channel]);

  const handleMultiplierChange = useCallback((newMultiplier: number, fileFormat?: string) => {
    console.log("📊 Designer requesting multiplier change to:", newMultiplier, "for format:", fileFormat);
    if (isDesigner) {
      // Send request to customer (formality only)
      channel.send({
        type: "broadcast",
        event: "multiplier_change_request",
        payload: { newMultiplier, fileFormat }
      });
      toast.info("Multiplier change request sent (Demo only - no actual charges)");
    }
  }, [isDesigner, channel]);

  const approveRateChange = useCallback(() => {
    if (pendingRateChange !== null) {
      setRate(pendingRateChange);
      channel.send({
        type: "broadcast",
        event: "rate_change_approved",
        payload: { newRate: pendingRateChange }
      });
      toast.success(`Rate changed to ₹${pendingRateChange}/min (Demo only)`);
    }
    setShowRateApprovalDialog(false);
    setPendingRateChange(null);
  }, [pendingRateChange, channel]);

  const rejectRateChange = useCallback(() => {
    toast.info("Rate change request rejected");
    setShowRateApprovalDialog(false);
    setPendingRateChange(null);
  }, []);

  const approveMultiplierChange = useCallback(() => {
    if (pendingMultiplierChange !== null) {
      setFormatMultiplier(pendingMultiplierChange);
      channel.send({
        type: "broadcast",
        event: "multiplier_change_approved",
        payload: { newMultiplier: pendingMultiplierChange, fileFormat: pendingFileFormat }
      });
      toast.success(`Multiplier changed to ${pendingMultiplierChange}x (Demo only)`);
    }
    setShowMultiplierApprovalDialog(false);
    setPendingMultiplierChange(null);
    setPendingFileFormat('');
  }, [pendingMultiplierChange, pendingFileFormat, channel]);

  const rejectMultiplierChange = useCallback(() => {
    toast.info("Multiplier change request rejected");
    setShowMultiplierApprovalDialog(false);
    setPendingMultiplierChange(null);
    setPendingFileFormat('');
  }, []);

  if (loading || checkingAdmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-700">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // Generate a valid UUID v4 for guest users
  const generateGuestUUID = (email: string, sessionId: string) => {
    // Create a deterministic but unique UUID based on email + session
    const hash = btoa(email + sessionId).replace(/[^a-zA-Z0-9]/g, '');
    const uuid = [
      hash.substring(0, 8),
      hash.substring(8, 12),
      '4' + hash.substring(13, 16), // version 4
      ((parseInt(hash.substring(16, 18), 36) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.substring(18, 20),
      hash.substring(20, 32)
    ].join('-');
    return uuid;
  };

  const handleJoinSession = () => {
    // Check if guest user has entered email
    if (!user && !guestEmail.trim()) {
      toast.error('Please enter your email to join the demo session');
      return;
    }

    // Validate email format for guest users
    if (!user && guestEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestEmail)) {
        toast.error('Please enter a valid email address');
        return;
      }
      
      // Generate a valid UUID v4 for this guest user
      const guestId = generateGuestUUID(guestEmail, sessionId!);
      console.log('Generated guest UUID:', guestId);
      setGuestUserId(guestId);
    }

    setJoined(true);
  };

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-700 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <Badge className="bg-yellow-500 text-black font-bold text-lg px-6 py-2">
                FREE DEMO - NO BILLING
              </Badge>
              <h1 className="text-2xl font-bold">Join Demo Session</h1>
              <p className="text-gray-600">
                This is a 30-minute free demo session to experience our platform.
              </p>
              {isAdmin && (
                <Badge className="bg-blue-600 text-white px-3 py-1">
                  Joining as Designer (Admin)
                </Badge>
              )}
              {!isAdmin && user && (
                <Badge className="bg-green-600 text-white px-3 py-1">
                  Joining as Customer
                </Badge>
              )}
              {!user && (
                <Badge className="bg-purple-600 text-white px-3 py-1">
                  Joining as Guest Customer
                </Badge>
              )}
              <p className="text-sm text-gray-500">
                Session ID: {sessionId}
              </p>
            </div>

            {/* Email input for guest users */}
            {!user && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-500">
                  Required to join the demo session
                </p>
              </div>
            )}

            <Button
              onClick={handleJoinSession}
              className="w-full py-6 text-lg bg-green-600 hover:bg-green-700"
              size="lg"
            >
              Join Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format duration display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col bg-black relative">
      {/* FREE DEMO Banner */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <Badge className="bg-yellow-500 text-black font-bold text-sm px-4 py-2">
          FREE DEMO - NO BILLING | Time: {formatDuration(duration)} / 30:00
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
            sessionId={sessionId!} // Use the actual session ID directly
            userId={user?.id || guestUserId}
            isDesigner={isDesigner}
            onEndByDesigner={handleEnd}
            onLocalJoined={handleLocalJoined}
            onRemoteUserJoined={handleRemoteUserJoined}
            onRemoteUserLeft={handleRemoteUserLeft}
            onScreenShareStarted={handleScreenShareStart}
            onScreenShareStopped={handleScreenShareStop}
            onRemoteScreenShareStopped={handleRemoteScreenShareStopped}
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
          sessionId={sessionId!}
          designerName={isDesigner ? (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : "Admin Designer") : "Demo Designer"}
          customerName={!isDesigner ? (user ? (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : "Customer") : guestEmail) : "Demo Customer"}
          isDesigner={isDesigner}
          duration={duration}
          rate={rate}
          balance={9999999} // Unlimited balance for demo
          onPauseSession={handlePauseSession}
          onResumeSession={handleResumeSession}
          isPaused={isPaused}
          userId={user?.id || guestEmail} // Use guest email as identifier
          onRateChange={handleRateChange}
          onMultiplierChange={handleMultiplierChange}
          formatMultiplier={formatMultiplier}
          defaultTab="chat"
          mobileMode={isMobileSidePanelOpen}
          isDemo={true} // NEW: This is a demo session
        />
      </div>

      {isMobileSidePanelOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileSidePanelOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed bottom-4 right-4 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg"
        onClick={() => setIsMobileSidePanelOpen(true)}
      >
        <span className="sr-only">Open menu</span>
        ☰
      </button>

      {/* Rate Change Approval Dialog (Demo formality) */}
      <Dialog open={showRateApprovalDialog} onOpenChange={setShowRateApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Change Request (Demo)</DialogTitle>
            <DialogDescription>
              Designer wants to change the rate to ₹{pendingRateChange}/min
              <br />
              <span className="text-yellow-600 font-semibold">⚠️ This is just for demonstration - no actual charges will apply.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4">
            <Button onClick={approveRateChange} className="flex-1">
              Approve (Demo)
            </Button>
            <Button onClick={rejectRateChange} variant="outline" className="flex-1">
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Multiplier Change Approval Dialog (Demo formality) */}
      <Dialog open={showMultiplierApprovalDialog} onOpenChange={setShowMultiplierApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Multiplier Change Request (Demo)</DialogTitle>
            <DialogDescription>
              Designer wants to change the multiplier to {pendingMultiplierChange}x for {pendingFileFormat}
              <br />
              <span className="text-yellow-600 font-semibold">⚠️ This is just for demonstration - no actual charges will apply.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4">
            <Button onClick={approveMultiplierChange} className="flex-1">
              Approve (Demo)
            </Button>
            <Button onClick={rejectMultiplierChange} variant="outline" className="flex-1">
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
