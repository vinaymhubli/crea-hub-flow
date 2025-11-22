import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { flushSync } from "react-dom";
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Pause,
  Play,
  DollarSign,
  Clock,
  Percent,
} from "lucide-react";

type RemoteUser = {
  uid: string | number;
  videoTrack?: IRemoteVideoTrack | null;
  audioTrack?: IRemoteAudioTrack | null;
  hasVideo?: boolean;
  hasAudio?: boolean;
};

interface AgoraCallProps {
  sessionId: string;
  userId: string;
  isDesigner: boolean;
  onEndByDesigner: () => Promise<void> | void;
  onLocalJoined?: () => void;
  onRemoteUserJoined?: (remoteUserId: string | number) => void;
  onRemoteUserLeft?: (remoteUserId: string | number) => void;
  onOpenShare?: () => void;
  onScreenShareStarted?: () => void;
  onScreenShareStopped?: () => void;
  onRemoteScreenShareStopped?: () => void; // NEW: When remote user stops screen sharing
  onSessionEnd?: () => void;
  // New props for screen sharing control
  remoteScreenSharing?: boolean;
  onScreenShareRequest?: () => void;
  // Props for pause and rate functionality
  isPaused?: boolean;
  onPauseSession?: () => void;
  onResumeSession?: () => void;
  onRateChange?: (rate: number) => void;
  onMultiplierChange?: (multiplier: number, fileFormat?: string) => void;
  currentRate?: number;
}

