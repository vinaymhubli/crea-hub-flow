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
    const [bookingData, setBookingData] = useState<{
        id: string;
        customer: { first_name: string; last_name: string };
        designer: { hourly_rate: number; user: { first_name: string; last_name: string } };
    } | null>(null);
    const [designerRate, setDesignerRate] = useState(5.00);
    const [customerBalance, setCustomerBalance] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
    const [sessionControlChannel, setSessionControlChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);
    const [formatMultiplier, setFormatMultiplier] = useState(1);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const { user, profile } = useAuth();

    // Session persistence key
    const sessionKey = `session_${roomId}`;
    
    // Ref to track current session state for saving
    const sessionStateRef = useRef({
        sessionStartTime,
        isSessionLive,
        isPaused,
        sessionDuration
    });

    // Save session state to localStorage
    const saveSessionState = (ended = false) => {
        const state = sessionStateRef.current;
        if (state.sessionStartTime && state.isSessionLive) {
            const sessionState = {
                startTime: state.sessionStartTime.toISOString(),
                isLive: state.isSessionLive,
                isPaused: state.isPaused,
                duration: state.sessionDuration,
                ended: ended,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(sessionKey, JSON.stringify(sessionState));
            console.log('💾 Session state saved:', sessionState);
        }
    };

    // Restore session state from localStorage
    const restoreSessionState = () => {
        try {
            const savedState = localStorage.getItem(sessionKey);
            if (savedState) {
                const sessionState = JSON.parse(savedState);
                const startTime = new Date(sessionState.startTime);
                const lastUpdated = new Date(sessionState.lastUpdated);
                
                // Only restore if the session was active within the last 5 minutes
                const timeSinceLastUpdate = Date.now() - lastUpdated.getTime();
                if (timeSinceLastUpdate < 5 * 60 * 1000) { // 5 minutes
                    setSessionStartTime(startTime);
                    setIsSessionLive(sessionState.isLive);
                    setIsPaused(sessionState.isPaused);
                    setSessionDuration(sessionState.duration);
                    console.log('🔄 Session state restored:', sessionState);
                    console.log('🔄 Restored session - isLive:', sessionState.isLive, 'isPaused:', sessionState.isPaused, 'duration:', sessionState.duration);
                    return true;
                } else {
                    // Session is too old, clear it
                    localStorage.removeItem(sessionKey);
                    console.log('🗑️ Old session state cleared');
                }
            }
        } catch (error) {
            console.error('Error restoring session state:', error);
            localStorage.removeItem(sessionKey);
        }
        return false;
    };

    // Clear session state from localStorage
    const clearSessionState = () => {
        localStorage.removeItem(sessionKey);
        console.log('🗑️ Session state cleared');
    };

    // Update ref whenever session state changes
    useEffect(() => {
        sessionStateRef.current = {
            sessionStartTime,
            isSessionLive,
            isPaused,
            sessionDuration
        };
    }, [sessionStartTime, isSessionLive, isPaused, sessionDuration]);

    useEffect(() => {
        if (isOpen) {
            console.log("🎬 Opening ScreenShareModal for room:", roomId, "Host:", isHost);
            
            // Check if session was properly ended (not just paused)
            const savedState = localStorage.getItem(sessionKey);
            let wasRestored = false;
            
            if (savedState) {
                try {
                    const sessionState = JSON.parse(savedState);
                    // Only restore if session is still live and not ended
                    if (sessionState.isLive && !sessionState.ended) {
                        wasRestored = restoreSessionState();
                    } else {
                        // Clear old session data if it was ended
                        localStorage.removeItem(sessionKey);
                        console.log('🗑️ Cleared ended session state');
                    }
                } catch (error) {
                    console.error('Error parsing saved session state:', error);
                    localStorage.removeItem(sessionKey);
                }
            }
            
            const manager = new ScreenShareManager(roomId, isHost, (state) => {
                console.log("📡 Connection state changed to:", state);
                setConnectionState(state);
                setIsConnected(state === 'connected');
                
                // Request timer sync when customer connects (always, regardless of current state)
                if (state === 'connected' && !isHost) {
                    console.log('📡 Customer connected, requesting timer sync from designer');
                    
                    // Always request timer sync when customer connects
                    // This ensures sync even if customer missed initial session_start broadcast
                    setTimeout(() => {
                        broadcastSessionEvent('timer_sync_request', { 
                            customerJoined: true,
                            timestamp: new Date().toISOString(),
                            hasSessionStartTime: !!sessionStartTime
                        });
                    }, 1000); // Small delay to ensure channel is ready
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
                
                // Save session state before cleanup (only if session is still live)
                if (isSessionLive && !isPaused) {
                    saveSessionState();
                }
                
                manager.cleanup();
                setScreenShareManager(null);
                setIsSharing(false);
                setConnectionState('new');
                setIsConnected(false);
                setShowConnectionHint(false);
                
                // Don't reset session state - it's saved to localStorage
                // setIsSessionLive(false);
                // setIsPaused(false);
                // setSessionDuration(0);
                // setSessionStartTime(null);
                
                if (sessionControlChannel) {
                    supabase.removeChannel(sessionControlChannel);
                    setSessionControlChannel(null);
                }
            };
        }
    }, [isOpen, roomId, isHost, bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

    const setupSessionControlChannel = () => {
        console.log('📡 Setting up session control channel for room:', roomId);
        const channel = supabase
            .channel(`session_control_${roomId}`)
            .on('broadcast', { event: 'session_start' }, (payload) => {
                console.log('📡 Received session_start event:', payload.payload);
                if (payload.payload.customerJoined || payload.payload.hostStartedSharing) {
                    // Always sync the session start time, regardless of current state
                    const receivedStartTime = new Date(payload.payload.startTime);
                    setSessionStartTime(receivedStartTime);
                    setIsSessionLive(payload.payload.isActive !== false); // Default to true if not specified
                    setIsPaused(false);
                    
                    // If there's a currentDuration, use it; otherwise reset to 0
                    if (payload.payload.currentDuration !== undefined) {
                        setSessionDuration(payload.payload.currentDuration);
                        console.log('⏰ Customer timer synced with current duration:', payload.payload.currentDuration, 'seconds, requestType:', payload.payload.requestType);
                    } else {
                        setSessionDuration(0);
                        console.log('⏰ Customer timer synced -', payload.payload.customerJoined ? 'customer joined' : 'host started sharing', 'startTime:', receivedStartTime, 'requestType:', payload.payload.requestType);
                    }
                    
                    console.log('⏰ Customer timer state after sync - isSessionLive:', payload.payload.isActive, 'sessionStartTime:', receivedStartTime, 'sessionDuration:', payload.payload.currentDuration || 0);
                } else {
                    console.log('📡 Session start event received but not for customer join or host sharing, ignoring');
                }
            })
            .on('broadcast', { event: 'session_pause' }, (payload) => {
                console.log('📡 Received session_pause event:', payload.payload);
                setIsPaused(true);
                toast.success('Session paused by ' + payload.payload.pausedBy);
            })
            .on('broadcast', { event: 'session_resume' }, (payload) => {
                console.log('📡 Received session_resume event:', payload.payload);
                setIsPaused(false);
                toast.success('Session resumed by ' + payload.payload.resumedBy);
            })
            .on('broadcast', { event: 'session_end' }, (payload) => {
                console.log('🛑 Received session_end event:', payload.payload);
                console.log('🛑 Customer side - resetting session state');
                setIsSessionLive(false);
                setIsPaused(false);
                setSessionDuration(0);
                setSessionStartTime(null);
                clearSessionState();
                toast.success('Session ended by ' + payload.payload.endedBy);
                console.log('🛑 Customer side - session state reset complete');
            })
            .on('broadcast', { event: 'pricing_change' }, (payload) => {
                console.log('📡 Received pricing_change event:', payload.payload);
                setDesignerRate(payload.payload.newRate);
                toast.success(`Rate changed to $${payload.payload.newRate.toFixed(2)}/min by ${payload.payload.changedBy}`);
            })
            .on('broadcast', { event: 'multiplier_change' }, (payload) => {
                console.log('📡 Received multiplier_change event:', payload.payload);
                setFormatMultiplier(payload.payload.newMultiplier);
                toast.success(`Format multiplier changed to ${payload.payload.newMultiplier}x by ${payload.payload.changedBy}`);
            })
            .on('broadcast', { event: 'session_sync' }, (payload) => {
                console.log('📡 Received session_sync event:', payload.payload);
                // Sync the session duration from the sender
                if (payload.payload.duration !== undefined && sessionStartTime) {
                    const now = new Date();
                    const adjustedStartTime = new Date(now.getTime() - (payload.payload.duration * 1000));
                    setSessionStartTime(adjustedStartTime);
                    setSessionDuration(payload.payload.duration);
                    console.log('⏰ Session duration synced to:', payload.payload.duration, 'seconds');
                }
            })
            .on('broadcast', { event: 'timer_sync_request' }, (payload) => {
                console.log('📡 Received timer_sync_request event:', payload.payload);
                // Designer responds with current session state
                if (isHost) {
                    const now = new Date();
                    let currentDuration = 0;
                    
                    if (isSessionLive && sessionStartTime) {
                        currentDuration = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
                        console.log('📡 Designer responding to timer sync request with duration:', currentDuration, 'seconds');
                    } else {
                        console.log('📡 Designer responding to timer sync request - no active session (isSessionLive:', isSessionLive, 'sessionStartTime:', sessionStartTime);
                    }
                    
                    // Always respond to sync requests, even if no active session
                    const responsePayload = { 
                        startTime: sessionStartTime ? sessionStartTime.toISOString() : now.toISOString(),
                        customerJoined: true,
                        currentDuration: currentDuration,
                        isActive: isSessionLive,
                        requestType: payload.payload.isFallback ? 'fallback' : payload.payload.isModalOpen ? 'modal_open' : payload.payload.isBackup ? 'backup' : 'connection'
                    };
                    
                    console.log('📡 Designer sending session_start response:', responsePayload);
                    broadcastSessionEvent('session_start', responsePayload);
                } else {
                    console.log('📡 Timer sync request received but not host, ignoring');
                }
            })
            .subscribe();
        
        console.log('📡 Session control channel subscribed:', channel);
        setSessionControlChannel(channel);
    };

    const broadcastSessionEvent = async (event: string, payload: Record<string, unknown>) => {
        if (sessionControlChannel) {
            console.log('📡 Broadcasting event:', event, 'with payload:', payload);
            await sessionControlChannel.send({
                type: 'broadcast',
                event,
                payload
            });
            console.log('📡 Event broadcasted successfully');
        } else {
            console.error('📡 No session control channel available for broadcasting');
        }
    };

    const loadBookingData = async () => {
        try {
            if (!bookingId) return;

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
                .eq('id', bookingId)
                .single();

            if (error) throw error;

            setBookingData(data);
            if (data.designer?.hourly_rate) {
                setDesignerRate(data.designer.hourly_rate / 60); // Convert hourly to per minute
            }
            // Note: balance column doesn't exist in profiles table, using default value
            setCustomerBalance(0);
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
                .select('first_name, last_name')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            // Check if current user is a designer by looking in designers table
            const { data: designerData, error: designerError } = await supabase
                .from('designers')
                .select('hourly_rate')
                .eq('user_id', user.id)
                .single();

            if (!designerError && designerData?.hourly_rate) {
                setDesignerRate(designerData.hourly_rate / 60);
            }

            // Note: balance column doesn't exist in profiles table, using default value
            setCustomerBalance(0);

            console.log('Loaded current user data:', profile);
        } catch (error) {
            console.error('Error loading current user data:', error);
        }
    };

    // Session duration timer - synchronized across both sides
    useEffect(() => {
        console.log('⏰ Timer useEffect triggered - isSessionLive:', isSessionLive, 'isPaused:', isPaused, 'isOpen:', isOpen, 'sessionStartTime:', sessionStartTime);
        
        if (isSessionLive && !isPaused && isOpen && sessionStartTime) {
            console.log('⏰ Starting timer for session');
            const timer = setInterval(() => {
                const now = new Date();
                const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
                setSessionDuration(elapsed);
                
                // Broadcast session sync every 5 seconds to keep both sides in sync
                if (elapsed % 5 === 0 && elapsed > 0) {
                    broadcastSessionEvent('session_sync', { 
                        duration: elapsed,
                        timestamp: now.toISOString()
                    });
                }
                
                // Save session state every 10 seconds
                if (elapsed % 10 === 0) {
                    saveSessionState();
                }
            }, 1000);
            return () => {
                console.log('⏰ Clearing timer');
                clearInterval(timer);
            };
        } else {
            console.log('⏰ Timer not started - conditions not met');
        }
    }, [isSessionLive, isPaused, isOpen, sessionStartTime]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fallback timer sync for customers - request sync every 10 seconds if timer is not running
    useEffect(() => {
        if (!isHost && isConnected && isOpen && (!isSessionLive || !sessionStartTime)) {
            console.log('⏰ Customer timer not running, setting up fallback sync requests');
            
            const fallbackTimer = setInterval(() => {
                console.log('📡 Customer requesting timer sync (fallback)');
                broadcastSessionEvent('timer_sync_request', { 
                    customerJoined: true,
                    timestamp: new Date().toISOString(),
                    hasSessionStartTime: !!sessionStartTime,
                    isFallback: true
                });
            }, 10000); // Request sync every 10 seconds
            
            return () => {
                console.log('⏰ Clearing fallback timer sync');
                clearInterval(fallbackTimer);
            };
        }
    }, [isHost, isConnected, isOpen, isSessionLive, sessionStartTime]); // eslint-disable-line react-hooks/exhaustive-deps

    // Additional timer sync request when modal opens for customers
    useEffect(() => {
        if (!isHost && isOpen && sessionControlChannel) {
            console.log('📡 Customer modal opened, requesting immediate timer sync');
            
            // Request sync immediately when modal opens
            setTimeout(() => {
                broadcastSessionEvent('timer_sync_request', { 
                    customerJoined: true,
                    timestamp: new Date().toISOString(),
                    hasSessionStartTime: !!sessionStartTime,
                    isModalOpen: true
                });
            }, 2000); // 2 second delay to ensure channel is ready
            
            // Also request sync after 5 seconds as backup
            const backupTimer = setTimeout(() => {
                console.log('📡 Customer requesting backup timer sync');
                broadcastSessionEvent('timer_sync_request', { 
                    customerJoined: true,
                    timestamp: new Date().toISOString(),
                    hasSessionStartTime: !!sessionStartTime,
                    isBackup: true
                });
            }, 5000);
            
            return () => {
                clearTimeout(backupTimer);
            };
        }
    }, [isHost, isOpen, sessionControlChannel]); // eslint-disable-line react-hooks/exhaustive-deps

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
            
            // Start or resume session timer when host starts screen sharing
            if (isHost) {
                if (!sessionStartTime) {
                    // First time starting - start the session
                    const startTime = new Date();
                    setSessionStartTime(startTime);
                    setIsSessionLive(true);
                    setIsPaused(false);
                    setSessionDuration(0);
                    
                    console.log('🎬 Designer starting new session timer:', startTime);
                    
                    // Broadcast session start to sync timers (host started sharing)
                    broadcastSessionEvent('session_start', { 
                        startTime: startTime.toISOString(),
                        hostStartedSharing: true 
                    });
                } else if (isPaused) {
                    // Resume existing session
                    setIsPaused(false);
                    console.log('🎬 Designer resuming session timer');
                    broadcastSessionEvent('session_resume', { 
                        resumedBy: designerName,
                        reason: 'Screen sharing resumed'
                    });
                } else {
                    // Session is already live, just ensure it's not paused
                    setIsPaused(false);
                    console.log('🎬 Designer continuing live session');
                }
            }
            
            // Important: Call getDisplayMedia directly from the user gesture
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            });
            
            // Display the stream locally for the host
            if (isHost && localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.play().catch(console.error);
            }
            
            // Now pass the stream to the screen share manager
            await screenShareManager.startScreenShareWithStream(stream);
            toast.success('Screen sharing started');
        } catch (error: unknown) {
            console.error('Failed to start screen share:', error);
            setIsSharing(false);
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    toast.error('Screen sharing permission denied');
                } else if (error.name === 'NotSupportedError') {
                    toast.error('Screen sharing not supported in this browser');
                } else {
                    toast.error('Failed to start screen sharing');
                }
            } else {
                toast.error('Failed to start screen sharing');
            }
        }
    };

    const stopScreenShare = (shouldBroadcast = true) => {
        if (screenShareManager) {
            console.log("🛑 Stopping screen share...");
            screenShareManager.stopScreenShare();
            
            // Reset all screen sharing states
            setIsSharing(false);
            setConnectionState('new');
            setIsConnected(false);
            setShowConnectionHint(false);
            setIsRetrying(false);
            
            // Clear local video for host
            if (isHost && localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }
            
            // Clear remote video for customer
            if (!isHost && remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
            
            // Reset session timer and states when stopping screen share
            setIsSessionLive(false);
            setIsPaused(false);
            setSessionDuration(0);
            setSessionStartTime(null);
            
            // Save session state as ended before clearing
            saveSessionState(true);
            clearSessionState(); // Clear the persisted session state
            
            // Broadcast session end to sync with other participants (only if requested)
            if (shouldBroadcast) {
                console.log('🛑 Designer broadcasting session_end event from stopScreenShare');
                broadcastSessionEvent('session_end', { 
                    endedBy: isHost ? designerName : customerName,
                    reason: 'Screen sharing stopped'
                });
                toast.success('Screen sharing stopped - Session ended');
            } else {
                console.log('🛑 stopScreenShare called without broadcast (handled by caller)');
            }
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
        console.log('💰 Rate changed to:', newRate);
        setDesignerRate(newRate);
        
        // Broadcast rate change to sync with customer
        broadcastSessionEvent('pricing_change', { 
            newRate: newRate,
            changedBy: isHost ? designerName : customerName
        });
    };

    const handleMultiplierChange = (newMultiplier: number) => {
        console.log('📊 Multiplier changed to:', newMultiplier);
        setFormatMultiplier(newMultiplier);
        
        // Broadcast multiplier change to sync with customer
        broadcastSessionEvent('multiplier_change', { 
            newMultiplier: newMultiplier,
            changedBy: isHost ? designerName : customerName
        });
    };

    const handleEndSession = () => {
        console.log('🛑 Ending session...');
        
        // Stop screen sharing if active (without broadcasting, we'll do it ourselves)
        if (isSharing) {
            stopScreenShare(false);
        }
        
        // Reset all session states
        setIsSessionLive(false);
        setIsPaused(false);
        setSessionDuration(0);
        setSessionStartTime(null);
        
        // Save session state as ended before clearing
        saveSessionState(true);
        clearSessionState(); // Clear the persisted session state
        
        // Broadcast session end to sync with other participants
        console.log('🛑 Broadcasting session_end event from handleEndSession');
        broadcastSessionEvent('session_end', { 
            endedBy: isHost ? designerName : customerName,
            reason: 'Session ended by user'
        });
        
        toast.success('Session ended');
        handleClose();
    };

    const handleClose = () => {
        console.log('🛑 Closing modal...');
        
        // If session is live, end it properly
        if (isSessionLive) {
            console.log('🛑 Session is live, ending it before closing modal');
            
            // Stop screen sharing if active (without broadcasting, we'll do it ourselves)
            if (isSharing) {
                stopScreenShare(false);
            }
            
            // Reset all session states
            setIsSessionLive(false);
            setIsPaused(false);
            setSessionDuration(0);
            setSessionStartTime(null);
            
            // Save session state as ended before clearing
            saveSessionState(true);
            clearSessionState();
            
            // Broadcast session end to sync with other participants
            console.log('🛑 Broadcasting session_end event from handleClose');
            broadcastSessionEvent('session_end', { 
                endedBy: isHost ? designerName : customerName,
                reason: 'Modal closed by user'
            });
        } else if (isSharing) {
            // If not live but sharing, just stop sharing (with broadcast)
            stopScreenShare(true);
        }
        
        // Reset all other states
        setIsSharing(false);
        setConnectionState('new');
        setIsConnected(false);
        setShowConnectionHint(false);
        
        // Clear local video
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        
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
                <DialogContent className="max-w-[95vw] w-full h-[95vh] sm:max-w-[90vw] sm:h-[90vh] p-0 bg-gray-50 overflow-hidden flex flex-col">
                    {/* Header */}
                    <DialogHeader className="p-3 sm:p-4 border-b bg-white shrink-0">
                        <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                                {isHost ? <MonitorSpeaker className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> : <Monitor className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />}
                                <span className="text-sm sm:text-base truncate">{isHost ? 'Share Your Screen' : "Designer's Screen"}</span>
                                <div className="flex items-center space-x-2 ml-2 sm:ml-4 shrink-0">
                                    <div className={`w-2 h-2 rounded-full ${
                                        isConnected ? 'bg-green-500' :
                                        connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                                        'bg-red-500'
                                    }`} />
                                    <span className="text-xs sm:text-sm text-gray-600 capitalize">
                                        {isConnected ? 'Connected' : connectionState}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                                {isHost && (
                                    <Button
                                        onClick={isSharing ? () => stopScreenShare(true) : startScreenShare}
                                        variant={isSharing ? "destructive" : "default"}
                                        size="sm"
                                        disabled={!screenShareManager}
                                        className="w-full sm:w-auto text-xs sm:text-sm"
                                    >
                                        {isSharing ? (
                                            <>
                                                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                                <span className="hidden xs:inline">Stop Sharing</span>
                                                <span className="xs:hidden">Stop</span>
                                            </>
                                        ) : (
                                            <>
                                                <Monitor className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                                <span className="hidden xs:inline">Start Sharing</span>
                                                <span className="xs:hidden">Start</span>
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
                    <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
                        {/* Left Side - Screen Share Area */}
                        <div className="flex-1 flex flex-col min-h-0 overflow-x-hidden overflow-y-scroll">
                            {/* Session Controls */}
                            <div className="p-2 sm:p-4 shrink-0">
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
                            <div className="flex-1 p-2 sm:p-4 pt-0 min-h-0">
                                {isHost && !isSharing ? (
                                    <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 min-h-[300px] sm:min-h-[400px]">
                                        <div className="text-center p-4">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                                <Monitor className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                                            </div>
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Ready to Share</h3>
                                            <p className="text-sm sm:text-base text-gray-600 mb-4">
                                                Click "Start Sharing" to share your screen with {participantName}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full min-h-0">
                                        <div className="relative bg-gray-900 rounded-lg h-full min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
                                            {!isConnected ? (
                                                <div className="text-center text-white/70 p-4">
                                                    <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-white/20 border-t-white/70 rounded-full mx-auto mb-3 sm:mb-4"></div>
                                                    <p className="text-sm sm:text-base">Connecting to screen share...</p>
                                                    {showConnectionHint && (
                                                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-orange-900/30 border border-orange-500/30 rounded-lg">
                                                            <p className="text-xs sm:text-sm text-orange-200 mb-3">
                                                                Having trouble connecting? This might be due to network restrictions.
                                                            </p>
                                                            <Button
                                                                onClick={retryConnection}
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={isRetrying}
                                                                className="bg-orange-600 hover:bg-orange-700 border-orange-500 text-white disabled:opacity-50 text-xs sm:text-sm"
                                                            >
                                                                {isRetrying ? 'Retrying...' : 'Retry Connection'}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}

                                            {isHost && isSharing ? (
                                                <video
                                                    ref={localVideoRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className="w-full h-full object-contain rounded-lg"
                                                    style={{ background: '#000' }}
                                                />
                                            ) : (
                                                <video
                                                    ref={remoteVideoRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className="w-full h-full object-contain rounded-lg"
                                                    style={{ background: '#000' }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side - Session Panel */}
                        <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white overflow-hidden">
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
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
