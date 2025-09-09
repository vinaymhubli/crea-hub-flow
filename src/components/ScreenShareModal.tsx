import { useState, useEffect, useRef } from 'react';
import { Monitor, MonitorSpeaker, X, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScreenShareManager } from '@/utils/ScreenShareWebRTC';
import { toast } from "sonner";
import SessionSidePanel from './SessionSidePanel';
import SessionControls from './SessionControls';
import LiveSessionTicker from './LiveSessionTicker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ScreenShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: string;
    isHost: boolean;
    participantName: string;
    designerName?: string;
    customerName?: string;
    bookingId?: string;
}

export function ScreenShareModal({
    isOpen,
    onClose,
    roomId,
    isHost,
    participantName,
    designerName,
    customerName,
    bookingId
}: ScreenShareModalProps) {
    const [screenShareManager, setScreenShareManager] = useState<ScreenShareManager | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [connectionState, setConnectionState] = useState<string>('new');
    const [isConnected, setIsConnected] = useState(false);
    const [showConnectionHint, setShowConnectionHint] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isSessionLive, setIsSessionLive] = useState(false);
    const [bookingData, setBookingData] = useState<any>(null);
    const [designerRate, setDesignerRate] = useState(5.00);
    const [customerBalance, setCustomerBalance] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
    const [sessionControlChannel, setSessionControlChannel] = useState<any>(null);
    const [formatMultiplier, setFormatMultiplier] = useState(1);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const { user, profile } = useAuth();

    useEffect(() => {
        if (isOpen) {
            console.log("🎬 Opening ScreenShareModal for room:", roomId, "Host:", isHost);
            const manager = new ScreenShareManager(roomId, isHost, (state) => {
                console.log("📡 Connection state changed to:", state);
                setConnectionState(state);
                setIsConnected(state === 'connected');
                
                // Only start session timer when customer connects (not host)
                if (state === 'connected' && !isHost && !sessionStartTime) {
                    const startTime = new Date();
                    setSessionStartTime(startTime);
                    setIsSessionLive(true);
                    
                    // Broadcast session start to sync timers (customer joined)
                    broadcastSessionEvent('session_start', { 
                        startTime: startTime.toISOString(),
                        customerJoined: true 
                    });
                }
            });

            setScreenShareManager(manager);
            
            // Set up session control channel for real-time sync
            setupSessionControlChannel();
            
            // Load booking data if available
            if (bookingId) {
                loadBookingData();
            }

            return () => {
                console.log("🧹 Cleaning up ScreenShareModal");
                manager.cleanup();
                setScreenShareManager(null);
                setIsSharing(false);
                setConnectionState('new');
                setIsConnected(false);
                setShowConnectionHint(false);
                setIsSessionLive(false);
                setIsPaused(false);
                setSessionDuration(0);
                setSessionStartTime(null);
                
                if (sessionControlChannel) {
                    supabase.removeChannel(sessionControlChannel);
                    setSessionControlChannel(null);
                }
            };
        }
    }, [isOpen, roomId, isHost, bookingId]);

    const setupSessionControlChannel = () => {
        const channel = supabase
            .channel(`session_control_${roomId}`)
            .on('broadcast', { event: 'session_start' }, (payload) => {
                if (!sessionStartTime && payload.payload.customerJoined) {
                    setSessionStartTime(new Date(payload.payload.startTime));
                    setIsSessionLive(true);
                    console.log('⏰ Session timer started - customer joined');
                }
            })
            .on('broadcast', { event: 'session_pause' }, (payload) => {
                setIsPaused(true);
                toast.success('Session paused by ' + payload.payload.pausedBy);
            })
            .on('broadcast', { event: 'session_resume' }, (payload) => {
                setIsPaused(false);
                toast.success('Session resumed by ' + payload.payload.resumedBy);
            })
            .on('broadcast', { event: 'pricing_change' }, (payload) => {
                setDesignerRate(payload.payload.newRate);
                toast.success(`Rate changed to $${payload.payload.newRate.toFixed(2)}/min by ${payload.payload.changedBy}`);
            })
            .on('broadcast', { event: 'multiplier_change' }, (payload) => {
                setFormatMultiplier(payload.payload.newMultiplier);
                toast.success(`Format multiplier changed to ${payload.payload.newMultiplier}x by ${payload.payload.changedBy}`);
            })
            .subscribe();
        
        setSessionControlChannel(channel);
    };

    const broadcastSessionEvent = async (event: string, payload: any) => {
        if (sessionControlChannel) {
            await sessionControlChannel.send({
                type: 'broadcast',
                event,
                payload
            });
        }
    };

    const loadBookingData = async () => {
        try {
            if (!bookingId) return;

            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    customer:profiles!customer_id(first_name, last_name, balance),
                    designer:designers!designer_id(
                        hourly_rate,
                        user:profiles!user_id(first_name, last_name)
                    )
                `)
                .eq('id', bookingId)
                .single();

            if (error) throw error;

            setBookingData(data);
            if (data.designer?.hourly_rate) {
                setDesignerRate(data.designer.hourly_rate / 60); // Convert hourly to per minute
            }
            if (data.customer?.balance) {
                setCustomerBalance(data.customer.balance);
            }
        } catch (error) {
            console.error('Error loading booking data:', error);
            // Fallback to get current user data if booking data fails
            loadCurrentUserData();
        }
    };

    const loadCurrentUserData = async () => {
        try {
            if (!user?.id) return;
            
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('first_name, last_name, balance, user_type')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            // If current user is a designer, get their rate
            if (profile.user_type === 'designer') {
                const { data: designerData, error: designerError } = await supabase
                    .from('designers')
                    .select('hourly_rate')
                    .eq('user_id', user.id)
                    .single();

                if (!designerError && designerData?.hourly_rate) {
                    setDesignerRate(designerData.hourly_rate / 60);
                }
            }

            if (profile.balance) {
                setCustomerBalance(profile.balance);
            }

            console.log('Loaded current user data:', profile);
        } catch (error) {
            console.error('Error loading current user data:', error);
        }
    };

    // Session duration timer - synchronized across both sides
    useEffect(() => {
        if (isSessionLive && !isPaused && isOpen && sessionStartTime) {
            const timer = setInterval(() => {
                const now = new Date();
                const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
                setSessionDuration(elapsed);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isSessionLive, isPaused, isOpen, sessionStartTime]);

    useEffect(() => {
        if (!isHost && screenShareManager && remoteVideoRef.current && isOpen) {
            console.log("📺 Video element ready, customer joining screen share...");
            screenShareManager.joinScreenShare(remoteVideoRef.current).catch(error => {
                console.error("Failed to join screen share:", error);
                toast.error("Failed to join screen share");
            });
        }
    }, [isHost, screenShareManager, isOpen]);

    useEffect(() => {
        if (!isHost && isOpen && !isConnected) {
            const timer = setTimeout(() => {
                setShowConnectionHint(true);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [isHost, isOpen, isConnected]);

    const startScreenShare = async () => {
        if (!screenShareManager) return;
        try {
            console.log("🎬 Starting screen share...");
            setIsSharing(true);
            
            // Important: Call getDisplayMedia directly from the user gesture
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            });
            
            // Now pass the stream to the screen share manager
            await screenShareManager.startScreenShareWithStream(stream);
            toast.success('Screen sharing started');
        } catch (error: any) {
            console.error('Failed to start screen share:', error);
            setIsSharing(false);
            if (error.name === 'NotAllowedError') {
                toast.error('Screen sharing permission denied');
            } else if (error.name === 'NotSupportedError') {
                toast.error('Screen sharing not supported in this browser');
            } else {
                toast.error('Failed to start screen sharing');
            }
        }
    };

    const stopScreenShare = () => {
        if (screenShareManager) {
            console.log("🛑 Stopping screen share...");
            screenShareManager.stopScreenShare();
            setIsSharing(false);
            toast.success('Screen sharing stopped');
        }
    };

    const retryConnection = async () => {
        if (!isHost && screenShareManager && remoteVideoRef.current && !isRetrying) {
            console.log('🔄 Retrying connection...');
            setIsRetrying(true);
            try {
                await screenShareManager.resetAndReconnect(remoteVideoRef.current);
                setShowConnectionHint(false);
            } catch (error) {
                console.error('Failed to retry connection:', error);
            } finally {
                setIsRetrying(false);
            }
        }
    };

    const handlePauseSession = async () => {
        setIsPaused(true);
        await broadcastSessionEvent('session_pause', { 
            pausedBy: isHost ? designerName : customerName 
        });
        toast.success('Session paused');
    };

    const handleResumeSession = async () => {
        setIsPaused(false);
        await broadcastSessionEvent('session_resume', { 
            resumedBy: isHost ? designerName : customerName 
        });
        toast.success('Session resumed');
    };

    const handleRateChange = (newRate: number) => {
        setDesignerRate(newRate);
    };

    const handleMultiplierChange = (newMultiplier: number) => {
        setFormatMultiplier(newMultiplier);
    };

    const handleEndSession = () => {
        if (isSharing) {
            stopScreenShare();
        }
        setIsSessionLive(false);
        setIsPaused(false);
        toast.success('Session ended');
        handleClose();
    };

    const handleClose = () => {
        if (isSharing) {
            stopScreenShare();
        }
        setIsSharing(false);
        setConnectionState('new');
        setIsConnected(false);
        setShowConnectionHint(false);
        setIsSessionLive(false);
        setIsPaused(false);
        setSessionDuration(0);
        onClose();
    };

    return (
        <>
            {/* Live Session Ticker */}
            <LiveSessionTicker
                isLive={isSessionLive && !isPaused}
                duration={sessionDuration}
                participantName={participantName}
                sessionId={roomId}
            />

            <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
                <DialogContent className="max-w-[90vw] w-full h-[90vh] p-0 bg-gray-50">
                    {/* Header */}
                    <DialogHeader className="p-4 border-b bg-white">
                        <DialogTitle className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                {isHost ? <MonitorSpeaker className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                <span>{isHost ? 'Share Your Screen' : "Designer's Screen"}</span>
                                <div className="flex items-center space-x-2 ml-4">
                                    <div className={`w-2 h-2 rounded-full ${
                                        isConnected ? 'bg-green-500' :
                                        connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                                        'bg-red-500'
                                    }`} />
                                    <span className="text-sm text-gray-600 capitalize">
                                        {isConnected ? 'Connected' : connectionState}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                {isHost && (
                                    <Button
                                        onClick={isSharing ? stopScreenShare : startScreenShare}
                                        variant={isSharing ? "destructive" : "default"}
                                        size="sm"
                                        disabled={!screenShareManager}
                                    >
                                        {isSharing ? (
                                            <>
                                                <X className="w-4 h-4 mr-2" />
                                                Stop Sharing
                                            </>
                                        ) : (
                                            <>
                                                <Monitor className="w-4 h-4 mr-2" />
                                                Start Sharing
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </DialogTitle>
                        <DialogDescription className="hidden">
                            {isHost ? 'Share your screen with the participant' : 'Viewing shared screen'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Main Content */}
                    <div className="flex flex-1 min-h-0">
                        {/* Left Side - Screen Share Area */}
                        <div className="flex-1 flex flex-col">
                            {/* Session Controls */}
                            <div className="p-4">
                                <SessionControls
                                    duration={sessionDuration}
                                    isPaused={isPaused}
                                    isLive={isSessionLive}
                                    participantName={participantName}
                                    onPause={handlePauseSession}
                                    onResume={handleResumeSession}
                                    onEnd={handleEndSession}
                                    sessionId={roomId}
                                />
                            </div>

                            {/* Screen Share Video */}
                            <div className="flex-1 p-4 pt-0">
                                {isHost && !isSharing ? (
                                    <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Monitor className="w-8 h-8 text-green-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Share</h3>
                                            <p className="text-gray-600 mb-4">
                                                Click "Start Sharing" to share your screen with {participantName}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full">
                                        <div className="relative bg-gray-900 rounded-lg h-full min-h-[400px] flex items-center justify-center">
                                            {!isConnected ? (
                                                <div className="text-center text-white/70">
                                                    <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full mx-auto mb-4"></div>
                                                    <p>Connecting to screen share...</p>
                                                    {showConnectionHint && (
                                                        <div className="mt-4 p-4 bg-orange-900/30 border border-orange-500/30 rounded-lg">
                                                            <p className="text-sm text-orange-200 mb-3">
                                                                Having trouble connecting? This might be due to network restrictions.
                                                            </p>
                                                            <Button
                                                                onClick={retryConnection}
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={isRetrying}
                                                                className="bg-orange-600 hover:bg-orange-700 border-orange-500 text-white disabled:opacity-50"
                                                            >
                                                                {isRetrying ? 'Retrying...' : 'Retry Connection'}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}

                                            <video
                                                ref={remoteVideoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full h-full object-contain"
                                                style={{ background: '#000' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side - Session Panel */}
                        <SessionSidePanel
                            sessionId={roomId}
                            designerName={
                                designerName || 
                                (bookingData?.designer?.user?.first_name && bookingData?.designer?.user?.last_name 
                                    ? `${bookingData.designer.user.first_name} ${bookingData.designer.user.last_name}`
                                    : profile?.user_type === 'designer' 
                                        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Designer'
                                        : 'Designer')
                            }
                            customerName={
                                customerName || 
                                (bookingData?.customer?.first_name && bookingData?.customer?.last_name 
                                    ? `${bookingData.customer.first_name} ${bookingData.customer.last_name}`
                                    : profile?.user_type === 'customer' 
                                        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Customer'
                                        : 'Customer')
                            }
                            isDesigner={isHost}
                            duration={sessionDuration}
                            rate={designerRate}
                            balance={customerBalance}
                            onPauseSession={handlePauseSession}
                            onResumeSession={handleResumeSession}
                            isPaused={isPaused}
                            bookingId={bookingId}
                            userId={user?.id}
                            onRateChange={handleRateChange}
                            onMultiplierChange={handleMultiplierChange}
                            formatMultiplier={formatMultiplier}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
