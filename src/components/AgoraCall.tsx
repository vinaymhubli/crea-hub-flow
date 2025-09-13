import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
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
  onSessionEnd?: () => void;
}

// NOTE: We intentionally keep this component minimal and focused on A/V join/leave.
// Screen-sharing continues to be handled by the existing ScreenShareModal to avoid regressions.
const AgoraCall = forwardRef<any, AgoraCallProps>(({ sessionId, userId, isDesigner, onEndByDesigner, onLocalJoined, onRemoteUserJoined, onRemoteUserLeft, onOpenShare, onScreenShareStarted, onScreenShareStopped, onSessionEnd }, ref) => {
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
          // Stop screen sharing if active
          if (screenSharingRef.current && screenTrackRef.current) {
            console.log('🛑 Stopping screen share on unmount');
            try {
              clientRef.current.unpublish(screenTrackRef.current);
              screenTrackRef.current.close();
              screenTrackRef.current = null;
            } catch (screenError) {
              console.warn('❌ Error stopping screen share on unmount:', screenError);
            }
          }
          
          // Force stop all media tracks
          if (localAudioTrackRef.current) {
            try {
              localAudioTrackRef.current.stop();
              localAudioTrackRef.current.close();
            } catch (error) {
              console.warn('❌ Error stopping audio on unmount:', error);
            }
          }
          if (localVideoTrackRef.current) {
            try {
              localVideoTrackRef.current.stop();
              localVideoTrackRef.current.close();
            } catch (error) {
              console.warn('❌ Error stopping video on unmount:', error);
            }
          }
          
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
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<Record<string, RemoteUser>>({});
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);
  const screenSharingRef = useRef(false);
  
  // State for fullscreen video selection
  const [fullscreenVideo, setFullscreenVideo] = useState<'local' | 'remote' | 'screen' | null>(null);

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
                                 track.label.includes('Desktop');
            
            if (isScreenShare) {
              console.log('🖥️ REMOTE SCREEN SHARING DETECTED - track label:', track.label, 'trackMediaType:', user.videoTrack.trackMediaType);
              setRemoteScreenSharing(true);
            } else {
              console.log('🖥️ Regular video track - track label:', track.label, 'trackMediaType:', user.videoTrack.trackMediaType);
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
                                 track.label.includes('Desktop');
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
      localAudioTrackRef.current = mic;
      localVideoTrackRef.current = cam;
      
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
      console.log('🛑 AgoraCall: Starting media cleanup...');
      
      // Stop screen sharing first if active
      if (screenSharingRef.current && screenTrackRef.current) {
        console.log('🛑 Stopping screen share before leaving session');
        try {
          await client.unpublish(screenTrackRef.current);
          screenTrackRef.current.close();
          screenTrackRef.current = null;
          setScreenSharing(false);
          console.log('✅ Screen share stopped before leaving');
        } catch (screenError) {
          console.warn('❌ Error stopping screen share before leave:', screenError);
        }
      }
      
      // Stop all local media tracks
      if (localAudioTrack) {
        console.log('🛑 Stopping microphone track');
        try {
          localAudioTrack.stop();
          localAudioTrack.close();
        } catch (error) {
          console.warn('❌ Error stopping microphone track:', error);
        }
      }
      if (localVideoTrack) {
        console.log('🛑 Stopping camera track');
        try {
          localVideoTrack.stop();
          localVideoTrack.close();
        } catch (error) {
          console.warn('❌ Error stopping camera track:', error);
        }
      }
      
      // Unpublish all tracks and leave channel
      await client.unpublish();
      await client.leave();
      
      console.log('✅ All media tracks stopped and left channel');
    } finally {
      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      localAudioTrackRef.current = null;
      localVideoTrackRef.current = null;
      setRemoteUsers({});
      setJoined(false);
      setScreenSharing(false);
      setRemoteScreenSharing(false);
      setMuted(false);
      setCameraOff(false);
      screenTrackRef.current = null;
    }
  }, [localAudioTrack, localVideoTrack, screenSharing]);

  // Session end handler - called when session ends
  const handleSessionEnd = useCallback(async () => {
    console.log('🛑 AgoraCall: Session end triggered, stopping all media...');
    await leave();
    if (onSessionEnd) {
      onSessionEnd();
    }
  }, [leave, onSessionEnd]);

  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    leave: handleSessionEnd,
    stopAllMedia: handleSessionEnd
  }), [handleSessionEnd]);

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
      leave().catch((error) => {
        console.error('❌ Error during leave on unmount:', error);
      });
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
        // Play on main local-player
        try { 
          console.log('🎥 Attempting to play local video track on main player');
          await localVideoTrack.play('local-player'); 
          console.log('✅ Local video playing successfully on main player'); 
        } catch (e) { 
          console.warn('❌ Local play failed on main player:', e); 
        }
        
        // Also try to play on thumbnail if element exists
        const thumbElement = document.getElementById('local-player-thumb');
        if (thumbElement) {
          try {
            console.log('🎥 Attempting to play local video on thumbnail');
            await localVideoTrack.play('local-player-thumb');
            console.log('✅ Local video playing on thumbnail');
          } catch (e) {
            console.warn('❌ Local thumbnail play failed:', e);
          }
        }
      }
    };
    
    // Small delay to ensure DOM is ready
    setTimeout(playLocal, 200);
  }, [localVideoTrack, screenSharing, fullscreenVideo]);

  // Play remote tracks when they update
  useEffect(() => {
    Object.values(remoteUsers).forEach(async (u) => {
      if (u.videoTrack && u.hasVideo) {
        // Play on main remote player
        try { 
          console.log(`🎥 Attempting to play remote video for user ${u.uid} on main player`);
          await u.videoTrack.play(`remote-player-${u.uid}`); 
          console.log(`✅ Remote video playing for user ${u.uid} on main player`); 
        } catch (e) { 
          console.warn(`❌ Remote play failed for user ${u.uid} on main player:`, e); 
        }
        
        // Also try to play on thumbnail if element exists
        const thumbElement = document.getElementById(`remote-player-${u.uid}-thumb`);
        if (thumbElement) {
          try {
            console.log(`🎥 Attempting to play remote video for user ${u.uid} on thumbnail`);
            await u.videoTrack.play(`remote-player-${u.uid}-thumb`);
            console.log(`✅ Remote video playing for user ${u.uid} on thumbnail`);
          } catch (e) {
            console.warn(`❌ Remote thumbnail play failed for user ${u.uid}:`, e);
          }
        }
      }
    });
  }, [remoteUsers, fullscreenVideo]);

  // Helper function to switch video to fullscreen
  const handleVideoClick = useCallback((videoType: 'local' | 'remote' | 'screen') => {
    setFullscreenVideo(fullscreenVideo === videoType ? null : videoType);
  }, [fullscreenVideo]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Main video area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Google Meet style video layout */}
        {screenSharing || remoteScreenSharing ? (
          /* Screen sharing layout */
          <div className="w-full h-full relative">
            {/* Main video area */}
            <div className="w-full h-full relative bg-black">
              {/* Screen share or selected fullscreen video */}
              {fullscreenVideo === 'screen' || (!fullscreenVideo && (screenSharing || remoteScreenSharing)) ? (
                <div className="w-full h-full relative">
                  {screenSharing ? (
                    <div 
                      id="local-player" 
                      className="absolute inset-0 cursor-pointer"
                      onClick={() => handleVideoClick('screen')}
                    />
                  ) : (
                    Object.values(remoteUsers).filter(u => u.hasVideo).map(u => (
                      <div key={u.uid as any} className="absolute inset-0">
                        <div 
                          id={`remote-player-${u.uid}`} 
                          className="absolute inset-0 cursor-pointer"
                          onClick={() => handleVideoClick('screen')}
                        />
                      </div>
                    ))
                  )}
                  
                  {/* Screen sharing indicator */}
                  <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-lg">
                    <ScreenShare className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {screenSharing ? 'You are presenting' : `${isDesigner ? 'Customer' : 'Designer'} is presenting`}
                    </span>
                  </div>
                </div>
              ) : fullscreenVideo === 'local' ? (
                /* Local video fullscreen */
                <div className="w-full h-full relative">
                  <div 
                    id="local-player" 
                    className="absolute inset-0 cursor-pointer"
                    onClick={() => handleVideoClick('local')}
                  />
                  <div className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg">
                    <span className="text-sm font-medium">You (Fullscreen)</span>
                  </div>
                </div>
              ) : fullscreenVideo === 'remote' ? (
                /* Remote video fullscreen */
                <div className="w-full h-full relative">
                  {Object.values(remoteUsers).filter(u => u.hasVideo).map(u => (
                    <div key={u.uid as any} className="absolute inset-0">
                      <div 
                        id={`remote-player-${u.uid}`} 
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => handleVideoClick('remote')}
                      />
                    </div>
                  ))}
                  <div className="absolute top-4 left-4 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg">
                    <span className="text-sm font-medium">{isDesigner ? 'Customer' : 'Designer'} (Fullscreen)</span>
                  </div>
                </div>
              ) : (
                /* Default screen share view */
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <ScreenShare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No screen being shared</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video thumbnails strip at bottom */}
            <div className="absolute bottom-4 left-4 right-4 flex gap-3 justify-center">
              {/* Local video thumbnail */}
              {localVideoTrack && (
                <div 
                  className={`relative bg-black rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                    fullscreenVideo === 'local' ? 'border-green-400 shadow-lg shadow-green-400/30' : 'border-white/20'
                  } ${fullscreenVideo ? 'w-24 h-16' : 'w-32 h-20'}`}
                  onClick={() => handleVideoClick('local')}
                >
                  <div id="local-player-thumb" className="absolute inset-0" />
                  <div className="absolute bottom-1 left-1 bg-green-500/90 text-white px-1.5 py-0.5 text-xs rounded backdrop-blur-sm">
                    You
                  </div>
                  {fullscreenVideo === 'local' && (
                    <div className="absolute inset-0 bg-green-400/20 flex items-center justify-center">
                      <div className="bg-green-500 text-white p-1 rounded">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Remote video thumbnail */}
              {Object.values(remoteUsers).filter(u => u.hasVideo).map(u => (
                <div 
                  key={u.uid as any}
                  className={`relative bg-black rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                    fullscreenVideo === 'remote' ? 'border-blue-400 shadow-lg shadow-blue-400/30' : 'border-white/20'
                  } ${fullscreenVideo ? 'w-24 h-16' : 'w-32 h-20'}`}
                  onClick={() => handleVideoClick('remote')}
                >
                  <div id={`remote-player-${u.uid}-thumb`} className="absolute inset-0" />
                  <div className="absolute bottom-1 left-1 bg-blue-500/90 text-white px-1.5 py-0.5 text-xs rounded backdrop-blur-sm">
                    {isDesigner ? 'Customer' : 'Designer'}
                  </div>
                  {fullscreenVideo === 'remote' && (
                    <div className="absolute inset-0 bg-blue-400/20 flex items-center justify-center">
                      <div className="bg-blue-500 text-white p-1 rounded">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
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
                {fullscreenVideo === 'local' ? (
                  <div className="w-full h-full relative">
                    <div 
                      id="local-player" 
                      className="absolute inset-0 cursor-pointer"
                      onClick={() => handleVideoClick('local')}
                    />
                    <div className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg">
                      <span className="text-sm font-medium">You (Fullscreen)</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    {Object.values(remoteUsers).filter(u => u.hasVideo).map(u => (
                      <div key={u.uid as any} className="absolute inset-0">
                        <div 
                          id={`remote-player-${u.uid}`} 
                          className="absolute inset-0 cursor-pointer"
                          onClick={() => handleVideoClick('remote')}
                        />
                      </div>
                    ))}
                    <div className="absolute top-4 left-4 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg">
                      <span className="text-sm font-medium">{isDesigner ? 'Customer' : 'Designer'} (Fullscreen)</span>
                    </div>
                  </div>
                )}

                {/* Other video as thumbnail */}
                <div className="absolute bottom-4 right-4">
                  {fullscreenVideo === 'local' ? (
                    /* Show remote as thumbnail */
                    Object.values(remoteUsers).filter(u => u.hasVideo).map(u => (
                      <div 
                        key={u.uid as any}
                        className="relative bg-black rounded-lg overflow-hidden border-2 border-white/20 cursor-pointer w-32 h-20 hover:scale-105 transition-transform"
                        onClick={() => handleVideoClick('remote')}
                      >
                        <div id={`remote-player-${u.uid}-thumb`} className="absolute inset-0" />
                        <div className="absolute bottom-1 left-1 bg-blue-500/90 text-white px-1.5 py-0.5 text-xs rounded backdrop-blur-sm">
                          {isDesigner ? 'Customer' : 'Designer'}
                        </div>
                      </div>
                    ))
                  ) : localVideoTrack ? (
                    /* Show local as thumbnail */
                    <div 
                      className="relative bg-black rounded-lg overflow-hidden border-2 border-white/20 cursor-pointer w-32 h-20 hover:scale-105 transition-transform"
                      onClick={() => handleVideoClick('local')}
                    >
                      <div id="local-player-thumb" className="absolute inset-0" />
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
                    onClick={() => handleVideoClick('local')}
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
                              <p className="text-red-300 text-sm mb-2">{permissionError}</p>
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
                    onClick={() => handleVideoClick('remote')}
                  >
                    {Object.values(remoteUsers).filter(u => u.hasVideo).length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <div className="text-center text-gray-300">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                            <Video className="w-8 h-8" />
                          </div>
                          <p className="text-lg font-medium">Waiting for participant</p>
                          <p className="text-sm text-gray-400 mt-2">They will appear here when they join</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {Object.values(remoteUsers).filter(u => u.hasVideo).map(u => (
                          <div key={u.uid as any} className="absolute inset-0">
                            <div id={`remote-player-${u.uid}`} className="absolute inset-0" />
                            <div className="absolute bottom-4 left-4 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg">
                              <span className="text-sm font-medium">{isDesigner ? 'Customer' : 'Designer'}</span>
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
            variant={muted ? 'destructive' : 'outline'} 
            size="lg"
            className={`rounded-full w-12 h-12 p-0 transition-all duration-200 ${
              muted ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-gray-100'
            }`}
            onClick={toggleMic}
          >
            {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          {/* Camera button */}
          <Button 
            variant={cameraOff ? 'destructive' : 'outline'} 
            size="lg"
            className={`rounded-full w-12 h-12 p-0 transition-all duration-200 ${
              cameraOff ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-gray-100'
            }`}
            onClick={toggleCamera}
          >
            {cameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </Button>
          
          {/* Screen share button - only for designer */}
          {isDesigner && (
            <Button
              variant={screenSharing ? 'destructive' : 'outline'}
              size="lg"
              className={`rounded-full w-12 h-12 p-0 transition-all duration-200 ${
                screenSharing ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-gray-100'
              }`}
              onClick={toggleScreenShare}
            >
              <ScreenShare className="w-5 h-5" />
            </Button>
          )}
          
          {/* Stop & Send Request Approval button - only for designer */}
          {isDesigner && (
            <Button 
              variant="destructive" 
              size="lg"
              className="rounded-full w-12 h-12 p-0 bg-red-600 hover:bg-red-700 ml-2"
              onClick={() => onEndByDesigner()}
              title="STOP & SEND REQUEST APPROVAL"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

AgoraCall.displayName = 'AgoraCall';

export default AgoraCall;


