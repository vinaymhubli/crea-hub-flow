import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AgoraRTC, { IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack, IRemoteAudioTrack, IRemoteVideoTrack, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff } from 'lucide-react';

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
}

// NOTE: We intentionally keep this component minimal and focused on A/V join/leave.
// Screen-sharing continues to be handled by the existing ScreenShareModal to avoid regressions.
export default function AgoraCall({ sessionId, userId, isDesigner, onEndByDesigner, onLocalJoined, onRemoteUserJoined, onRemoteUserLeft, onOpenShare }: AgoraCallProps) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [joined, setJoined] = useState(false);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<Record<string, RemoteUser>>({});
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);

  const tokenEndpoint = '/api/agora/token';

  const ensureClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    }
    return clientRef.current;
  }, []);

  const attachClientListeners = useCallback((client: IAgoraRTCClient) => {
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      setRemoteUsers(prev => {
        const existing = prev[user.uid as any] || { uid: user.uid };
        if (mediaType === 'video') {
          existing.videoTrack = user.videoTrack;
          existing.hasVideo = true;
        }
        if (mediaType === 'audio') {
          existing.audioTrack = user.audioTrack;
          existing.hasAudio = true;
          user.audioTrack?.play();
        }
        return { ...prev, [user.uid as any]: existing };
      });
      if (onRemoteUserJoined) onRemoteUserJoined(user.uid);
    });

    client.on('user-unpublished', (user, mediaType) => {
      setRemoteUsers(prev => {
        const copy = { ...prev };
        const existing = copy[user.uid as any];
        if (!existing) return copy;
        if (mediaType === 'video') {
          existing.videoTrack = null;
          existing.hasVideo = false;
        }
        if (mediaType === 'audio') {
          existing.audioTrack = null;
          existing.hasAudio = false;
        }
        copy[user.uid as any] = existing;
        return copy;
      });
    });

    client.on('user-left', user => {
      setRemoteUsers(prev => {
        const copy = { ...prev };
        delete copy[user.uid as any];
        return copy;
      });
      if (onRemoteUserLeft) onRemoteUserLeft(user.uid);
    });
  }, [onRemoteUserJoined, onRemoteUserLeft]);

  const join = useCallback(async () => {
    if (joined) return;
    const client = ensureClient();

    // Attach listeners BEFORE join to catch already-published remote users
    attachClientListeners(client);

    // Fetch token
    const resp = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: userId, channel: sessionId, asSharer: true }),
    });
    if (!resp.ok) throw new Error('Failed to get Agora token');
    const { appId, rtcToken } = await resp.json();

    // Join and publish local tracks
    await client.join(appId, sessionId, rtcToken, userId);
    const mic = await AgoraRTC.createMicrophoneAudioTrack();
    const cam = await AgoraRTC.createCameraVideoTrack();
    setLocalAudioTrack(mic);
    setLocalVideoTrack(cam);
    await client.publish([mic, cam]);

    // Force re-subscribe to already connected remote users
    client.remoteUsers.forEach(async (ru: any) => {
      try {
        if (ru.hasVideo) await client.subscribe(ru, 'video');
        if (ru.hasAudio) await client.subscribe(ru, 'audio');
      } catch (e) {
        console.warn('Resubscribe failed:', e);
      }
    });

    setJoined(true);
    if (onLocalJoined) onLocalJoined();
  }, [attachClientListeners, ensureClient, joined, sessionId, tokenEndpoint, userId]);

  const leave = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    try {
      if (localAudioTrack) localAudioTrack.close();
      if (localVideoTrack) localVideoTrack.close();
      await client.unpublish();
      await client.leave();
    } finally {
      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      setRemoteUsers({});
      setJoined(false);
    }
  }, [localAudioTrack, localVideoTrack]);

  const toggleMic = useCallback(async () => {
    if (!localAudioTrack) return;
    if (muted) {
      await localAudioTrack.setEnabled(true);
      setMuted(false);
    } else {
      await localAudioTrack.setEnabled(false);
      setMuted(true);
    }
  }, [localAudioTrack, muted]);

  const toggleCamera = useCallback(async () => {
    if (!localVideoTrack) return;
    if (cameraOff) {
      await localVideoTrack.setEnabled(true);
      setCameraOff(false);
    } else {
      await localVideoTrack.setEnabled(false);
      setCameraOff(true);
    }
  }, [cameraOff, localVideoTrack]);

  const toggleScreenShare = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !joined) return;
    
    try {
      if (!screenSharing) {
        // Start screen sharing - unpublish camera first
        if (localVideoTrack) {
          await client.unpublish(localVideoTrack);
        }
        
        // Create screen track with system picker
        const screenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: '1080p_1',
          optimizationMode: 'detail'
        }, 'auto');
        
        screenTrackRef.current = screenTrack;
        await client.publish(screenTrack);
        setScreenSharing(true);
        
        // Handle user clicking "Stop Sharing" in browser bar
        screenTrack.on('track-ended', () => {
          toggleScreenShare();
        });
      } else {
        // Stop screen sharing - switch back to camera
        if (screenTrackRef.current) {
          await client.unpublish(screenTrackRef.current);
          screenTrackRef.current.close();
          screenTrackRef.current = null;
        }
        
        // Re-publish camera
        if (localVideoTrack) {
          await client.publish(localVideoTrack);
        }
        setScreenSharing(false);
      }
    } catch (error) {
      console.error('Screen share error:', error);
      setScreenSharing(false);
    }
  }, [screenSharing, joined, localVideoTrack]);

  useEffect(() => {
    // Auto-join on mount
    join().catch(() => {});
    return () => {
      leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play local track when ready (camera or screen)
  useEffect(() => {
    if (localVideoTrack && !screenSharing) {
      setTimeout(() => {
        try { localVideoTrack.play('local-player'); } catch (e) { console.warn('Local play failed:', e); }
      }, 100);
    }
  }, [localVideoTrack, screenSharing]);

  // Play screen track when sharing
  useEffect(() => {
    if (screenTrackRef.current && screenSharing) {
      setTimeout(() => {
        try { screenTrackRef.current!.play('local-player'); } catch (e) { console.warn('Screen play failed:', e); }
      }, 100);
    }
  }, [screenSharing]);

  // Play remote tracks when they update
  useEffect(() => {
    Object.values(remoteUsers).forEach(u => {
      if (u.videoTrack && u.hasVideo) {
        setTimeout(() => {
          try { u.videoTrack!.play(`remote-player-${u.uid}`); } catch (e) { console.warn('Remote play failed:', e); }
        }, 100);
      }
    });
  }, [remoteUsers]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-black/90">
        {/* Local video or screen */}
        <div className="relative bg-black rounded overflow-hidden">
          <div id="local-player" className="absolute inset-0" />
          {screenSharing && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs rounded">
              Sharing Screen
            </div>
          )}
          {!localVideoTrack && !screenSharing && (
            <div className="w-full h-full flex items-center justify-center text-white/70">Camera Off</div>
          )}
        </div>
        {/* Remote video or screen */}
        <div className="relative bg-black rounded overflow-hidden">
          {Object.values(remoteUsers).length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-white/70">Waiting for participant…</div>
          ) : (
            <>
              {Object.values(remoteUsers).map(u => (
                <div key={u.uid as any} className="absolute inset-0">
                  <div id={`remote-player-${u.uid}`} className="absolute inset-0" />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="p-3 border-t bg-white flex items-center justify-center gap-3">
        <Button variant={muted ? 'destructive' : 'default'} onClick={toggleMic} className="gap-2">
          {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />} {muted ? 'Unmute' : 'Mute'}
        </Button>
        <Button variant={cameraOff ? 'destructive' : 'default'} onClick={toggleCamera} className="gap-2">
          {cameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />} {cameraOff ? 'Camera On' : 'Camera Off'}
        </Button>
        {/* ScreenShare continues to be handled by ScreenShareModal to reuse existing flow */}
        {isDesigner && (
          <Button 
            variant={screenSharing ? 'destructive' : 'outline'} 
            className="gap-2" 
            onClick={toggleScreenShare}
          >
            <ScreenShare className="w-4 h-4" /> {screenSharing ? 'Stop Sharing' : 'Share Screen'}
          </Button>
        )}
        {isDesigner && (
          <Button variant="destructive" className="gap-2" onClick={() => onEndByDesigner()}>
            <PhoneOff className="w-4 h-4" /> End Session
          </Button>
        )}
      </div>
    </div>
  );
}