// NOTE: We intentionally keep this component minimal and focused on A/V join/leave.
// Screen-sharing continues to be handled by the existing ScreenShareModal to avoid regressions.
const AgoraCall = forwardRef<any, AgoraCallProps>(
  (
    {
      sessionId,
      userId,
      isDesigner,
      onEndByDesigner,
      onLocalJoined,
      onRemoteUserJoined,
      onRemoteUserLeft,
      onOpenShare,
      onScreenShareStarted,
      onScreenShareStopped,
      onRemoteScreenShareStopped,
      onSessionEnd,
      remoteScreenSharing,
      onScreenShareRequest,
      isPaused,
      onPauseSession,
      onResumeSession,
      onRateChange,
      onMultiplierChange,
      currentRate,
    },
    ref
  ) => {
    const { toast } = useToast();
    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const [joined, setJoined] = useState(false);
    // NOTE: media persistence hooks moved below state declarations to avoid "uninitialized variable" errors


    // Critical debugging: Track component lifecycle
    useEffect(() => {
      console.log("🔥 AgoraCall MOUNTED:", { sessionId, userId, isDesigner });
      return () => {
        console.log("🔥 AgoraCall UNMOUNTING:", {
          sessionId,
          userId,
          isDesigner,
        });
        // Clean up client on unmount
        if (clientRef.current) {
          console.log("🧹 Cleaning up Agora client on unmount");
          try {
            // Stop screen sharing if active
            if (screenSharingRef.current && screenTrackRef.current) {
              console.log("🛑 Stopping screen share on unmount");
              try {
                clientRef.current.unpublish(screenTrackRef.current);
                screenTrackRef.current.close();
                screenTrackRef.current = null;
              } catch (screenError) {
                console.warn(
                  "❌ Error stopping screen share on unmount:",
                  screenError
                );
              }
            }

            // Force stop all media tracks
            if (localAudioTrackRef.current) {
              try {
                localAudioTrackRef.current.stop();
                localAudioTrackRef.current.close();
              } catch (error) {
                console.warn("❌ Error stopping audio on unmount:", error);
              }
            }
            if (localVideoTrackRef.current) {
              try {
                localVideoTrackRef.current.stop();
                localVideoTrackRef.current.close();
              } catch (error) {
                console.warn("❌ Error stopping video on unmount:", error);
              }
            }

            clientRef.current.leave();
            clientRef.current = null;
          } catch (e) {
            console.warn("❌ Error cleaning up Agora client:", e);
          }
        }
        
        // Reset all screen sharing states on unmount
        setScreenSharing(false);
        setIsStartingScreenShare(false);
        isStartingScreenShareRef.current = false;
        setRemoteScreenSharingState(false);
        setRemoteScreenSharingUser(null);
        setScreenShareBlocked(false);
        setFullscreenVideo(null);
      };
    }, [sessionId, userId, isDesigner]);
    const [localAudioTrack, setLocalAudioTrack] =
      useState<IMicrophoneAudioTrack | null>(null);
    const [localVideoTrack, setLocalVideoTrack] =
      useState<ICameraVideoTrack | null>(null);
    const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
    const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<Record<string, RemoteUser>>(
      {}
    );
    const [muted, setMuted] = useState(false);
    const [cameraOff, setCameraOff] = useState(false);
    const [screenSharing, setScreenSharing] = useState(false);
    const [remoteScreenSharingState, setRemoteScreenSharingState] =
      useState(false);
    const remoteScreenSharingStateRef = useRef(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const screenTrackRef = useRef<ILocalVideoTrack | null>(null);
    const screenSharingRef = useRef(false);
    // Additional state to track when screen share is being initiated (before window selection)
    const [isStartingScreenShare, setIsStartingScreenShare] = useState(false);
    const isStartingScreenShareRef = useRef(false);
    // Track which remote user is screen sharing
    const [remoteScreenSharingUser, setRemoteScreenSharingUser] = useState<
      string | number | null
    >(null);
    const remoteScreenSharingUserRef = useRef<string | number | null>(null);

    const remoteVideoPlayConfig = useMemo(
      () =>
        remoteScreenSharing || remoteScreenSharingState
          ? ({ fit: "contain" } as const)
          : undefined,
      [remoteScreenSharing, remoteScreenSharingState]
    );

    // Store original state before screen sharing
    const [originalVideoState, setOriginalVideoState] = useState<boolean>(true);
    const [originalAudioState, setOriginalAudioState] = useState<boolean>(true);
    const [screenShareBlocked, setScreenShareBlocked] =
      useState<boolean>(false);

    // Rate input state
    const [rateInput, setRateInput] = useState<string>("");
    const [showRateInput, setShowRateInput] = useState<boolean>(false);

    // Format multiplier approval state
    const [showFormatMultiplierDialog, setShowFormatMultiplierDialog] =
      useState<boolean>(false);
    const [formatMultiplierInput, setFormatMultiplierInput] =
      useState<string>("");
    const [fileFormatInput, setFileFormatInput] = useState<string>("");

    // State for fullscreen video selection
    const [fullscreenVideo, setFullscreenVideo] = useState<
      "local" | "remote" | "screen" | null
    >(null);

    // Persist mic/cam state across refresh within this session
    const mediaStateKey = useMemo(
      () => `live_media_${sessionId}_${userId}`,
      [sessionId, userId]
    );

    const stopScreenShareIfActive = useCallback(async () => {
      try {
        if (screenSharingRef.current && screenTrackRef.current && clientRef.current) {
          try { await clientRef.current.unpublish(screenTrackRef.current); } catch {}
          try { screenTrackRef.current.close(); } catch {}
          screenTrackRef.current = null;
          setScreenSharing(false);
          if (onScreenShareStopped) onScreenShareStopped();
        }
      } catch {}
    }, [onScreenShareStopped]);

    // Restore media state on mount; never auto-start screen share
    useEffect(() => {
      try {
        const raw = localStorage.getItem(mediaStateKey);
        if (raw) {
          const saved = JSON.parse(raw);
          if (typeof saved.muted === 'boolean') {
            setMuted(saved.muted);
          }
          if (typeof saved.cameraOff === 'boolean') {
            setCameraOff(saved.cameraOff);
          }
        }
      } catch {}
      // Only once on mount
      stopScreenShareIfActive();
      const onUnload = () => {
        try { localStorage.setItem(mediaStateKey, JSON.stringify({ muted, cameraOff })); } catch {}
      };
      window.addEventListener('beforeunload', onUnload);
      return () => window.removeEventListener('beforeunload', onUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      try { localStorage.setItem(mediaStateKey, JSON.stringify({ muted, cameraOff })); } catch {}
      // Apply to tracks if present (guard creation order)
      if (localAudioTrackRef.current) {
        try { localAudioTrackRef.current.setEnabled(!muted); } catch {}
      }
      if (localVideoTrackRef.current) {
        try { localVideoTrackRef.current.setEnabled(!cameraOff); } catch {}
      }
    }, [muted, cameraOff, mediaStateKey]);

    // Keep refs in sync with states
    useEffect(() => {
      screenSharingRef.current = screenSharing;
      console.log("🖥️ ScreenSharing state changed to:", screenSharing);
    }, [screenSharing]);

    useEffect(() => {
      remoteScreenSharingStateRef.current = remoteScreenSharingState;
      remoteScreenSharingUserRef.current = remoteScreenSharingUser;
    }, [remoteScreenSharingState, remoteScreenSharingUser]);

    // Handle remote screen sharing state changes
    useEffect(() => {
      console.log("🖥️ ===== REMOTE SCREEN SHARE STATE CHANGED =====");
      console.log("🖥️ remoteScreenSharing (prop):", remoteScreenSharing);
      console.log("🖥️ screenSharingRef.current (local sharing):", screenSharingRef.current);
      console.log("🖥️ Current screenShareBlocked:", screenShareBlocked);
      
      if (remoteScreenSharing && !screenSharingRef.current) {
        console.log(
          "🖥️ Remote user is screen sharing, blocking local screen share"
        );
        setScreenShareBlocked(true);
        setRemoteScreenSharingState(true);
        console.log("🖥️ Set screenShareBlocked to TRUE and remoteScreenSharingState to TRUE");
      } else if (!remoteScreenSharing) {
        console.log(
          "🖥️ Remote screen sharing stopped, allowing local screen share"
        );
        setScreenShareBlocked(false);
        setRemoteScreenSharingState(false);
        setRemoteScreenSharingUser(null);
        console.log("🖥️ Set screenShareBlocked to FALSE and remoteScreenSharingState to FALSE - button should be enabled now");
        
        // CRITICAL: Force re-check and play all remote videos after screen sharing stops
        // This ensures camera tracks that were published during the transition are played
        console.log("🎥 Forcing re-play of all remote videos after screen share stopped");
        setTimeout(() => {
          Object.values(remoteUsers).forEach(async (u) => {
            if (u.videoTrack && u.hasVideo) {
              const elementId = `remote-player-${u.uid}`;
              try {
                console.log(`🎥 Force re-playing video for user ${u.uid} after screen share stopped`);
                await u.videoTrack.play(elementId);
                console.log(`✅ Successfully playing video for user ${u.uid}`);
              } catch (e) {
                console.warn(`❌ Failed to play video for user ${u.uid}:`, e);
              }
            }
          });
        }, 500);
      }
    }, [remoteScreenSharing, screenShareBlocked, remoteUsers]);

    // Debug effect to track screenShareBlocked changes
    useEffect(() => {
      console.log("🔍 screenShareBlocked state changed to:", screenShareBlocked);
      console.log("🔍 Button should be:", screenShareBlocked ? "DISABLED" : "ENABLED");
    }, [screenShareBlocked]);


    // Debug effect to track screen sharing layout changes - simplified to avoid infinite loops
    useEffect(() => {
      console.log("🖥️ ===== SCREEN SHARING LAYOUT STATE =====");
      console.log("🖥️ screenSharing (local):", screenSharing);
      console.log("🖥️ remoteScreenSharingState:", remoteScreenSharingState);
      console.log("🖥️ remoteScreenSharingUser:", remoteScreenSharingUser);
      console.log("🖥️ remoteScreenSharing (prop):", remoteScreenSharing);
      console.log("🖥️ Layout condition:", screenSharing || remoteScreenSharingState);
      console.log("🖥️ Layout should be:", (screenSharing || remoteScreenSharingState) ? "SCREEN SHARING" : "NORMAL GRID");
    }, [screenSharing, remoteScreenSharingState, remoteScreenSharingUser, remoteScreenSharing]);

    // Force sync remote screen sharing state with prop
    useEffect(() => {
      console.log("🔄 Syncing remote screen sharing state with prop:", remoteScreenSharing);
      if (remoteScreenSharing !== remoteScreenSharingState) {
        console.log("🔄 State mismatch detected, updating remoteScreenSharingState to:", remoteScreenSharing);
        setRemoteScreenSharingState(remoteScreenSharing);
        if (!remoteScreenSharing) {
          setRemoteScreenSharingUser(null);
        } else {
          // If screen sharing is active, set the first remote user as the screen sharing user
          if (Object.keys(remoteUsers).length > 0) {
            const firstUser = Object.keys(remoteUsers)[0];
            setRemoteScreenSharingUser(firstUser);
          }
        }
      }
    }, [remoteScreenSharing, remoteScreenSharingState]);

    // Immediate screen sharing state sync - prioritize prop over detection
    useEffect(() => {
      console.log("🔄 IMMEDIATE SYNC: remoteScreenSharing prop:", remoteScreenSharing);
      if (remoteScreenSharing) {
        console.log("🔄 Screen sharing is active, setting state immediately");
        setRemoteScreenSharingState(true);
        if (Object.keys(remoteUsers).length > 0) {
          const firstUser = Object.keys(remoteUsers)[0];
          setRemoteScreenSharingUser(firstUser);
          console.log("🔄 Set screen sharing user to:", firstUser);
        }
      } else {
        console.log("🔄 Screen sharing is not active, clearing state");
        setRemoteScreenSharingState(false);
        setRemoteScreenSharingUser(null);
      }
    }, [remoteScreenSharing]);

    // Reset screen sharing states when session changes
    useEffect(() => {
      console.log("🔄 Session changed, resetting screen sharing states");
      setScreenSharing(false);
      setIsStartingScreenShare(false);
      isStartingScreenShareRef.current = false;
      setRemoteScreenSharingState(false);
      setRemoteScreenSharingUser(null);
      setScreenShareBlocked(false);
      setFullscreenVideo(null);
    }, [sessionId]);


    // Platform minimum per-minute rate
    const [minRate, setMinRate] = useState<number>(5.0);

    useEffect(() => {
      const loadMinRate = async () => {
        try {
          const { data, error } = await supabase.rpc('get_min_rate_per_minute');
          if (!error) {
            const value = Array.isArray(data) ? parseFloat((data as any)?.[0]) : parseFloat(data as any);
            if (!isNaN(value)) setMinRate(value);
          } else {
            const { data: rows } = await supabase
              .from('platform_settings')
              .select('min_rate_per_minute')
              .order('updated_at', { ascending: false })
              .limit(1);
            if (rows && rows.length > 0) {
              const v = parseFloat((rows as any)[0].min_rate_per_minute ?? 5.0);
              if (!isNaN(v)) setMinRate(v);
            }
          }
        } catch (_) {}
      };
      loadMinRate();
    }, []);

    // Handle rate change
    const handleRateSubmit = useCallback(() => {
      const newRate = parseFloat(rateInput);
      if (isNaN(newRate) || newRate <= 0) return;
      if (newRate < minRate) {
        toast({
          title: 'Below platform minimum',
          description: `You cannot set below ₹${minRate.toFixed(2)} / min`,
          variant: 'destructive'
        });
        return;
      }
      if (onRateChange) {
        onRateChange(newRate);
        setShowRateInput(false);
        setRateInput("");
      }
    }, [rateInput, onRateChange, minRate, toast]);

    const handleRateKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          handleRateSubmit();
        } else if (e.key === "Escape") {
          setShowRateInput(false);
          setRateInput("");
        }
      },
      [handleRateSubmit]
    );

    // Handle format multiplier approval request
    const handleFormatMultiplierRequest = useCallback(() => {
      setShowFormatMultiplierDialog(true);
    }, []);

  const handleFormatMultiplierSubmit = useCallback(() => {
    console.log("🎯 ===== FORMAT MULTIPLIER SUBMIT CLICKED =====");
    console.log("🎯 formatMultiplierInput:", formatMultiplierInput);
    console.log("🎯 fileFormatInput:", fileFormatInput);
    
    // Validate inputs
    if (!formatMultiplierInput.trim()) {
      console.error("❌ Multiplier is empty");
      alert("Please enter a format multiplier value (e.g., 1.5)");
      return;
    }
    
    if (!fileFormatInput.trim()) {
      console.error("❌ File format is empty");
      alert("Please enter a file format (e.g., .jpg, .psd, .ai)");
      return;
    }
    
    const newMultiplier = parseFloat(formatMultiplierInput);
    console.log("🎯 Parsed newMultiplier:", newMultiplier);
    
    if (isNaN(newMultiplier)) {
      console.error("❌ Multiplier is not a valid number");
      alert("Please enter a valid number for the multiplier");
      return;
    }
    
    if (newMultiplier <= 0) {
      console.error("❌ Multiplier must be greater than 0");
      alert("Multiplier must be greater than 0");
      return;
    }
    
    console.log("✅ Validation passed, calling onMultiplierChange");
    console.log("✅ onMultiplierChange exists:", !!onMultiplierChange);
    
    // Trigger parent callback to broadcast to customer (similar to rate change)
    if (onMultiplierChange) {
      console.log("✅ Calling onMultiplierChange with multiplier:", newMultiplier, "and format:", fileFormatInput.trim());
      onMultiplierChange(newMultiplier, fileFormatInput.trim());
      console.log("✅ onMultiplierChange called successfully");
    } else {
      console.error("❌ onMultiplierChange is not defined!");
    }
    
    setShowFormatMultiplierDialog(false);
    setFormatMultiplierInput("");
    setFileFormatInput("");
    console.log("✅ Dialog closed and inputs cleared");
  }, [formatMultiplierInput, fileFormatInput, onMultiplierChange]);

    // Close rate input when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (showRateInput) {
          const target = event.target as Element;
          if (!target.closest(".rate-input-container")) {
            setShowRateInput(false);
            setRateInput("");
          }
        }
      };

      if (showRateInput) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [showRateInput]);

    const tokenEndpoint = "/api/agora/token";

    const ensureClient = useCallback(() => {
      if (!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({
          mode: "rtc",
          codec: "vp8",
        });
      }
      return clientRef.current;
    }, []);

    const attachClientListeners = useCallback(
      (client: IAgoraRTCClient) => {
        client.on("user-published", async (user, mediaType) => {
          console.log(
            `📡 User published: ${user.uid}, mediaType: ${mediaType}, hasVideo: ${user.hasVideo}, hasAudio: ${user.hasAudio}`
          );
          await client.subscribe(user, mediaType);
          
          // Immediately try to play video after subscription
          if (mediaType === "video" && user.videoTrack) {
            console.log(`🎥 Immediately attempting to play video for user ${user.uid} after subscription`);
            
            // Detect if this is a screen share or regular camera
            const track = user.videoTrack.getMediaStreamTrack();
            const isScreenShare =
              track.label.includes("screen") ||
              track.label.includes("Screen") ||
              track.label.includes("window") ||
              track.label.includes("Window") ||
              track.label.includes("desktop") ||
              track.label.includes("Desktop") ||
              track.label.includes("Entire Screen") ||
              track.label.includes("entire screen") ||
              track.label.includes("Screen Capture") ||
              track.label.includes("screen capture");
            
            console.log(`🎥 Track type: ${isScreenShare ? 'SCREEN SHARE' : 'CAMERA'}, label: ${track.label}`);
            
            setTimeout(async () => {
              try {
                // Use fit: "contain" for screen shares, undefined for regular camera
                const playConfig = isScreenShare ? { fit: "contain" as const } : undefined;
                console.log(`🎥 Playing with config:`, playConfig);
                await user.videoTrack.play(`remote-player-${user.uid}`, playConfig);
                console.log(`✅ Immediate play successful for user ${user.uid}`);
              } catch (playError) {
                console.warn(`❌ Immediate play failed for user ${user.uid}:`, playError);
                // Retry after a delay
                setTimeout(async () => {
                  try {
                    const playConfig = isScreenShare ? { fit: "contain" as const } : undefined;
                    await user.videoTrack?.play(`remote-player-${user.uid}`, playConfig);
                    console.log(`✅ Retry play successful for user ${user.uid}`);
                  } catch (retryError) {
                    console.warn(`❌ Retry play failed for user ${user.uid}:`, retryError);
                  }
                }, 500);
              }
            }, 100);
          }
          
          setRemoteUsers((prev) => {
            const existing = prev[user.uid as any] || { uid: user.uid };
            if (mediaType === "video") {
              existing.videoTrack = user.videoTrack;
              existing.hasVideo = true;

              // Simple screen share detection - check if it's a screen track
              if (user.videoTrack) {
                const track = user.videoTrack.getMediaStreamTrack();
                console.log("🖥️ Remote video track details:", {
                  label: track.label,
                  kind: track.kind,
                  trackMediaType: user.videoTrack.trackMediaType,
                  enabled: track.enabled,
                  readyState: track.readyState,
                });

                // Enhanced screen share detection
                const isScreenShare =
                  track.label.includes("screen") ||
                  track.label.includes("Screen") ||
                  track.label.includes("window") ||
                  track.label.includes("Window") ||
                  track.label.includes("desktop") ||
                  track.label.includes("Desktop") ||
                  track.label.includes("Entire Screen") ||
                  track.label.includes("entire screen") ||
                  track.label.includes("Screen Capture") ||
                  track.label.includes("screen capture") ||
                  // Check trackMediaType as fallback (these might not be valid values, but keeping for compatibility)
                  (user.videoTrack.trackMediaType as any) === "screen" ||
                  (user.videoTrack.trackMediaType as any) === "screen-share";

                if (isScreenShare) {
                  console.log(
                    "🖥️ REMOTE SCREEN SHARING DETECTED - track label:",
                    track.label,
                    "trackMediaType:",
                    user.videoTrack.trackMediaType
                  );
                  setRemoteScreenSharingState(true);
                  setRemoteScreenSharingUser(user.uid);
                } else {
                  console.log(
                    "🖥️ Regular video track (NOT screen share) - track label:",
                    track.label,
                    "trackMediaType:",
                    user.videoTrack.trackMediaType
                  );
                  // Clear screen sharing state if this is a camera track replacing screen share
                  // Use refs to avoid stale closure values
                  if (remoteScreenSharingStateRef.current && remoteScreenSharingUserRef.current === user.uid) {
                    console.log("🖥️ ✅ Clearing screen sharing state - user switched to camera");
                    setRemoteScreenSharingState(false);
                    setRemoteScreenSharingUser(null);
                    setFullscreenVideo(null);
                    // Notify parent component that screen sharing stopped
                    if (onRemoteScreenShareStopped) {
                      console.log("🖥️ ✅ Calling onRemoteScreenShareStopped callback");
                      onRemoteScreenShareStopped();
                    }
                  }
                }
              }
            }
            if (mediaType === "audio") {
              existing.audioTrack = user.audioTrack;
              existing.hasAudio = true;
              user.audioTrack?.play();
            }
            console.log(`📡 Updated remote user ${user.uid}:`, existing);
            return { ...prev, [user.uid as any]: existing };
          });
          if (onRemoteUserJoined) onRemoteUserJoined(user.uid);
        });

        client.on("user-unpublished", (user, mediaType) => {
          console.log(
            `📡 User unpublished: ${user.uid}, mediaType: ${mediaType}`
          );
          setRemoteUsers((prev) => {
            const copy = { ...prev };
            const existing = copy[user.uid as any];
            if (!existing) return copy;
            if (mediaType === "video") {
              existing.videoTrack = null;
              existing.hasVideo = false;

              // ALWAYS clear screen sharing state when ANY remote user unpublishes video
              // This handles cases where remoteScreenSharingUser wasn't set correctly
              // Use ref to avoid stale closure values
              if (remoteScreenSharingStateRef.current) {
                console.log("🖥️ ✅ REMOTE SCREEN SHARING STOPPED - clearing all screen sharing state");
                console.log("🖥️ User who stopped:", user.uid);
                console.log("🖥️ Previously tracked user:", remoteScreenSharingUserRef.current);
                setRemoteScreenSharingState(false);
                setRemoteScreenSharingUser(null);
                setFullscreenVideo(null);
                
                // Call the remote screen share stopped callback
                if (onRemoteScreenShareStopped) {
                  console.log("🖥️ ✅ Calling onRemoteScreenShareStopped callback");
                  onRemoteScreenShareStopped();
                  console.log("🖥️ ✅ onRemoteScreenShareStopped callback completed");
                } else {
                  console.warn("🖥️ ❌ onRemoteScreenShareStopped callback not available");
                }
              } else {
                console.log("🖥️ ❌ No remote screen sharing active, no action needed");
              }
            }
            if (mediaType === "audio") {
              existing.audioTrack = null;
              existing.hasAudio = false;
            }
            copy[user.uid as any] = existing;
            return copy;
          });
        });

        client.on("user-left", (user) => {
          console.log(`📡 User left: ${user.uid}`);
          setRemoteUsers((prev) => {
            const copy = { ...prev };
            delete copy[user.uid as any];
            return copy;
          });
          
          // If the user who left was screen sharing, reset screen sharing state
          // Use ref to avoid stale closure values
          if (remoteScreenSharingUserRef.current === user.uid) {
            console.log(
              "🖥️ REMOTE SCREEN SHARING STOPPED - user left while screen sharing:",
              user.uid
            );
            setRemoteScreenSharingState(false);
            setRemoteScreenSharingUser(null);
            setFullscreenVideo(null);
            // Call the remote screen share stopped callback to broadcast the event
            if (onRemoteScreenShareStopped) onRemoteScreenShareStopped();
            
            // Force a small delay to ensure state updates are processed
            setTimeout(() => {
              console.log("🖥️ Screen sharing state reset completed after user left");
            }, 100);
          }
          
          if (onRemoteUserLeft) onRemoteUserLeft(user.uid);
        });
      },
      [onRemoteUserJoined, onRemoteUserLeft, onRemoteScreenShareStopped]
    );

    const join = useCallback(async () => {
      if (joined) {
        console.log("⚠️ Already joined, skipping join attempt");
        return;
      }

      try {
        console.log("🚀 Starting Agora join process for user:", userId);
        const client = ensureClient();

        // Attach listeners BEFORE join to catch already-published remote users
        attachClientListeners(client);

        // Fetch token
        console.log("🎫 Fetching Agora token...");
        const resp = await fetch(tokenEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: userId,
            channel: sessionId,
            asSharer: true,
          }),
        });

        if (!resp.ok) {
          const errorText = await resp.text();
          throw new Error(
            `Failed to get Agora token: ${resp.status} ${errorText}`
          );
        }

        const { appId, rtcToken } = await resp.json();

        // Join and publish local tracks
        console.log("🎯 Joining Agora channel:", {
          appId,
          sessionId,
          userId,
          tokenLength: rtcToken.length,
        });
        await client.join(appId, sessionId, rtcToken, String(userId));
        console.log("✅ Successfully joined Agora channel");

        console.log("🎤🎥 Creating local media tracks...");
        let mic, cam;
        try {
          mic = await AgoraRTC.createMicrophoneAudioTrack();
          console.log("✅ Created microphone track");
        } catch (micError) {
          console.error("❌ Failed to create microphone track:", micError);
          if (micError.code === "PERMISSION_DENIED") {
            console.error(
              "🚫 Microphone permission denied. Please allow microphone access in your browser."
            );
            setPermissionError(
              "Microphone permission denied. Please allow microphone access in your browser."
            );
          }
        }

        try {
          cam = await AgoraRTC.createCameraVideoTrack();
          console.log("✅ Created camera track");
        } catch (camError) {
          console.error("❌ Failed to create camera track:", camError);
          if (camError.code === "PERMISSION_DENIED") {
            console.error(
              "🚫 Camera permission denied. Please allow camera access in your browser."
            );
            setPermissionError(
              "Camera permission denied. Please allow camera access in your browser."
            );
          }
        }

        console.log("✅ Created local tracks:", { mic: !!mic, cam: !!cam });

        setLocalAudioTrack(mic);
        setLocalVideoTrack(cam);
        localAudioTrackRef.current = mic;
        localVideoTrackRef.current = cam;

        // Only publish tracks that were successfully created
        const tracksToPublish = [];
        if (mic) tracksToPublish.push(mic);
        if (cam) tracksToPublish.push(cam);

        if (tracksToPublish.length > 0) {
          console.log(
            "📡 Publishing local tracks to channel...",
            tracksToPublish.map((t) => t.trackMediaType)
          );
          await client.publish(tracksToPublish);
          console.log("✅ Published local tracks to channel");
        } else {
          console.warn("⚠️ No tracks to publish - permission issues detected");
        }

        // Force re-subscribe to already connected remote users
        console.log(
          "🔍 Checking for existing remote users:",
          client.remoteUsers.length
        );
        for (const ru of client.remoteUsers) {
          console.log(
            "🔍 Found remote user:",
            ru.uid,
            "hasVideo:",
            ru.hasVideo,
            "hasAudio:",
            ru.hasAudio
          );
          try {
            // Subscribe to each media type and manually trigger the user-published logic
            if (ru.hasVideo && ru.videoTrack) {
              await client.subscribe(ru, "video");
              console.log("✅ Re-subscribed to video for user:", ru.uid);
              // Manually trigger the same logic as user-published event
              setRemoteUsers((prev) => {
                const existing = prev[ru.uid as any] || { uid: ru.uid };
                existing.videoTrack = ru.videoTrack;
                existing.hasVideo = true;
                console.log(
                  `📡 Manually added remote user video ${ru.uid}:`,
                  existing
                );
                return { ...prev, [ru.uid as any]: existing };
              });
              if (onRemoteUserJoined) onRemoteUserJoined(ru.uid);
            }
            if (ru.hasAudio && ru.audioTrack) {
              await client.subscribe(ru, "audio");
              console.log("✅ Re-subscribed to audio for user:", ru.uid);
              // Manually trigger the same logic as user-published event
              setRemoteUsers((prev) => {
                const existing = prev[ru.uid as any] || { uid: ru.uid };
                existing.audioTrack = ru.audioTrack;
                existing.hasAudio = true;
                ru.audioTrack?.play();
                console.log(
                  `📡 Manually added remote user audio ${ru.uid}:`,
                  existing
                );
                return { ...prev, [ru.uid as any]: existing };
              });
            }
          } catch (e) {
            console.warn("❌ Resubscribe failed for user:", ru.uid, e);
          }
        }

        setJoined(true);
        console.log("🎉 Join process completed successfully!");
        if (onLocalJoined) onLocalJoined();
      } catch (error) {
        console.error("❌ Join process failed:", error);
        throw error;
      }
    }, [
      attachClientListeners,
      ensureClient,
      joined,
      sessionId,
      tokenEndpoint,
      userId,
    ]);

    const leave = useCallback(async () => {
      const client = clientRef.current;
      if (!client) return;
      try {
        console.log("🛑 AgoraCall: Starting media cleanup...");

        // Stop screen sharing first if active
        if (screenSharingRef.current && screenTrackRef.current) {
          console.log("🛑 Stopping screen share before leaving session");
          try {
            await client.unpublish(screenTrackRef.current);
            screenTrackRef.current.close();
            screenTrackRef.current = null;
            setScreenSharing(false);
            console.log("✅ Screen share stopped before leaving");
          } catch (screenError) {
            console.warn(
              "❌ Error stopping screen share before leave:",
              screenError
            );
          }
        }

        // Stop all local media tracks
        if (localAudioTrack) {
          console.log("🛑 Stopping microphone track");
          try {
            localAudioTrack.stop();
            localAudioTrack.close();
          } catch (error) {
            console.warn("❌ Error stopping microphone track:", error);
          }
        }
        if (localVideoTrack) {
          console.log("🛑 Stopping camera track");
          try {
            localVideoTrack.stop();
            localVideoTrack.close();
          } catch (error) {
            console.warn("❌ Error stopping camera track:", error);
          }
        }

        // Unpublish all tracks and leave channel
        await client.unpublish();
        await client.leave();

        console.log("✅ All media tracks stopped and left channel");
      } finally {
        setLocalAudioTrack(null);
        setLocalVideoTrack(null);
        localAudioTrackRef.current = null;
        localVideoTrackRef.current = null;
        setRemoteUsers({});
        setJoined(false);
        setScreenSharing(false);
        setIsStartingScreenShare(false);
        isStartingScreenShareRef.current = false;
        setRemoteScreenSharingState(false);
        setRemoteScreenSharingUser(null);
        setMuted(false);
        setCameraOff(false);
        screenTrackRef.current = null;
      }
    }, [localAudioTrack, localVideoTrack, screenSharing]);

    // Session end handler - called when session ends
    const handleSessionEnd = useCallback(async () => {
      console.log("🛑 AgoraCall: Session end triggered, stopping all media...");
      await leave();
      if (onSessionEnd) {
        onSessionEnd();
      }
    }, [leave, onSessionEnd]);

    // Expose functions via ref
    useImperativeHandle(
      ref,
      () => ({
        leave: handleSessionEnd,
        stopAllMedia: handleSessionEnd,
      }),
      [handleSessionEnd]
    );

    const toggleMic = useCallback(async () => {
      const client = clientRef.current;
      if (!client) return;

      try {
        if (muted) {
          // Turning mic ON
          console.log("🎤 Turning microphone ON...");
          
          // Check if we have a valid track
          if (!localAudioTrack || !localAudioTrackRef.current) {
            console.log("🎤 No valid audio track, creating new one...");
            
            // Create new microphone track
            try {
              const mic = await AgoraRTC.createMicrophoneAudioTrack();
              console.log("✅ Created new microphone track");
              
              setLocalAudioTrack(mic);
              localAudioTrackRef.current = mic;
              
              // Publish the new track
              await client.publish(mic);
              console.log("✅ Published new microphone track");
              
              setMuted(false);
            } catch (error) {
              console.error("❌ Failed to create/publish microphone track:", error);
              toast({
                title: "Microphone Error",
                description: "Failed to turn on microphone. Please check permissions.",
                variant: "destructive",
              });
              return;
            }
          } else {
            // Track exists, just enable it
            console.log("🎤 Enabling existing microphone track...");
            await localAudioTrack.setEnabled(true);
            setMuted(false);
            console.log("✅ Microphone enabled");
          }
        } else {
          // Turning mic OFF
          console.log("🎤 Turning microphone OFF...");
          if (localAudioTrack) {
            await localAudioTrack.setEnabled(false);
            setMuted(true);
            console.log("✅ Microphone disabled");
          }
        }
      } catch (error) {
        console.error("❌ Error toggling microphone:", error);
        toast({
          title: "Microphone Error",
          description: "Failed to toggle microphone. Please try again.",
          variant: "destructive",
        });
      }
    }, [muted, localAudioTrack, toast]);

    const toggleCamera = useCallback(async () => {
      const client = clientRef.current;
      if (!client) return;

      try {
        if (cameraOff) {
          // Turning camera ON
          console.log("📹 Turning camera ON...");
          
          // Check if we have a valid track
          if (!localVideoTrack || !localVideoTrackRef.current) {
            console.log("📹 No valid video track, creating new one...");
            
            // Create new camera track
            try {
              const cam = await AgoraRTC.createCameraVideoTrack();
              console.log("✅ Created new camera track");
              
              setLocalVideoTrack(cam);
              localVideoTrackRef.current = cam;
              
              // Publish the new track
              await client.publish(cam);
              console.log("✅ Published new camera track");
              
              // IMPORTANT: Play the new camera track in the local video container
              console.log("📹 Playing new camera track in local-player");
              try {
                await cam.play("local-player");
                console.log("✅ New camera track playing successfully");
              } catch (playError) {
                console.warn("❌ Failed to play new camera track:", playError);
                // Retry after a delay
                setTimeout(async () => {
                  try {
                    await cam.play("local-player");
                    console.log("✅ Retry play successful for new camera track");
                  } catch (retryError) {
                    console.warn("❌ Retry play failed for new camera track:", retryError);
                  }
                }, 500);
              }
              
              setCameraOff(false);
            } catch (error) {
              console.error("❌ Failed to create/publish camera track:", error);
              toast({
                title: "Camera Error",
                description: "Failed to turn on camera. Please check permissions.",
                variant: "destructive",
              });
              return;
            }
          } else {
            // Track exists, just enable it
            console.log("📹 Enabling existing camera track...");
            await localVideoTrack.setEnabled(true);
            
            // IMPORTANT: Play the track to ensure it displays
            console.log("📹 Playing enabled camera track in local-player");
            try {
              await localVideoTrack.play("local-player");
              console.log("✅ Enabled camera track playing successfully");
            } catch (playError) {
              console.warn("❌ Failed to play enabled camera track:", playError);
              // Retry after a delay
              setTimeout(async () => {
                try {
                  await localVideoTrack.play("local-player");
                  console.log("✅ Retry play successful for enabled camera track");
                } catch (retryError) {
                  console.warn("❌ Retry play failed for enabled camera track:", retryError);
                }
              }, 500);
            }
            
            setCameraOff(false);
            console.log("✅ Camera enabled");
          }
        } else {
          // Turning camera OFF
          console.log("📹 Turning camera OFF...");
          if (localVideoTrack) {
            await localVideoTrack.setEnabled(false);
            setCameraOff(true);
            console.log("✅ Camera disabled");
          }
        }
      } catch (error) {
        console.error("❌ Error toggling camera:", error);
        toast({
          title: "Camera Error",
          description: "Failed to toggle camera. Please try again.",
          variant: "destructive",
        });
      }
    }, [cameraOff, localVideoTrack, toast]);

    const toggleScreenShare = useCallback(async () => {
      console.log("🖥️ ===== SCREEN SHARE BUTTON CLICKED =====");
      console.log("🖥️ Current screenSharing:", screenSharing, "screenSharingRef:", screenSharingRef.current);
      console.log("🖥️ Remote screen sharing:", remoteScreenSharing);

      const client = clientRef.current;
      if (!client || !joined) {
        console.log("❌ Cannot start screen share: client not ready or not joined");
        return;
      }

      // Check if someone else is already screen sharing
      if (!screenSharingRef.current && remoteScreenSharing) {
        console.log("🚫 Screen share blocked: Remote user is already sharing");
        setScreenShareBlocked(true);
        if (onScreenShareRequest) {
          onScreenShareRequest();
        }
        return;
      }

      console.log(
        "🖥️ Toggle screen share clicked, current state:",
        screenSharing
      );

      try {
        if (!screenSharingRef.current) {
          console.log("🖥️ Starting screen share...");

          // Store original video and audio state before starting screen share
          setOriginalVideoState(!cameraOff);
          setOriginalAudioState(muted);
          console.log(
            "📹 Stored original state - Video:",
            !cameraOff,
            "Audio:",
            !muted
          );

          // Use flushSync to force immediate synchronous state update
          // Set all states and refs to true to hide buttons immediately
          console.log("🖥️ Setting all screen sharing states to true with flushSync...");
          flushSync(() => {
            setScreenSharing(true);
            setIsStartingScreenShare(true);
          });
          screenSharingRef.current = true;
          isStartingScreenShareRef.current = true;
          console.log("✅ All states updated - buttons should be hidden NOW");

          // Create screen track
          // Note: Browser will show native picker - user can select screen, window, or tab
          // Our refs are already set to hide buttons immediately, regardless of selection
          console.log("🖥️ Creating screen video track...");
          let screenTrack;
          try {
            screenTrack = await AgoraRTC.createScreenVideoTrack(
              {
                encoderConfig: "720p_1",
                optimizationMode: "detail",
              },
              "disable" // No audio from screen share
            );
            console.log("✅ Screen track created successfully:", screenTrack);
          } catch (screenTrackError) {
            console.error(
              "❌ Failed to create screen track:",
              screenTrackError
            );
            // Reset ALL states and refs if track creation fails or user cancels
            console.log("🛑 Resetting all screen sharing states due to error");
            flushSync(() => {
              setScreenSharing(false);
              setIsStartingScreenShare(false);
            });
            screenSharingRef.current = false;
            isStartingScreenShareRef.current = false;
            console.log("✅ All states and refs cleared after error");
            throw screenTrackError;
          }

          console.log("✅ Screen track created, replacing camera track...");
          screenTrackRef.current = screenTrack;

          // Unpublish camera track and publish screen track
          if (localVideoTrack) {
            console.log(
              "📹 Unpublishing camera track and publishing screen track"
            );
            await client.unpublish(localVideoTrack);
          }

          console.log("📹 Publishing screen track");
          await client.publish(screenTrack);

          console.log("✅ Screen sharing started successfully!");

          // Notify that screen sharing started
          if (onScreenShareStarted) {
            onScreenShareStarted();
          }

          // Play the screen track immediately
          try {
            await screenTrack.play("local-player", { fit: "contain" });
            console.log("✅ Screen track playing immediately");
          } catch (playError) {
            console.warn("❌ Immediate screen play failed:", playError);
            // Retry after a short delay
            setTimeout(async () => {
              try {
                await screenTrack.play("local-player", { fit: "contain" });
                console.log("✅ Screen track playing after retry");
              } catch (retryError) {
                console.warn("❌ Screen track retry failed:", retryError);
              }
            }, 500);
          }

          // Handle user clicking "Stop Sharing" in browser bar
          screenTrack.on("track-ended", () => {
            console.log("🛑 Screen share ended by user via browser stop button");
            toggleScreenShare();
          });
        } else {
          console.log("🛑 Stopping screen share...");

          // Stop screen sharing - switch back to camera
          if (screenTrackRef.current) {
            console.log("📹 Unpublishing screen track");
            await client.unpublish(screenTrackRef.current);
            screenTrackRef.current.close();
            screenTrackRef.current = null;
          }

          // First ensure all screen sharing states are cleared
          setRemoteScreenSharingState(false);
          setRemoteScreenSharingUser(null);
          
          // IMPORTANT: Create a fresh camera track if needed
          let cameraTrack = localVideoTrack;
          if (!cameraTrack || !localVideoTrackRef.current) {
            console.log("📹 No valid camera track, creating new one before publishing");
            try {
              cameraTrack = await AgoraRTC.createCameraVideoTrack();
              setLocalVideoTrack(cameraTrack);
              localVideoTrackRef.current = cameraTrack;
              console.log("✅ Created fresh camera track");
            } catch (error) {
              console.error("❌ Failed to create camera track:", error);
            }
          }
          
          // Publish camera track if it exists
          if (cameraTrack) {
            console.log("📹 Publishing camera track after screen share stopped");
            try {
              await client.publish(cameraTrack);
              console.log("✅ Camera track published successfully");
            } catch (publishError) {
              console.error("❌ Failed to publish camera track:", publishError);
            }
            
            // IMPORTANT: Play the camera track in the local video container
            console.log("📹 Playing camera track in local-player");
            try {
              await cameraTrack.play("local-player");
              console.log("✅ Camera track playing successfully");
            } catch (playError) {
              console.warn("❌ Failed to play camera track:", playError);
              // Retry after a delay
              setTimeout(async () => {
                try {
                  await cameraTrack.play("local-player");
                  console.log("✅ Retry play successful for camera track");
                } catch (retryError) {
                  console.warn("❌ Retry play failed for camera track:", retryError);
                }
              }, 500);
            }
          }

          // Restore original video and audio state
          console.log(
            "📹 Restoring original state - Video:",
            originalVideoState,
            "Audio:",
            originalAudioState
          );

          // Restore video state
          if (localVideoTrack) {
            await localVideoTrack.setEnabled(originalVideoState);
            setCameraOff(!originalVideoState);
          }

          // Restore audio state
          if (localAudioTrack) {
            await localAudioTrack.setEnabled(!originalAudioState);
            setMuted(originalAudioState);
          }

          // Use flushSync to ensure immediate state update - clear ALL screen sharing states and refs
          flushSync(() => {
            setScreenSharing(false);
            setIsStartingScreenShare(false);
            setScreenShareBlocked(false);
            setFullscreenVideo(null);
          });
          screenSharingRef.current = false;
          isStartingScreenShareRef.current = false;
          console.log("✅ Screen sharing stopped, all states and refs cleared");

          // Notify that screen sharing stopped
          console.log("📡 Calling onScreenShareStopped callback...");
          if (onScreenShareStopped) {
            console.log("✅ onScreenShareStopped exists, calling it now");
            onScreenShareStopped();
            console.log("✅ onScreenShareStopped called successfully");
          } else {
            console.warn("⚠️ onScreenShareStopped is not defined");
          }
        }
      } catch (error) {
        console.error("❌ Screen share error:", error);
        // Reset all screen sharing states and refs
        flushSync(() => {
          setScreenSharing(false);
          setIsStartingScreenShare(false);
        });
        screenSharingRef.current = false;
        isStartingScreenShareRef.current = false;

        // Check if it's a permission error
        if (error.code === "PERMISSION_DENIED") {
          console.error(
            "🚫 Screen sharing permission denied. Please allow screen sharing in your browser."
          );
          setPermissionError(
            "Screen sharing permission denied. Please allow screen sharing in your browser."
          );
        } else if (error.code === "NOT_SUPPORTED") {
          console.error("🚫 Screen sharing not supported in this browser.");
          setPermissionError(
            "Screen sharing is not supported in this browser."
          );
        }

        // Try to restore camera if screen share failed
        if (localVideoTrack) {
          try {
            await client.publish(localVideoTrack);
            console.log("✅ Camera restored after screen share error");
          } catch (restoreError) {
            console.error("❌ Failed to restore camera:", restoreError);
          }
        }
      }
    }, [joined, localVideoTrack, onScreenShareStarted, onScreenShareStopped]);

    useEffect(() => {
      // Auto-join on mount
      console.log("🚀 AgoraCall component mounted, attempting to join channel");
      if (sessionId && userId && !joined) {
        join().catch((error) => {
          console.error("❌ Failed to join Agora channel:", error);
        });
      }
      return () => {
        console.log("🚪 AgoraCall component unmounting, leaving channel");
        leave().catch((error) => {
          console.error("❌ Error during leave on unmount:", error);
        });
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, userId]);

    // Play local track when ready (camera or screen)
    useEffect(() => {
      const playLocal = async () => {
        if (screenSharing && screenTrackRef.current) {
          try {
            console.log("🖥️ Attempting to play screen share track");
            await screenTrackRef.current.play("local-player", { fit: "contain" });
            console.log("✅ Screen share playing successfully");
          } catch (e) {
            console.warn("❌ Screen play failed:", e);
            // Retry screen play
            setTimeout(async () => {
              try {
                console.log("🔄 Retrying screen share play");
                await screenTrackRef.current?.play("local-player", {
                  fit: "contain",
                });
                console.log("✅ Screen share retry success");
              } catch (retryError) {
                console.warn("❌ Screen share retry failed:", retryError);
              }
            }, 1000);
          }
        } else if (localVideoTrack && !screenSharing) {
          // Play on main local-player
          try {
            console.log(
              "🎥 Attempting to play local video track on main player"
            );
            await localVideoTrack.play("local-player");
            console.log("✅ Local video playing successfully on main player");
          } catch (e) {
            console.warn("❌ Local play failed on main player:", e);
          }

          // Also try to play on thumbnail if element exists and not screen sharing
          // (thumbnail is hidden during screen sharing)
          if (!screenSharing) {
            const thumbElement = document.getElementById("local-player-thumb");
            if (thumbElement) {
              try {
                console.log("🎥 Attempting to play local video on thumbnail");
                await localVideoTrack.play("local-player-thumb");
                console.log("✅ Local video playing on thumbnail");
              } catch (e) {
                console.warn("❌ Local thumbnail play failed:", e);
              }
            }
          }
        }
      };

      // Small delay to ensure DOM is ready
      setTimeout(playLocal, 200);
    }, [localVideoTrack, screenSharing, fullscreenVideo]);

    // Additional force play for screen sharing
    useEffect(() => {
      if (screenSharing && screenTrackRef.current) {
        const forcePlayScreen = async () => {
          try {
            console.log("🖥️ Force playing screen share track");
            await screenTrackRef.current.play("local-player", {
              fit: "contain",
            });
            console.log("✅ Force play screen share successful");
          } catch (e) {
            console.warn("❌ Force play screen share failed:", e);
          }
        };
        
        // Try immediately
        forcePlayScreen();
        
        // Also try after a delay to ensure DOM is ready
        setTimeout(forcePlayScreen, 500);
      }
    }, [screenSharing]);

    // Play remote tracks when they update
    useEffect(() => {
      Object.values(remoteUsers).forEach(async (u) => {
        if (u.videoTrack && u.hasVideo) {
          // Play on main remote player
          try {
            console.log(
              `🎥 Attempting to play remote video for user ${u.uid} on main player`
            );
            await u.videoTrack.play(
              `remote-player-${u.uid}`,
              remoteVideoPlayConfig
            );
            console.log(
              `✅ Remote video playing for user ${u.uid} on main player`
            );
          } catch (e) {
            console.warn(
              `❌ Remote play failed for user ${u.uid} on main player:`,
              e
            );
          }

          // Also try to play on thumbnail if element exists
          const thumbElement = document.getElementById(
            `remote-player-${u.uid}-thumb`
          );
          if (thumbElement) {
            try {
              console.log(
                `🎥 Attempting to play remote video for user ${u.uid} on thumbnail`
              );
              await u.videoTrack.play(`remote-player-${u.uid}-thumb`);
              console.log(
                `✅ Remote video playing for user ${u.uid} on thumbnail`
              );
            } catch (e) {
              console.warn(
                `❌ Remote thumbnail play failed for user ${u.uid}:`,
                e
              );
            }
          }
        }
      });
    }, [remoteUsers, fullscreenVideo, remoteVideoPlayConfig]);

    // Force play remote video when screen sharing is active
    useEffect(() => {
      if (remoteScreenSharingState || remoteScreenSharing) {
        console.log("🖥️ Screen sharing is active, forcing video play for all remote users");
        Object.values(remoteUsers).forEach(async (u) => {
          if (u.videoTrack && u.hasVideo) {
            try {
              console.log(`🖥️ Force playing remote video for user ${u.uid} during screen share`);
            await u.videoTrack.play(
              `remote-player-${u.uid}`,
              remoteVideoPlayConfig
            );
              console.log(`✅ Force play successful for user ${u.uid}`);
            } catch (e) {
              console.warn(`❌ Force play failed for user ${u.uid}:`, e);
            }
          }
        });
      }
    }, [remoteScreenSharingState, remoteScreenSharing, remoteUsers, remoteVideoPlayConfig]);

    // CRITICAL: Re-play remote videos when transitioning from screen share to normal layout
    // This handles the case where video was playing in thumbnail during screen share,
    // but needs to play in main grid after screen share stops
    useEffect(() => {
      const isLocallySharing = screenSharing || screenSharingRef.current || isStartingScreenShareRef.current;
      const isRemotelySharing = remoteScreenSharingState || remoteScreenSharing;
      const shouldShowScreenShare = isLocallySharing || isRemotelySharing;
      
      console.log("🎥 Layout transition check:", {
        shouldShowScreenShare,
        remoteUsersCount: Object.keys(remoteUsers).length,
        remoteUsersWithVideo: Object.values(remoteUsers).filter(u => u.hasVideo).length
      });
      
      // When NOT in screen sharing mode, ensure all remote videos play in main grid
      if (!shouldShowScreenShare) {
        console.log("🎥 ✅ Normal layout active - ensuring remote videos play in main grid");
        
        const playRemoteVideo = async (user: RemoteUser, attempt = 1) => {
          if (!user.videoTrack || !user.hasVideo) {
            console.log(`⚠️ User ${user.uid} has no video track or hasVideo is false`);
            return;
          }
          
          const elementId = `remote-player-${user.uid}`;
          const element = document.getElementById(elementId);
          
          if (!element) {
            console.warn(`❌ [Attempt ${attempt}] Element ${elementId} not found in DOM`);
            if (attempt < 5) {
              setTimeout(() => playRemoteVideo(user, attempt + 1), 300);
            }
            return;
          }
          
          try {
            console.log(`🎥 [Attempt ${attempt}] Re-playing remote video for user ${user.uid} in main grid`);
            await user.videoTrack.play(elementId);
            console.log(`✅ Remote video playing in main grid for user ${user.uid}`);
          } catch (e) {
            console.warn(`❌ [Attempt ${attempt}] Failed to play remote video for user ${user.uid}:`, e);
            if (attempt < 5) {
              setTimeout(() => playRemoteVideo(user, attempt + 1), 300);
            }
          }
        };
        
        // Try to play all remote users' videos
        Object.values(remoteUsers).forEach(user => {
          playRemoteVideo(user, 1);
        });
      }
    }, [screenSharing, remoteScreenSharingState, remoteScreenSharing, remoteUsers]);

    // Force play local video when screen sharing is active (designer side)
    useEffect(() => {
      if (screenSharing && screenTrackRef.current) {
        console.log("🖥️ Local screen sharing is active, forcing video play");
        const playLocalScreen = async () => {
          try {
            console.log("🖥️ Force playing local screen share");
            await screenTrackRef.current.play("local-player", {
              fit: "contain",
            });
            console.log("✅ Force play local screen share successful");
          } catch (e) {
            console.warn("❌ Force play local screen share failed:", e);
            // Retry after a short delay
            setTimeout(async () => {
              try {
                await screenTrackRef.current?.play("local-player", {
                  fit: "contain",
                });
                console.log("✅ Force play local screen share retry successful");
              } catch (retryError) {
                console.warn("❌ Force play local screen share retry failed:", retryError);
              }
            }, 500);
          }
        };
        playLocalScreen();
      }
    }, [screenSharing]);

    // CRITICAL: Re-play local camera when transitioning from screen share to normal layout
    // This ensures camera plays in the main grid after screen share stops
    useEffect(() => {
      const isLocallySharing = screenSharing || screenSharingRef.current || isStartingScreenShareRef.current;
      
      console.log("🎥 Local camera check:", {
        isLocallySharing,
        hasLocalVideoTrack: !!localVideoTrack,
        cameraOff
      });
      
      // When NOT sharing screen and have camera track, ensure it plays in main area
      if (!isLocallySharing && localVideoTrack && !cameraOff) {
        console.log("🎥 ✅ Normal layout active - ensuring local camera plays in main grid");
        
        const playLocalCamera = async (attempt = 1) => {
          const element = document.getElementById("local-player");
          
          if (!element) {
            console.warn(`❌ [Attempt ${attempt}] Element local-player not found in DOM`);
            if (attempt < 5) {
              setTimeout(() => playLocalCamera(attempt + 1), 300);
            }
            return;
          }
          
          try {
            console.log(`🎥 [Attempt ${attempt}] Re-playing local camera in main grid`);
            await localVideoTrack.play("local-player");
            console.log("✅ Local camera playing in main grid");
          } catch (e) {
            console.warn(`❌ [Attempt ${attempt}] Failed to play local camera:`, e);
            if (attempt < 5) {
              setTimeout(() => playLocalCamera(attempt + 1), 300);
            }
          }
        };
        
        // Start trying to play with small delay for DOM to be ready
        setTimeout(() => playLocalCamera(1), 200);
      }
    }, [screenSharing, localVideoTrack, cameraOff]);

    // Debug effect to track remote video elements
    useEffect(() => {
      console.log("🎥 ===== REMOTE VIDEO ELEMENTS DEBUG =====");
      Object.values(remoteUsers).forEach((u) => {
        if (u.hasVideo) {
          const mainElement = document.getElementById(`remote-player-${u.uid}`);
          const thumbElement = document.getElementById(`remote-player-${u.uid}-thumb`);
          console.log(`🎥 User ${u.uid}:`, {
            hasVideo: u.hasVideo,
            videoTrack: !!u.videoTrack,
            mainElement: !!mainElement,
            thumbElement: !!thumbElement,
            mainElementVisible: mainElement ? window.getComputedStyle(mainElement).display !== 'none' : false
          });
        }
      });
    }, [remoteUsers]);

    // Force video play when screen sharing layout is active
    useEffect(() => {
      const shouldShowScreenShare =
        screenSharing || remoteScreenSharingState || remoteScreenSharing;
      if (shouldShowScreenShare) {
        console.log("🖥️ Screen sharing layout is active, forcing video play", {
          screenSharing,
          remoteScreenSharingState,
          remoteScreenSharing
        });
        
        // Force play local screen share if active
        if (screenSharing && screenTrackRef.current) {
          setTimeout(async () => {
            try {
              console.log("🖥️ Force playing local screen share in main area");
              await screenTrackRef.current.play("local-player", {
                fit: "contain",
              });
              console.log("✅ Local screen share playing in main area");
            } catch (e) {
              console.warn("❌ Failed to play local screen share in main area:", e);
            }
          }, 100);
        }
        
        // Force play remote screen share if active - with aggressive retry
        if (remoteScreenSharingState || remoteScreenSharing) {
          console.log("🖥️ Remote screen sharing detected, forcing play for all remote users");
          
          // Try immediately
          Object.values(remoteUsers).forEach(async (u) => {
            if (u.videoTrack && u.hasVideo) {
              const playRemoteVideo = async (attempt = 1) => {
                try {
                  console.log(`🖥️ [Attempt ${attempt}] Force playing remote screen share for user ${u.uid}`);
                  await u.videoTrack.play(`remote-player-${u.uid}`, {
                    fit: "contain",
                  });
                  console.log(`✅ Remote screen share playing for user ${u.uid}`);
                } catch (e) {
                  console.warn(`❌ [Attempt ${attempt}] Failed to play remote screen share for user ${u.uid}:`, e);
                  // Retry up to 5 times with increasing delays
                  if (attempt < 5) {
                    setTimeout(() => playRemoteVideo(attempt + 1), attempt * 500);
                  }
                }
              };
              
              playRemoteVideo();
            }
          });
          
          // Also set up a periodic retry for the first few seconds
          const retryInterval = setInterval(() => {
            Object.values(remoteUsers).forEach(async (u) => {
              if (u.videoTrack && u.hasVideo) {
                try {
                  console.log(`🖥️ [Periodic retry] Playing remote screen share for user ${u.uid}`);
                  await u.videoTrack.play(`remote-player-${u.uid}`, {
                    fit: "contain",
                  });
                  console.log(`✅ [Periodic retry] Success for user ${u.uid}`);
                } catch (e) {
                  // Silent fail for periodic retries
                }
              }
            });
          }, 1000);
          
          // Clear interval after 10 seconds
          setTimeout(() => clearInterval(retryInterval), 10000);
          
          return () => clearInterval(retryInterval);
        }
      }
    }, [screenSharing, remoteScreenSharingState, remoteScreenSharing, remoteUsers]);

    // Helper function to switch video to fullscreen
    const handleVideoClick = useCallback(
      (videoType: "local" | "remote" | "screen") => {
        setFullscreenVideo(fullscreenVideo === videoType ? null : videoType);
      },
      [fullscreenVideo]
    );


    return (
      <div className="w-full h-full flex flex-col bg-gray-900">
        {/* Global style to ensure screen share videos use object-fit: contain */}
        <style dangerouslySetInnerHTML={{
          __html: `
            #local-player video,
            [id^="remote-player-"] video {
              object-fit: contain !important;
              width: 100% !important;
              height: 100% !important;
            }
          `
        }} />
        
        {/* Main video area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Google Meet style video layout */}
          {(() => {
            // Check both states AND refs for most reliable screen sharing detection
            const isLocallySharing = screenSharing || screenSharingRef.current || isStartingScreenShareRef.current;
            const isRemotelySharing = remoteScreenSharingState || remoteScreenSharing;
            const shouldShowScreenShare = isLocallySharing || isRemotelySharing;
            console.log("🖥️ LAYOUT DECISION:", {
              screenSharing,
              screenSharingRef: screenSharingRef.current,
              isStartingScreenShareRef: isStartingScreenShareRef.current,
              remoteScreenSharingState,
              remoteScreenSharing,
              isLocallySharing,
              isRemotelySharing,
              shouldShowScreenShare
            });
            return shouldShowScreenShare;
          })() ? (
            /* Screen sharing layout - ALWAYS show screen share as main content */
            <div className="w-full h-full relative">
              {/* Debug indicator */}
              {/* <div className="absolute top-20 left-4 bg-yellow-500/90 text-black px-3 py-2 rounded-lg text-xs z-50">
                Screen Share Layout Active
                <div className="text-[10px] mt-1">
                  Local: {screenSharing ? 'YES' : 'NO'} | Remote: {remoteScreenSharingState ? 'YES' : 'NO'} | Prop: {remoteScreenSharing ? 'YES' : 'NO'}
                </div>
              </div> */}
              {/* Main screen share area - takes full space */}
              <div className="w-full h-full relative bg-black">
                {/* Screen share content - always full size when screen sharing is active */}
                <div className="w-full h-full relative">
                  {screenSharing ? (
                    // Designer side - show local screen share
                    <div
                      id="local-player"
                      className="absolute inset-0 cursor-pointer"
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#000'
                      }}
                      onClick={() => handleVideoClick("screen")}
                    />
                  ) : (
                    // Customer side - show remote screen share
                    (() => {
                      const remoteUsersArray = Object.values(remoteUsers);
                      console.log("🖥️ ===== REMOTE SCREEN SHARE RENDER =====");
                      console.log("🖥️ Total remote users:", remoteUsersArray.length);
                      console.log("🖥️ Remote users with video:", remoteUsersArray.filter((u) => u.hasVideo).length);
                      console.log("🖥️ remoteScreenSharing prop:", remoteScreenSharing);
                      console.log("🖥️ remoteScreenSharingState:", remoteScreenSharingState);
                      console.log("🖥️ Remote users details:", remoteUsersArray.map(u => ({
                        uid: u.uid,
                        hasVideo: u.hasVideo,
                        hasVideoTrack: !!u.videoTrack
                      })));
                      
                      const usersWithVideo = remoteUsersArray.filter((u) => u.hasVideo);
                      
                      if (usersWithVideo.length === 0) {
                        // Show loading message if broadcast received but video not ready yet
                        return (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                              <p className="text-white text-lg">Loading screen share...</p>
                              <p className="text-gray-400 text-sm mt-2">Waiting for video stream</p>
                            </div>
                          </div>
                        );
                      }
                      
                      return usersWithVideo.map((u) => {
                        console.log("🖥️ Rendering remote screen share for user:", u.uid, "hasVideo:", u.hasVideo);
                        return (
                          <div key={u.uid as any} className="absolute inset-0">
                            <div
                              id={`remote-player-${u.uid}`}
                              className="absolute inset-0 cursor-pointer"
                              style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#000'
                              }}
                              onClick={() => handleVideoClick("screen")}
                            />
                          </div>
                        );
                      });
                    })()
                  )}

                  {/* Screen sharing indicator - only show when actually sharing */}
                  {(() => {
                    const showIndicator = screenSharing || remoteScreenSharingState || remoteScreenSharing;
                    console.log("🖥️ Screen sharing indicator check:", {
                      screenSharing,
                      remoteScreenSharingState,
                      remoteScreenSharing,
                      showIndicator
                    });
                    return showIndicator && (
                      <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-lg">
                        <ScreenShare className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {screenSharing
                            ? "You are presenting"
                            : `${isDesigner ? "Customer" : "Designer"} is presenting`}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Video thumbnails strip at bottom */}
              <div className="absolute bottom-4 left-4 right-4 flex gap-3 justify-center">
                {/* Local video thumbnail - only show if NOT screen sharing (camera is unpublished during screen share) */}
                {localVideoTrack && !screenSharing && (
                  <div
                    className={`relative bg-black rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                      fullscreenVideo === "local"
                        ? "border-green-400 shadow-lg shadow-green-400/30"
                        : "border-white/20"
                    } w-32 h-20`}
                    onClick={() => handleVideoClick("local")}
                  >
                    <div id="local-player-thumb" className="absolute inset-0" />
                    <div className="absolute bottom-1 left-1 bg-green-500/90 text-white px-1.5 py-0.5 text-xs rounded backdrop-blur-sm">
                      You
                    </div>
                    {fullscreenVideo === "local" && (
                      <div className="absolute inset-0 bg-green-400/20 flex items-center justify-center">
                        <div className="bg-green-500 text-white p-1 rounded">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Remote video thumbnail */}
                {Object.values(remoteUsers)
                  .filter((u) => u.hasVideo)
                  .map((u) => (
                    <div
                      key={u.uid as any}
                      className={`relative bg-black rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                        fullscreenVideo === "remote"
                          ? "border-blue-400 shadow-lg shadow-blue-400/30"
                          : "border-white/20"
                      } w-32 h-20`}
                      onClick={() => handleVideoClick("remote")}
                    >
                      <div
                        id={`remote-player-${u.uid}-thumb`}
                        className="absolute inset-0"
                      />
                      <div className="absolute bottom-1 left-1 bg-blue-500/90 text-white px-1.5 py-0.5 text-xs rounded backdrop-blur-sm">
                        {isDesigner ? "Customer" : "Designer"}
                      </div>
                      {fullscreenVideo === "remote" && (
                        <div className="absolute inset-0 bg-blue-400/20 flex items-center justify-center">
                          <div className="bg-blue-500 text-white p-1 rounded">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* Normal video call layout */
            <div className="w-full h-full relative">
              {fullscreenVideo ? (
                /* Single video fullscreen */
                <div className="w-full h-full relative bg-black">
                  {fullscreenVideo === "local" ? (
                    <div className="w-full h-full relative">
                      <div
                        id="local-player"
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => handleVideoClick("local")}
                      />
                      <div className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg">
                        <span className="text-sm font-medium">
                          You (Fullscreen)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full relative">
                      {Object.values(remoteUsers)
                        .filter((u) => u.hasVideo)
                        .map((u) => (
                          <div key={u.uid as any} className="absolute inset-0">
                            <div
                              id={`remote-player-${u.uid}`}
                              className="absolute inset-0 cursor-pointer"
                              onClick={() => handleVideoClick("remote")}
                            />
                          </div>
                        ))}
                      <div className="absolute top-4 left-4 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg">
                        <span className="text-sm font-medium">
                          {isDesigner ? "Customer" : "Designer"} (Fullscreen)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Other video as thumbnail */}
                  <div className="absolute bottom-4 right-4">
                    {fullscreenVideo === "local" ? (
                      /* Show remote as thumbnail */
                      Object.values(remoteUsers)
                        .filter((u) => u.hasVideo)
                        .map((u) => (
                          <div
                            key={u.uid as any}
                            className="relative bg-black rounded-lg overflow-hidden border-2 border-white/20 cursor-pointer w-32 h-20 hover:scale-105 transition-transform"
                            onClick={() => handleVideoClick("remote")}
                          >
                            <div
                              id={`remote-player-${u.uid}-thumb`}
                              className="absolute inset-0"
                            />
                            <div className="absolute bottom-1 left-1 bg-blue-500/90 text-white px-1.5 py-0.5 text-xs rounded backdrop-blur-sm">
                              {isDesigner ? "Customer" : "Designer"}
                            </div>
                          </div>
                        ))
                    ) : localVideoTrack ? (
                      /* Show local as thumbnail */
                      <div
                        className="relative bg-black rounded-lg overflow-hidden border-2 border-white/20 cursor-pointer w-32 h-20 hover:scale-105 transition-transform"
                        onClick={() => handleVideoClick("local")}
                      >
                        <div
                          id="local-player-thumb"
                          className="absolute inset-0"
                        />
                        <div className="absolute bottom-1 left-1 bg-green-500/90 text-white px-1.5 py-0.5 text-xs rounded backdrop-blur-sm">
                          You
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                /* Grid layout - responsive */
                <div className="w-full h-full p-4">
                  <div className="w-full h-full grid gap-4 grid-cols-1 lg:grid-cols-2">
                    {/* Local video */}
                    <div
                      className="relative bg-black rounded-xl overflow-hidden shadow-lg cursor-pointer hover:shadow-2xl transition-all duration-200 hover:scale-[1.02]"
                      onClick={() => handleVideoClick("local")}
                    >
                      <div id="local-player" className="absolute inset-0" />
                      {!localVideoTrack ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <div className="text-center text-gray-300">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                              <VideoOff className="w-8 h-8" />
                            </div>
                            <p className="text-lg font-medium">Camera Off</p>
                            {permissionError && (
                              <div className="mt-4 p-3 bg-red-900/30 rounded-lg border border-red-500/30">
                                <p className="text-red-300 text-sm mb-2">
                                  {permissionError}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPermissionError(null);
                                    join();
                                  }}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                                >
                                  Retry
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="absolute bottom-4 left-4 bg-green-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg">
                          <span className="text-sm font-medium">You</span>
                        </div>
                      )}
                      {muted && (
                        <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-sm text-white p-2 rounded-lg shadow-lg">
                          <MicOff className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Remote video */}
                    <div
                      className="relative bg-black rounded-xl overflow-hidden shadow-lg cursor-pointer hover:shadow-2xl transition-all duration-200 hover:scale-[1.02]"
                      onClick={() => handleVideoClick("remote")}
                    >
                      {Object.keys(remoteUsers).length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <div className="text-center text-gray-300">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                              <Video className="w-8 h-8" />
                            </div>
                            <p className="text-lg font-medium">
                              Waiting for participant
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                              They will appear here when they join
                            </p>
                          </div>
                        </div>
                      ) : Object.values(remoteUsers).filter((u) => u.hasVideo)
                        .length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <div className="text-center text-gray-300">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                              <VideoOff className="w-8 h-8" />
                            </div>
                            <p className="text-lg font-medium">
                              {isDesigner ? "Customer" : "Designer"}'s camera is off
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {Object.values(remoteUsers)
                            .filter((u) => u.hasVideo)
                            .map((u) => (
                              <div
                                key={u.uid as any}
                                className="absolute inset-0"
                              >
                                <div
                                  id={`remote-player-${u.uid}`}
                                  className="absolute inset-0"
                                />
                                <div className="absolute bottom-4 left-4 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg">
                                  <span className="text-sm font-medium">
                                    {isDesigner ? "Customer" : "Designer"}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls bar - Google Meet style */}
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
            {/* Mic button */}
            <Button
              variant={muted ? "destructive" : "outline"}
              size="lg"
              className={`rounded-full w-12 h-12 p-0 transition-all duration-200 ${
                muted
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "hover:bg-gray-100"
              }`}
              onClick={toggleMic}
            >
              {muted ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>

            {/* Camera button */}
            <Button
              variant={cameraOff ? "destructive" : "outline"}
              size="lg"
              className={`rounded-full w-12 h-12 p-0 transition-all duration-200 ${
                cameraOff
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "hover:bg-gray-100"
              }`}
              onClick={toggleCamera}
            >
              {cameraOff ? (
                <VideoOff className="w-5 h-5" />
              ) : (
                <Video className="w-5 h-5" />
              )}
            </Button>

            {/* Screen share button - for both designer and customer */}
            <Button
              variant={screenSharing ? "destructive" : "outline"}
              size="lg"
              className={`rounded-full w-12 h-12 p-0 transition-all duration-200 ${
                screenSharing
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : screenShareBlocked
                  ? "bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => {
                console.log("🖥️ Screen share button clicked");
                console.log("🖥️ screenSharing:", screenSharing);
                console.log("🖥️ screenShareBlocked:", screenShareBlocked);
                console.log("🖥️ remoteScreenSharing:", remoteScreenSharing);
                console.log("🖥️ Button disabled:", screenShareBlocked && !screenSharing);
                toggleScreenShare();
              }}
              disabled={screenShareBlocked && !screenSharing}
              title={
                screenShareBlocked
                  ? "Please ask the other participant to stop screen sharing first"
                  : screenSharing
                  ? "Stop screen sharing"
                  : "Start screen sharing"
              }
            >
              <ScreenShare className="w-5 h-5" />
            </Button>

            {/* Pause/Resume button - only for designer when NO screen sharing is active */}
            {isDesigner && !screenSharingRef.current && !isStartingScreenShareRef.current && !remoteScreenSharingState && !remoteScreenSharing && (
              <Button
                variant={isPaused ? "outline" : "destructive"}
                size="lg"
                className={`rounded-full w-12 h-12 p-0 transition-all duration-200 ${
                  isPaused
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-orange-600 hover:bg-orange-700 text-white"
                }`}
                onClick={isPaused ? onResumeSession : onPauseSession}
                title={isPaused ? "Resume session" : "Pause session"}
              >
                {isPaused ? (
                  <Play className="w-5 h-5" />
                ) : (
                  <Pause className="w-5 h-5" />
                )}
              </Button>
            )}

            {/* Rate change button - only for designer when NO screen sharing is active */}
            {isDesigner && !screenSharingRef.current && !isStartingScreenShareRef.current && !remoteScreenSharingState && !remoteScreenSharing && (
              <div className="relative rate-input-container">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-12 h-12 p-0 transition-all duration-200 hover:bg-gray-100"
                  onClick={() => setShowRateInput(!showRateInput)}
                  title="Change session rate"
                >
                  <Clock className="w-5 h-5" />
                </Button>

                {/* Rate input dropdown */}
                {showRateInput && (
                  <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Change Rate
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">₹</span>
                      <input
                        type="number"
                        value={rateInput}
                        onChange={(e) => setRateInput(e.target.value)}
                        onKeyDown={handleRateKeyPress}
                        placeholder={currentRate?.toString() || "0"}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleRateSubmit}
                        className="px-2 py-1 text-xs"
                      >
                        Set
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Current: ₹{currentRate || 0}/min
                    </div>
                    {/* Inline helper - enforce min rate on submit (validated server-side too) */}
                    <div className="text-[10px] text-gray-400 mt-1">
                      Note: Minimum allowed is the platform minimum per minute set by admin.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Format Multiplier button - only for designer when NO screen sharing is active */}
            {isDesigner && !screenSharingRef.current && !isStartingScreenShareRef.current && !remoteScreenSharingState && !remoteScreenSharing && (
              <Button
                variant="outline"
                size="lg"
                className="rounded-full w-12 h-12 p-0 transition-all duration-200 hover:bg-gray-100"
                onClick={handleFormatMultiplierRequest}
                title="Request Format Multiplier Change"
              >
                <Percent className="w-5 h-5" />
              </Button>
            )}

            {/* Stop & Send Request Approval button - only for designer */}
            {isDesigner && (
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full w-12 h-12 p-0 bg-red-600 hover:bg-red-700 ml-2"
                onClick={() => onEndByDesigner()}
                title="Stop and Request Approval"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Format Multiplier Approval Dialog */}
        {showFormatMultiplierDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Request Format Multiplier Change
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    New Format Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formatMultiplierInput}
                    onChange={(e) => setFormatMultiplierInput(e.target.value)}
                    placeholder="Enter new multiplier"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    File Format
                  </label>
                  <input
                    type="text"
                    value={fileFormatInput}
                    onChange={(e) => setFileFormatInput(e.target.value)}
                    placeholder="e.g., .jpg, .cdr, .ai, .psd"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="text-sm text-gray-600">
                  <p>This request will be sent to the customer for approval.</p>
                  <p>
                    The customer will need to approve the new format multiplier
                    before it takes effect.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFormatMultiplierDialog(false);
                    setFormatMultiplierInput("");
                    setFileFormatInput("");
                  }}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFormatMultiplierSubmit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Send Request
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }
);

AgoraCall.displayName = "AgoraCall";

export default AgoraCall;
