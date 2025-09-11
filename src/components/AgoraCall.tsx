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
  onScreenShareStarted?: () => void;
  onScreenShareStopped?: () => void;
}

// NOTE: We intentionally keep this component minimal and focused on A/V join/leave.
// Screen-sharing continues to be handled by the existing ScreenShareModal to avoid regressions.
export default function AgoraCall({ sessionId, userId, isDesigner, onEndByDesigner, onLocalJoined, onRemoteUserJoined, onRemoteUserLeft, onOpenShare, onScreenShareStarted, onScreenShareStopped }: AgoraCallProps) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [joined, setJoined] = useState(false);

  // Critical debugging: Track component lifecycle
  useEffect(() => {
    console.log('🔥 AgoraCall MOUNTED:', { sessionId, userId, isDesigner });
    return () => {
      console.log('🔥 AgoraCall UNMOUNTING:', { sessionId, userId, isDesigner });
      // Clean up client on unmount
      if (clientRef.current) {
        console.log('🧹 Cleaning up Agora client on unmount');
        try {
          clientRef.current.leave();
          clientRef.current = null;
        } catch (e) {
          console.warn('❌ Error cleaning up Agora client:', e);
        }
      }
    };
  }, [sessionId, userId, isDesigner]);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<Record<string, RemoteUser>>({});
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);
  const screenSharingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    screenSharingRef.current = screenSharing;
    console.log('🖥️ ScreenSharing state changed to:', screenSharing);
  }, [screenSharing]);

  const tokenEndpoint = '/api/agora/token';

  const ensureClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    }
    return clientRef.current;
  }, []);

  const attachClientListeners = useCallback((client: IAgoraRTCClient) => {
    client.on('user-published', async (user, mediaType) => {
      console.log(`📡 User published: ${user.uid}, mediaType: ${mediaType}, hasVideo: ${user.hasVideo}, hasAudio: ${user.hasAudio}`);
      await client.subscribe(user, mediaType);
      setRemoteUsers(prev => {
        const existing = prev[user.uid as any] || { uid: user.uid };
        if (mediaType === 'video') {
          existing.videoTrack = user.videoTrack;
          existing.hasVideo = true;
          
          // Simple screen share detection - check if it's a screen track
          if (user.videoTrack) {
            const track = user.videoTrack.getMediaStreamTrack();
            console.log('🖥️ Remote video track details:', {
              label: track.label,
              kind: track.kind,
              trackMediaType: user.videoTrack.trackMediaType,
              enabled: track.enabled,
              readyState: track.readyState
            });
            
            // Check if this is a screen share by looking at the track label
            const isScreenShare = track.label.includes('screen') || 
                                 track.label.includes('Screen') ||
                                 track.label.includes('window') ||
                                 track.label.includes('Window') ||
                                 track.label.includes('desktop') ||
                                 track.label.includes('Desktop') ||
                                 user.videoTrack.trackMediaType === 'screen';
            
            if (isScreenShare) {
              console.log('🖥️ REMOTE SCREEN SHARING DETECTED - track label:', track.label);
              setRemoteScreenSharing(true);
            } else {
              console.log('🖥️ Regular video track - track label:', track.label);
            }
          }
        }
        if (mediaType === 'audio') {
          existing.audioTrack = user.audioTrack;
          existing.hasAudio = true;
          user.audioTrack?.play();
        }
        console.log(`📡 Updated remote user ${user.uid}:`, existing);
        return { ...prev, [user.uid as any]: existing };
      });
      if (onRemoteUserJoined) onRemoteUserJoined(user.uid);
    });

    client.on('user-unpublished', (user, mediaType) => {
      console.log(`📡 User unpublished: ${user.uid}, mediaType: ${mediaType}`);
      setRemoteUsers(prev => {
        const copy = { ...prev };
        const existing = copy[user.uid as any];
        if (!existing) return copy;
        if (mediaType === 'video') {
          existing.videoTrack = null;
          existing.hasVideo = false;
          
          // Check if this was a screen share
          if (user.videoTrack) {
            const track = user.videoTrack.getMediaStreamTrack();
            const isScreenShare = track.label.includes('screen') || 
                                 track.label.includes('Screen') ||
                                 track.label.includes('window') ||
                                 track.label.includes('Window') ||
                                 track.label.includes('desktop') ||
                                 track.label.includes('Desktop') ||
                                 user.videoTrack.trackMediaType === 'screen';
            if (isScreenShare) {
              console.log('🖥️ REMOTE SCREEN SHARING STOPPED - track label:', track.label);
              setRemoteScreenSharing(false);
            }
          }
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
      console.log(`📡 User left: ${user.uid}`);
      setRemoteUsers(prev => {
        const copy = { ...prev };
        delete copy[user.uid as any];
        return copy;
      });
      if (onRemoteUserLeft) onRemoteUserLeft(user.uid);
    });
  }, [onRemoteUserJoined, onRemoteUserLeft]);

  const join = useCallback(async () => {
    if (joined) {
      console.log('⚠️ Already joined, skipping join attempt');
      return;
    }
    
    try {
      console.log('🚀 Starting Agora join process for user:', userId);
      const client = ensureClient();

      // Attach listeners BEFORE join to catch already-published remote users
      attachClientListeners(client);

      // Fetch token
      console.log('🎫 Fetching Agora token...');
      const resp = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: userId, channel: sessionId, asSharer: true }),
      });
      
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to get Agora token: ${resp.status} ${errorText}`);
      }
      
      const { appId, rtcToken } = await resp.json();

      // Join and publish local tracks
      console.log('🎯 Joining Agora channel:', { appId, sessionId, userId, tokenLength: rtcToken.length });
      await client.join(appId, sessionId, rtcToken, String(userId));
      console.log('✅ Successfully joined Agora channel');
      
      console.log('🎤🎥 Creating local media tracks...');
      let mic, cam;
      try {
        mic = await AgoraRTC.createMicrophoneAudioTrack();
        console.log('✅ Created microphone track');
      } catch (micError) {
        console.error('❌ Failed to create microphone track:', micError);
        if (micError.code === 'PERMISSION_DENIED') {
          console.error('🚫 Microphone permission denied. Please allow microphone access in your browser.');
          setPermissionError('Microphone permission denied. Please allow microphone access in your browser.');
        }
      }
      
      try {
        cam = await AgoraRTC.createCameraVideoTrack();
        console.log('✅ Created camera track');
      } catch (camError) {
        console.error('❌ Failed to create camera track:', camError);
        if (camError.code === 'PERMISSION_DENIED') {
          console.error('🚫 Camera permission denied. Please allow camera access in your browser.');
          setPermissionError('Camera permission denied. Please allow camera access in your browser.');
        }
      }
      
      console.log('✅ Created local tracks:', { mic: !!mic, cam: !!cam });
      
      setLocalAudioTrack(mic);
      setLocalVideoTrack(cam);
      
      // Only publish tracks that were successfully created
      const tracksToPublish = [];
      if (mic) tracksToPublish.push(mic);
      if (cam) tracksToPublish.push(cam);
      
      if (tracksToPublish.length > 0) {
        console.log('📡 Publishing local tracks to channel...', tracksToPublish.map(t => t.trackMediaType));
        await client.publish(tracksToPublish);
        console.log('✅ Published local tracks to channel');
      } else {
        console.warn('⚠️ No tracks to publish - permission issues detected');
      }

      // Force re-subscribe to already connected remote users
      console.log('🔍 Checking for existing remote users:', client.remoteUsers.length);
      for (const ru of client.remoteUsers) {
        console.log('🔍 Found remote user:', ru.uid, 'hasVideo:', ru.hasVideo, 'hasAudio:', ru.hasAudio);
        try {
          // Subscribe to each media type and manually trigger the user-published logic
          if (ru.hasVideo && ru.videoTrack) {
            await client.subscribe(ru, 'video');
            console.log('✅ Re-subscribed to video for user:', ru.uid);
            // Manually trigger the same logic as user-published event
            setRemoteUsers(prev => {
              const existing = prev[ru.uid as any] || { uid: ru.uid };
              existing.videoTrack = ru.videoTrack;
              existing.hasVideo = true;
              console.log(`📡 Manually added remote user video ${ru.uid}:`, existing);
              return { ...prev, [ru.uid as any]: existing };
            });
            if (onRemoteUserJoined) onRemoteUserJoined(ru.uid);
          }
          if (ru.hasAudio && ru.audioTrack) {
            await client.subscribe(ru, 'audio');
            console.log('✅ Re-subscribed to audio for user:', ru.uid);
            // Manually trigger the same logic as user-published event
            setRemoteUsers(prev => {
              const existing = prev[ru.uid as any] || { uid: ru.uid };
              existing.audioTrack = ru.audioTrack;
              existing.hasAudio = true;
              ru.audioTrack?.play();
              console.log(`📡 Manually added remote user audio ${ru.uid}:`, existing);
              return { ...prev, [ru.uid as any]: existing };
            });
          }
        } catch (e) {
          console.warn('❌ Resubscribe failed for user:', ru.uid, e);
        }
      }

      setJoined(true);
      console.log('🎉 Join process completed successfully!');
      if (onLocalJoined) onLocalJoined();
    } catch (error) {
      console.error('❌ Join process failed:', error);
      throw error;
    }
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
    console.log('🖥️ ===== SCREEN SHARE BUTTON CLICKED =====');
    console.log('🖥️ Current screenSharing state:', screenSharing);
    console.log('🖥️ Client exists:', !!clientRef.current);
    console.log('🖥️ Joined state:', joined);
    
    const client = clientRef.current;
    if (!client || !joined) {
      console.log('❌ Cannot start screen share: client not ready or not joined');
      return;
    }
    
    console.log('🖥️ Toggle screen share clicked, current state:', screenSharing);
    
    try {
      if (!screenSharingRef.current) {
        console.log('🖥️ Starting screen share...');
        
        // Create screen track with system picker
        console.log('🖥️ Creating screen video track...');
        let screenTrack;
        try {
          screenTrack = await AgoraRTC.createScreenVideoTrack({
            encoderConfig: '720p_1',
            optimizationMode: 'detail'
          }, 'auto');
          console.log('✅ Screen track created successfully:', screenTrack);
        } catch (screenTrackError) {
          console.error('❌ Failed to create screen track:', screenTrackError);
          throw screenTrackError;
        }
        
        console.log('✅ Screen track created, replacing camera track...');
        screenTrackRef.current = screenTrack;
        
        // Unpublish camera track and publish screen track
        if (localVideoTrack) {
          console.log('📹 Unpublishing camera track and publishing screen track');
          await client.unpublish(localVideoTrack);
        }
        
        console.log('📹 Publishing screen track');
        await client.publish(screenTrack);
        
        console.log('🖥️ About to set screenSharing to true...');
        setScreenSharing(true);
        console.log('✅ Screen sharing started successfully, state updated to true');
        
        // Force a re-render to see the state change
        setTimeout(() => {
          console.log('🖥️ State check after 100ms:', screenSharing);
        }, 100);
        
        // Notify that screen sharing started
        if (onScreenShareStarted) {
          onScreenShareStarted();
        }
        
        // Play the screen track immediately
        try {
          await screenTrack.play('local-player');
          console.log('✅ Screen track playing immediately');
        } catch (playError) {
          console.warn('❌ Immediate screen play failed:', playError);
          // Retry after a short delay
          setTimeout(async () => {
            try {
              await screenTrack.play('local-player');
              console.log('✅ Screen track playing after retry');
            } catch (retryError) {
              console.warn('❌ Screen track retry failed:', retryError);
            }
          }, 500);
        }
        
        // Handle user clicking "Stop Sharing" in browser bar
        screenTrack.on('track-ended', () => {
          console.log('🛑 Screen share ended by user');
          toggleScreenShare();
        });
      } else {
        console.log('🛑 Stopping screen share...');
        
        // Stop screen sharing - switch back to camera
        if (screenTrackRef.current) {
          console.log('📹 Unpublishing screen track');
          await client.unpublish(screenTrackRef.current);
          screenTrackRef.current.close();
          screenTrackRef.current = null;
        }
        
        // Publish camera track if it exists
        if (localVideoTrack) {
          console.log('📹 Publishing camera track');
          await client.publish(localVideoTrack);
        }
        
        setScreenSharing(false);
        console.log('✅ Screen sharing stopped, camera restored');
        
        // Notify that screen sharing stopped
        if (onScreenShareStopped) {
          onScreenShareStopped();
        }
      }
    } catch (error) {
      console.error('❌ Screen share error:', error);
      setScreenSharing(false);
      
      // Check if it's a permission error
      if (error.code === 'PERMISSION_DENIED') {
        console.error('🚫 Screen sharing permission denied. Please allow screen sharing in your browser.');
        setPermissionError('Screen sharing permission denied. Please allow screen sharing in your browser.');
      } else if (error.code === 'NOT_SUPPORTED') {
        console.error('🚫 Screen sharing not supported in this browser.');
        setPermissionError('Screen sharing is not supported in this browser.');
      }
      
      // Try to restore camera if screen share failed
      if (localVideoTrack) {
        try {
          await client.publish(localVideoTrack);
          console.log('✅ Camera restored after screen share error');
        } catch (restoreError) {
          console.error('❌ Failed to restore camera:', restoreError);
        }
      }
    }
  }, [joined, localVideoTrack, onScreenShareStarted, onScreenShareStopped]);

  useEffect(() => {
    // Auto-join on mount
    console.log('🚀 AgoraCall component mounted, attempting to join channel');
    if (sessionId && userId && !joined) {
      join().catch((error) => {
        console.error('❌ Failed to join Agora channel:', error);
      });
    }
    return () => {
      console.log('🚪 AgoraCall component unmounting, leaving channel');
      leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userId]);

  // Play local track when ready (camera or screen)
  useEffect(() => {
    const playLocal = async () => {
      if (screenSharing && screenTrackRef.current) {
        try { 
          console.log('🖥️ Attempting to play screen share track');
          await screenTrackRef.current.play('local-player'); 
          console.log('✅ Screen share playing successfully'); 
        } catch (e) { 
          console.warn('❌ Screen play failed:', e);
          // Retry screen play
          setTimeout(async () => {
            try {
              console.log('🔄 Retrying screen share play');
              await screenTrackRef.current?.play('local-player');
              console.log('✅ Screen share retry success');
            } catch (retryError) {
              console.warn('❌ Screen share retry failed:', retryError);
            }
          }, 1000);
        }
      } else if (localVideoTrack && !screenSharing) {
        try { 
          console.log('🎥 Attempting to play local video track');
          await localVideoTrack.play('local-player'); 
          console.log('✅ Local video playing successfully'); 
        } catch (e) { 
          console.warn('❌ Local play failed:', e); 
          // Retry once after a longer delay
          setTimeout(async () => {
            try {
              console.log('🔄 Retrying local video play');
              await localVideoTrack.play('local-player');
              console.log('✅ Local video retry success');
            } catch (retryError) {
              console.warn('❌ Local video retry failed:', retryError);
            }
          }, 1000);
        }
      }
    };
    
    // Small delay to ensure DOM is ready
    setTimeout(playLocal, 200);
  }, [localVideoTrack]);

  // Play remote tracks when they update
  useEffect(() => {
    Object.values(remoteUsers).forEach(async (u) => {
      if (u.videoTrack && u.hasVideo) {
        try { 
          console.log(`🎥 Attempting to play remote video for user ${u.uid}`);
          await u.videoTrack.play(`remote-player-${u.uid}`); 
          console.log(`✅ Remote video playing for user ${u.uid}`); 
        } catch (e) { 
          console.warn(`❌ Remote play failed for user ${u.uid}:`, e); 
          // Retry once after a delay
          setTimeout(async () => {
            try {
              console.log(`🔄 Retrying remote video for user ${u.uid}`);
              await u.videoTrack!.play(`remote-player-${u.uid}`);
              console.log(`✅ Remote video retry success for user ${u.uid}`);
            } catch (retryError) {
              console.warn(`❌ Remote retry failed for user ${u.uid}:`, retryError);
            }
          }, 500);
        }
      }
    });
  }, [remoteUsers]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 relative bg-black/90 p-2">
        {/* Main video area - changes layout based on screen sharing */}
        {(() => {
          console.log('🖥️ Rendering video layout - screenSharing:', screenSharing, 'remoteScreenSharing:', remoteScreenSharing);
          return screenSharing || remoteScreenSharing;
        })() ? (
          /* Google Meet style: Screen share takes over main area */
          <div className="w-full h-full relative">
            {/* Main screen share area */}
            <div className="w-full h-full relative bg-black rounded overflow-hidden">
              {/* Show screen share in main area - FIXED for customer full screen */}
              {screenSharing ? (
                // Designer sharing - show their screen share
                <div id="local-player" className="absolute inset-0" />
              ) : remoteScreenSharing ? (
                // Customer viewing - show remote screen share in FULL SCREEN
                Object.values(remoteUsers).filter(u => u.hasVideo).map(u => (
                  <div key={u.uid as any} className="absolute inset-0">
                    <div id={`remote-player-${u.uid}`} className="absolute inset-0" />
                  </div>
                ))
              ) : (
                // No screen sharing - show normal video
                <div className="w-full h-full flex items-center justify-center text-white/70">
                  No screen sharing active
                </div>
              )}
              
              {screenSharing && (
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs rounded flex items-center gap-1">
                  <ScreenShare className="w-3 h-3" />
                  You are sharing your screen
                </div>
              )}
              {remoteScreenSharing && !screenSharing && (
                <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 text-xs rounded flex items-center gap-1">
                  <ScreenShare className="w-3 h-3" />
                  {isDesigner ? 'Customer' : 'Designer'} is sharing screen
                </div>
              )}
            </div>
            
            {/* Picture-in-picture for camera feeds */}
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded overflow-hidden border-2 border-white/20">
              {/* Show customer's own video in PiP when screen sharing */}
              {remoteScreenSharing && !screenSharing ? (
                // Customer sees their own video in PiP
                <div className="absolute inset-0">
                  <div id="local-player" className="absolute inset-0" />
                  <div className="absolute bottom-1 right-1 bg-green-500 text-white px-1 py-0.5 text-xs rounded">
                    You
                  </div>
                </div>
              ) : (
                // Designer sees customer video in PiP
                Object.values(remoteUsers).filter(u => u.hasVideo && !remoteScreenSharing).map(u => (
                  <div key={u.uid as any} className="absolute inset-0">
                    <div id={`remote-player-${u.uid}`} className="absolute inset-0" />
                    <div className="absolute bottom-1 right-1 bg-blue-500 text-white px-1 py-0.5 text-xs rounded">
                      {isDesigner ? 'Customer' : 'Designer'}
                    </div>
                  </div>
                ))
              )}
              {Object.values(remoteUsers).filter(u => u.hasVideo && !remoteScreenSharing).length === 0 && !remoteScreenSharing && (
                <div className="w-full h-full flex items-center justify-center text-white/70 text-xs">
                  {isDesigner ? 'Customer' : 'Designer'} Camera
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Normal side-by-side layout when no screen sharing */
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Local video */}
            <div className="relative bg-black rounded overflow-hidden">
              <div id="local-player" className="absolute inset-0" />
              {!localVideoTrack && (
                <div className="w-full h-full flex items-center justify-center text-white/70 flex-col gap-2">
                  <div>Camera Off</div>
                  {permissionError && (
                    <div className="text-red-400 text-xs max-w-48 text-center bg-red-900/20 p-2 rounded">
                      <div className="mb-2">{permissionError}</div>
                      <button 
                        onClick={() => { setPermissionError(null); join(); }} 
                        className="text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              )}
              {localVideoTrack && (
                <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 text-xs rounded">
                  Camera On
                </div>
              )}
            </div>
            
            {/* Remote video */}
            <div className="relative bg-black rounded overflow-hidden">
              {Object.values(remoteUsers).filter(u => u.hasVideo).length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-white/70">Waiting for participant…</div>
              ) : (
                <>
                  {Object.values(remoteUsers).filter(u => u.hasVideo).map(u => (
                    <div key={u.uid as any} className="absolute inset-0">
                      <div id={`remote-player-${u.uid}`} className="absolute inset-0" />
                      <div className="absolute bottom-2 right-2 bg-blue-500 text-white px-2 py-1 text-xs rounded">
                        {isDesigner ? 'Customer' : 'Designer'}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="p-3 border-t bg-white flex items-center justify-center gap-3">
        <Button variant={muted ? 'destructive' : 'default'} onClick={toggleMic} className="gap-2">
          {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />} {muted ? 'Unmute' : 'Mute'}
        </Button>
        <Button variant={cameraOff ? 'destructive' : 'default'} onClick={toggleCamera} className="gap-2">
          {cameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />} {cameraOff ? 'Camera On' : 'Camera Off'}
        </Button>
                   {/* Screen sharing button - only for designer */}
                   {isDesigner && (
                     <Button
                       variant={screenSharing ? 'destructive' : 'outline'}
                       className="gap-2"
                       onClick={() => {
                         console.log('🖥️ Button clicked, current screenSharing state:', screenSharing);
                         console.log('🖥️ Current remoteScreenSharing state:', remoteScreenSharing);
                         toggleScreenShare();
                       }}
                     >
                       <ScreenShare className="w-4 h-4" /> {screenSharing ? 'Stop Sharing' : 'Share Screen'}
                     </Button>
                   )}
                   {/* Debug button for testing */}
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       console.log('🔍 DEBUG - Screen sharing states:', {
                         screenSharing,
                         remoteScreenSharing,
                         remoteUsers: Object.keys(remoteUsers),
                         hasVideo: Object.values(remoteUsers).map(u => ({ uid: u.uid, hasVideo: u.hasVideo }))
                       });
                     }}
                   >
                     Debug
                   </Button>
                   {/* Force screen sharing test button */}
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       console.log('🧪 FORCING remote screen sharing for testing');
                       setRemoteScreenSharing(true);
                     }}
                   >
                     Test Screen Share
                   </Button>
        {isDesigner && (
          <Button variant="destructive" className="gap-2" onClick={() => onEndByDesigner()}>
            <PhoneOff className="w-4 h-4" /> End Session
          </Button>
        )}
      </div>
    </div>
  );
}


