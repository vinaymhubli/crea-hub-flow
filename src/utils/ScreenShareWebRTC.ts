import { supabase } from "@/integrations/supabase/client";

export class ScreenShareManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteVideoElement: HTMLVideoElement | null = null;
  private channel: any = null;
  private roomId: string;
  private isHost: boolean;
  private onConnectionStateChange?: (state: string) => void;

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
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState || 'disconnected';
      console.log('WebRTC connection state:', state);
      this.onConnectionStateChange?.(state);
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      if (this.remoteVideoElement && event.streams[0]) {
        this.remoteVideoElement.srcObject = event.streams[0];
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.channel) {
        console.log('Sending ICE candidate');
        this.channel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            roomId: this.roomId
          }
        });
      }
    };
  }

  async startScreenShare(): Promise<void> {
    if (!this.isHost) {
      throw new Error('Only the host can start screen sharing');
    }

    try {
      console.log('Starting screen share...');
      
      this.localStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      console.log('Got display media stream');

      // Add stream to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Setup realtime channel for signaling
      this.setupRealtimeChannel();

      // Create offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      console.log('Created offer, sending to room:', this.roomId);

      // Send offer through Supabase realtime
      this.channel.send({
        type: 'broadcast',
        event: 'offer',
        payload: {
          offer,
          roomId: this.roomId
        }
      });

      // Handle stream end
      this.localStream.getVideoTracks()[0].onended = () => {
        console.log('Screen share ended');
        this.stopScreenShare();
      };

    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  async joinScreenShare(remoteVideoElement: HTMLVideoElement): Promise<void> {
    if (this.isHost) {
      throw new Error('Host cannot join their own screen share');
    }

    console.log('Joining screen share for room:', this.roomId);
    this.remoteVideoElement = remoteVideoElement;
    this.setupRealtimeChannel();
  }

  private setupRealtimeChannel() {
    console.log('Setting up realtime channel for room:', this.roomId);
    
    this.channel = supabase.channel(`screen-share-${this.roomId}`)
      .on('broadcast', { event: 'offer' }, async (payload) => {
        if (!this.isHost && payload.payload.roomId === this.roomId) {
          console.log('Received offer');
          await this.handleOffer(payload.payload.offer);
        }
      })
      .on('broadcast', { event: 'answer' }, async (payload) => {
        if (this.isHost && payload.payload.roomId === this.roomId) {
          console.log('Received answer');
          await this.handleAnswer(payload.payload.answer);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async (payload) => {
        if (payload.payload.roomId === this.roomId) {
          console.log('Received ICE candidate');
          await this.handleIceCandidate(payload.payload.candidate);
        }
      })
      .on('broadcast', { event: 'screen-share-ended' }, (payload) => {
        if (payload.payload.roomId === this.roomId) {
          console.log('Screen share ended by host');
          this.handleRemoteScreenShareEnd();
        }
      })
      .subscribe();
  }

  private async handleOffer(offer: RTCSessionDescriptionInit) {
    try {
      await this.peerConnection!.setRemoteDescription(offer);
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      console.log('Sending answer');
      this.channel.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          answer,
          roomId: this.roomId
        }
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      await this.peerConnection!.setRemoteDescription(answer);
      console.log('Set remote description with answer');
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.peerConnection!.addIceCandidate(candidate);
      console.log('Added ICE candidate');
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  private handleRemoteScreenShareEnd() {
    if (this.remoteVideoElement) {
      this.remoteVideoElement.srcObject = null;
    }
    this.cleanup();
  }

  stopScreenShare(): void {
    console.log('Stopping screen share');
    
    if (this.isHost && this.channel) {
      // Notify viewers that screen share has ended
      this.channel.send({
        type: 'broadcast',
        event: 'screen-share-ended',
        payload: {
          roomId: this.roomId
        }
      });
    }

    this.cleanup();
  }

  private cleanup(): void {
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
  }
}