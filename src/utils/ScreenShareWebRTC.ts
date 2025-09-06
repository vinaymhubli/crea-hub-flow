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

  constructor(
    roomId: string,
    isHost: boolean,
    onConnectionStateChange?: (state: string) => void
  ) {
    this.roomId = roomId;
    this.isHost = isHost;
    this.onConnectionStateChange = onConnectionStateChange;
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    const iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];

    // Add TURN servers if configured
    const turnUrl = process.env.VITE_TURN_URL;
    const turnUsername = process.env.VITE_TURN_USERNAME;
    const turnCredential = process.env.VITE_TURN_CREDENTIAL;
    
    if (turnUrl && turnUsername && turnCredential) {
      iceServers.push({
        urls: turnUrl,
        username: turnUsername,
        credential: turnCredential
      });
      console.log('TURN server configured');
    }

    const configuration: RTCConfiguration = { iceServers };
    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState || 'disconnected';
      console.log('🔗 Connection state changed:', state);
      this.onConnectionStateChange?.(state);
    };

    this.peerConnection.ontrack = (event) => {
      console.log('✅ Received remote stream with tracks:', event.streams[0]?.getTracks().length);
      if (this.remoteVideoElement && event.streams[0]) {
        this.remoteVideoElement.srcObject = event.streams[0];
        this.remoteVideoElement.play().catch(console.error);
        console.log('📺 Video element updated with remote stream');
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('📡 Generated ICE candidate:', event.candidate.type);
        this.sendSignalingMessage({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            roomId: this.roomId
          }
        });
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
        audio: true
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
          roomId: this.roomId
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

    console.log('👀 Joining screen share as viewer');
    this.remoteVideoElement = remoteVideoElement;
    this.setupRealtimeChannel();
  }

  private setupRealtimeChannel() {
    console.log('Setting up realtime channel for room:', this.roomId);
    
    this.channel = supabase.channel(`screen-share-${this.roomId}`)
      .on('broadcast', { event: 'offer' }, async (payload) => {
        if (!this.isHost && payload.payload.roomId === this.roomId) {
          console.log('📥 Received offer from host');
          await this.handleOffer(payload.payload.offer);
        }
      })
      .on('broadcast', { event: 'answer' }, async (payload) => {
        if (this.isHost && payload.payload.roomId === this.roomId) {
          console.log('📥 Received answer from viewer');
          await this.handleAnswer(payload.payload.answer);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async (payload) => {
        if (payload.payload.roomId === this.roomId) {
          console.log('📥 Received ICE candidate:', payload.payload.candidate.type);
          await this.handleIceCandidate(payload.payload.candidate);
        }
      })
      .on('broadcast', { event: 'screen-share-ended' }, (payload) => {
        if (payload.payload.roomId === this.roomId) {
          console.log('🔚 Remote screen share ended');
          this.handleRemoteScreenShareEnd();
        }
      })
      .on('broadcast', { event: 'request-offer' }, async (payload) => {
        if (this.isHost && payload.payload.roomId === this.roomId && this.localStream) {
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
          
          // If we're a viewer, request offer
          if (!this.isHost) {
            console.log('👀 Viewer requesting offer from host...');
            await this.requestOffer();
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
          roomId: this.roomId
        }
      });
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
        roomId: this.roomId
      }
    });
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
          roomId: this.roomId
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
          roomId: this.roomId
        }
      });
    }

    this.cleanup();
  }

  cleanup(): void {
    console.log('🧹 Cleaning up ScreenShareManager');
    
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
  }
}