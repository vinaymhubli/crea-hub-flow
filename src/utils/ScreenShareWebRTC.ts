import { supabase } from "@/integrations/supabase/client";

export class ScreenShareManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteVideoElement: HTMLVideoElement | null = null;
  private channel: any = null;
  private roomId: string;
  private isHost: boolean;
  private onConnectionStateChange?: (state: string) => void;
  private pendingRemoteCandidates: RTCIceCandidateInit[] = [];
  private isChannelReady = false;
  private messageQueue: any[] = [];
  private senderId: string;
  private offerRequestInterval: number | null = null;
  private bufferedStream: MediaStream | null = null;
  private diagnosticsInterval?: NodeJS.Timeout;
  private iceFailureTimeout?: NodeJS.Timeout;

  constructor(
    roomId: string,
    isHost: boolean,
    onConnectionStateChange?: (state: string) => void
  ) {
    this.roomId = roomId;
    this.isHost = isHost;
    this.onConnectionStateChange = onConnectionStateChange;
    this.senderId = crypto.randomUUID();
    console.log(`🆔 ScreenShareManager created - Room: ${roomId}, Host: ${isHost}, ID: ${this.senderId}`);
    this.setupPeerConnection();
    this.startDiagnostics();
  }

  private setupPeerConnection() {
    const iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];

    // Add TURN servers if configured
    const turnUrl = import.meta.env.VITE_TURN_URL;
    const turnUsername = import.meta.env.VITE_TURN_USERNAME;
    const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;
    
    if (turnUrl && turnUsername && turnCredential) {
      iceServers.push({
        urls: turnUrl,
        username: turnUsername,
        credential: turnCredential
      });
      console.log('🔄 TURN server configured:', turnUrl);
    } else {
      console.warn('⚠️ TURN server not configured - connection may fail on restrictive networks');
      console.log('💡 To fix: Add TURN server credentials to .env:');
      console.log('   VITE_TURN_URL=turn:your-server.com:3478');
      console.log('   VITE_TURN_USERNAME=your-username');
      console.log('   VITE_TURN_CREDENTIAL=your-credential');
    }

    console.log('🌐 ICE servers configured:', iceServers.length, 'servers');

    const configuration: RTCConfiguration = { iceServers };
    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState || 'disconnected';
      console.log('🔗 Connection state changed:', state);
      this.onConnectionStateChange?.(state);
      
      // Auto-recover on failure
      if (state === 'failed' || state === 'disconnected') {
        console.log('🔄 Connection failed/disconnected, attempting recovery...');
        setTimeout(() => {
          if (this.isHost && this.localStream) {
            this.resendOffer();
          } else if (!this.isHost) {
            this.requestOffer();
          }
        }, 2000);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const iceState = this.peerConnection?.iceConnectionState || 'disconnected';
      console.log('🧊 ICE connection state changed:', iceState);
      
      if (iceState === 'failed') {
        console.warn('🔥 ICE connection failed - may need TURN servers');
        this.handleIceConnectionFailure();
      } else if (iceState === 'disconnected') {
        console.warn('📡 ICE disconnected - starting recovery timer');
        this.startIceFailureTimer();
      } else if (iceState === 'connected' || iceState === 'completed') {
        console.log('✅ ICE connection established');
        this.clearIceFailureTimer();
      }
    };

    this.peerConnection.onsignalingstatechange = () => {
      const signalingState = this.peerConnection?.signalingState || 'closed';
      console.log('📡 Signaling state changed:', signalingState);
    };

    this.peerConnection.ontrack = (event) => {
      console.log('✅ Received remote stream with tracks:', event.streams[0]?.getTracks().length);
      if (event.streams[0]) {
        this.bufferedStream = event.streams[0];
        if (this.remoteVideoElement) {
          this.remoteVideoElement.srcObject = event.streams[0];
          this.remoteVideoElement.play().catch(console.error);
          console.log('📺 Video element updated with remote stream');
        } else {
          console.log('📺 Buffering stream (video element not ready)');
        }
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Generated ICE candidate:', {
          type: event.candidate.type,
          protocol: event.candidate.protocol,
          address: event.candidate.address?.substring(0, 10) + '...',
          foundation: event.candidate.foundation
        });
        this.sendSignalingMessage({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            roomId: this.roomId,
            senderId: this.senderId
          }
        });
      } else {
        console.log('🧊 ICE candidate gathering complete');
      }
    };

    // Add transceivers for better setup (if viewer)
    if (!this.isHost) {
      console.log('📺 Adding transceivers for receiving');
      this.peerConnection.addTransceiver('video', { direction: 'recvonly' });
      this.peerConnection.addTransceiver('audio', { direction: 'recvonly' });
    }
  }

  async startScreenShare(): Promise<void> {
    if (!this.isHost) {
      throw new Error('Only the host can start screen sharing');
    }

    try {
      console.log('🎬 Starting screen share...');
      
      this.localStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false // Simplified for better compatibility
      });

      console.log('📹 Got display media with tracks:', this.localStream.getTracks().length);

      // Add stream to peer connection
      this.localStream.getTracks().forEach(track => {
        console.log('➕ Adding track:', track.kind);
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Setup realtime channel for signaling
      this.setupRealtimeChannel();

      // Create offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      console.log('📤 Created and set local description (offer)');

      // Send offer through Supabase realtime
      this.sendSignalingMessage({
        type: 'broadcast',
        event: 'offer',
        payload: {
          offer,
          roomId: this.roomId,
          senderId: this.senderId
        }
      });

      // Handle stream end
      this.localStream.getVideoTracks()[0].onended = () => {
        console.log('Screen share ended by user');
        this.stopScreenShare();
      };

    } catch (error) {
      console.error('❌ Error starting screen share:', error);
      throw error;
    }
  }

  async joinScreenShare(remoteVideoElement: HTMLVideoElement): Promise<void> {
    if (this.isHost) {
      throw new Error('Host cannot join their own screen share');
    }

    console.log('👀 Joining screen share as viewer - setting up video element');
    this.remoteVideoElement = remoteVideoElement;
    
    // Attach buffered stream if available
    if (this.bufferedStream) {
      console.log('📦 Attaching buffered stream to video element');
      this.remoteVideoElement.srcObject = this.bufferedStream;
      this.remoteVideoElement.play().catch(console.error);
      console.log('✅ Buffered stream attached successfully');
    }
    
    console.log('🔌 Setting up realtime channel for viewer...');
    this.setupRealtimeChannel();
  }

  async resetAndReconnect(remoteVideoElement: HTMLVideoElement): Promise<void> {
    console.log('🔄 Resetting and reconnecting...');
    
    // Clean up existing connection
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    if (this.offerRequestInterval) {
      clearInterval(this.offerRequestInterval);
      this.offerRequestInterval = null;
    }
    
    // Reset state
    this.isChannelReady = false;
    this.messageQueue = [];
    this.pendingRemoteCandidates = [];
    
    // Setup fresh connection
    this.setupPeerConnection();
    await this.joinScreenShare(remoteVideoElement);
  }

  private setupRealtimeChannel() {
    console.log('Setting up realtime channel for room:', this.roomId);
    
    // Remove existing channel if any
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
    
    this.channel = supabase.channel(`screen-share-${this.roomId}`)
      .on('broadcast', { event: 'offer' }, async (payload) => {
        if (!this.isHost && payload.payload.roomId === this.roomId && payload.payload.senderId !== this.senderId) {
          console.log('📥 Received offer from host');
          await this.handleOffer(payload.payload.offer);
        }
      })
      .on('broadcast', { event: 'answer' }, async (payload) => {
        if (this.isHost && payload.payload.roomId === this.roomId && payload.payload.senderId !== this.senderId) {
          console.log('📥 Received answer from viewer');
          await this.handleAnswer(payload.payload.answer);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async (payload) => {
        if (payload.payload.roomId === this.roomId && payload.payload.senderId !== this.senderId) {
          console.log('📥 Received ICE candidate:', payload.payload.candidate.type);
          await this.handleIceCandidate(payload.payload.candidate);
        }
      })
      .on('broadcast', { event: 'screen-share-ended' }, (payload) => {
        if (payload.payload.roomId === this.roomId && payload.payload.senderId !== this.senderId) {
          console.log('🔚 Remote screen share ended');
          this.handleRemoteScreenShareEnd();
        }
      })
      .on('broadcast', { event: 'request-offer' }, async (payload) => {
        if (this.isHost && payload.payload.roomId === this.roomId && payload.payload.senderId !== this.senderId && this.localStream) {
          console.log('📞 Received request for offer, re-sending...');
          await this.resendOffer();
        }
      })
      .subscribe(async (status) => {
        console.log('📡 Channel subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          this.isChannelReady = true;
          
          // Send any queued messages
          while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.channel?.send(message);
            console.log('📤 Sent queued message:', message.event);
          }
          
          // If we're a viewer, start requesting offers periodically
          if (!this.isHost) {
            console.log('👀 Viewer requesting offer from host...');
            await this.requestOffer();
            this.startOfferRequestInterval();
          }
        }
      });
  }

  private async handleOffer(offer: RTCSessionDescriptionInit) {
    try {
      await this.peerConnection!.setRemoteDescription(offer);
      console.log('✅ Set remote description (offer)');
      
      // Process any buffered ICE candidates
      await this.processPendingCandidates();
      
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);
      console.log('📤 Created and set local description (answer)');

      // Send answer back
      this.sendSignalingMessage({
        type: 'broadcast',
        event: 'answer',
        payload: {
          answer,
          roomId: this.roomId,
          senderId: this.senderId
        }
      });
      
      // Stop requesting offers once we have a connection
      if (this.offerRequestInterval) {
        clearInterval(this.offerRequestInterval);
        this.offerRequestInterval = null;
        console.log('✅ Stopped offer request interval (connected)');
      }
    } catch (error) {
      console.error('❌ Error handling offer:', error);
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      await this.peerConnection!.setRemoteDescription(answer);
      console.log('✅ Set remote description (answer)');
      
      // Process any buffered ICE candidates
      await this.processPendingCandidates();
    } catch (error) {
      console.error('❌ Error handling answer:', error);
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    // Buffer candidates if remote description is not set yet
    if (!this.peerConnection?.remoteDescription) {
      console.log('🔄 Buffering ICE candidate (no remote description yet)');
      this.pendingRemoteCandidates.push(candidate);
      return;
    }
    
    try {
      await this.peerConnection!.addIceCandidate(candidate);
      console.log('✅ Added ICE candidate');
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  }

  private async processPendingCandidates(): Promise<void> {
    console.log(`🔄 Processing ${this.pendingRemoteCandidates.length} buffered ICE candidates`);
    
    for (const candidate of this.pendingRemoteCandidates) {
      try {
        await this.peerConnection?.addIceCandidate(candidate);
        console.log('✅ Added buffered ICE candidate');
      } catch (error) {
        console.error('❌ Error adding buffered ICE candidate:', error);
      }
    }
    
    this.pendingRemoteCandidates = [];
  }

  private sendSignalingMessage(message: any): void {
    if (this.isChannelReady && this.channel) {
      this.channel.send(message);
      console.log('📤 Sent message:', message.event);
    } else {
      console.log('🔄 Queuing message (channel not ready):', message.event);
      this.messageQueue.push(message);
    }
  }

  private async requestOffer(): Promise<void> {
    console.log('📞 Requesting offer from host...');
    this.sendSignalingMessage({
      type: 'broadcast',
      event: 'request-offer',
      payload: {
        roomId: this.roomId,
        senderId: this.senderId
      }
    });
  }

  private startOfferRequestInterval(): void {
    // Clear existing interval if any
    if (this.offerRequestInterval) {
      clearInterval(this.offerRequestInterval);
    }
    
    this.offerRequestInterval = window.setInterval(() => {
      // Stop requesting if we have a remote description or are connected
      if (this.peerConnection?.remoteDescription || this.peerConnection?.connectionState === 'connected') {
        if (this.offerRequestInterval) {
          clearInterval(this.offerRequestInterval);
          this.offerRequestInterval = null;
          console.log('✅ Stopped offer request interval (success)');
        }
        return;
      }
      
      console.log('🔄 Requesting offer (interval)...');
      this.requestOffer();
    }, 2000);
  }

  private async resendOffer(): Promise<void> {
    if (!this.isHost || !this.peerConnection || !this.localStream) {
      return;
    }

    try {
      console.log('🔄 Resending offer with ICE restart...');
      
      // Create new offer with ICE restart to reset connection
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);

      // Send the new offer
      this.sendSignalingMessage({
        type: 'broadcast',
        event: 'offer',
        payload: {
          offer,
          roomId: this.roomId,
          senderId: this.senderId
        }
      });
    } catch (error) {
      console.error('❌ Error resending offer:', error);
    }
  }

  private handleRemoteScreenShareEnd() {
    console.log('🔚 Remote screen share ended');
    if (this.remoteVideoElement) {
      this.remoteVideoElement.srcObject = null;
    }
    this.onConnectionStateChange?.('disconnected');
  }

  stopScreenShare(): void {
    console.log('🛑 Stopping screen share');
    
    if (this.isHost && this.channel) {
      // Notify viewers that screen share has ended
      this.sendSignalingMessage({
        type: 'broadcast',
        event: 'screen-share-ended',
        payload: {
          roomId: this.roomId,
          senderId: this.senderId
        }
      });
    }

    this.cleanup();
  }

  private startDiagnostics() {
    this.diagnosticsInterval = setInterval(() => {
      if (this.peerConnection) {
        console.log('📊 Connection Diagnostics:', {
          connectionState: this.peerConnection.connectionState,
          iceConnectionState: this.peerConnection.iceConnectionState,
          signalingState: this.peerConnection.signalingState,
          localDescription: !!this.peerConnection.localDescription,
          remoteDescription: !!this.peerConnection.remoteDescription,
          hasLocalStream: !!this.localStream,
          hasRemoteVideo: !!this.remoteVideoElement,
          channelReady: this.isChannelReady,
          isHost: this.isHost
        });
        
        // Run detailed stats every 30 seconds
        if (Date.now() % 30000 < 5000) {
          this.runConnectionStats();
        }
      }
    }, 10000); // Every 10 seconds
  }

  private runConnectionStats() {
    if (!this.peerConnection) return;
    
    this.peerConnection.getStats().then(stats => {
      let localCandidates = 0;
      let remoteCandidates = 0;
      let candidatePairs = 0;
      let activePairs = 0;
      
      stats.forEach(report => {
        if (report.type === 'local-candidate') localCandidates++;
        if (report.type === 'remote-candidate') remoteCandidates++;
        if (report.type === 'candidate-pair') {
          candidatePairs++;
          if (report.state === 'succeeded') activePairs++;
        }
      });
      
      console.log('📈 ICE Statistics:', {
        localCandidates,
        remoteCandidates,
        candidatePairs,
        activePairs,
        hasConnection: activePairs > 0
      });
      
      if (localCandidates === 0) {
        console.error('❌ No local ICE candidates - check network connectivity');
      }
      if (remoteCandidates === 0 && this.peerConnection.remoteDescription) {
        console.error('❌ No remote ICE candidates - peer connection issue');
      }
      if (candidatePairs > 0 && activePairs === 0) {
        console.warn('⚠️ ICE candidates found but no successful pairs - may need TURN server');
      }
    }).catch(err => {
      console.error('❌ Failed to get connection stats:', err);
    });
  }

  private handleIceConnectionFailure() {
    console.log('🔄 Handling ICE connection failure...');
    
    if (this.isHost) {
      console.log('🏠 Host attempting ICE restart...');
      this.peerConnection?.createOffer({ iceRestart: true })
        .then(offer => {
          return this.peerConnection!.setLocalDescription(offer);
        })
        .then(() => {
          this.sendSignalingMessage({
            type: 'broadcast',
            event: 'offer',
            payload: {
              offer: this.peerConnection!.localDescription,
              roomId: this.roomId,
              senderId: this.senderId
            }
          });
          console.log('🔄 ICE restart offer sent');
        })
        .catch(err => {
          console.error('❌ ICE restart failed:', err);
        });
    } else {
      console.log('👤 Viewer requesting new offer after ICE failure...');
      this.requestOffer();
    }
  }

  private startIceFailureTimer() {
    this.clearIceFailureTimer();
    this.iceFailureTimeout = setTimeout(() => {
      if (this.peerConnection?.iceConnectionState === 'disconnected') {
        console.warn('⏰ ICE disconnected for >5s, treating as failure');
        this.handleIceConnectionFailure();
      }
    }, 5000);
  }

  private clearIceFailureTimer() {
    if (this.iceFailureTimeout) {
      clearTimeout(this.iceFailureTimeout);
      this.iceFailureTimeout = undefined;
    }
  }

  cleanup(): void {
    console.log('🧹 Cleaning up ScreenShareManager');
    
    // Clear all timers
    if (this.diagnosticsInterval) {
      clearInterval(this.diagnosticsInterval);
      this.diagnosticsInterval = undefined;
    }
    
    if (this.offerRequestInterval) {
      clearInterval(this.offerRequestInterval);
      this.offerRequestInterval = null;
    }
    
    this.clearIceFailureTimer();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    if (this.remoteVideoElement) {
      this.remoteVideoElement.srcObject = null;
      this.remoteVideoElement = null;
    }

    // Reset state
    this.isChannelReady = false;
    this.messageQueue = [];
    this.pendingRemoteCandidates = [];
    this.bufferedStream = null;
    
    console.log('✅ Cleanup complete');
  }
}