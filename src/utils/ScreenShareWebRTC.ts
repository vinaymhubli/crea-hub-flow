import AgoraRTC, { IAgoraRTCClient, ILocalVideoTrack, IRemoteUser } from "agora-rtc-sdk-ng";
import { supabase } from "@/integrations/supabase/client";

export class ScreenShareManager {
  private client: IAgoraRTCClient | null = null;
  private screenTrack: ILocalVideoTrack | null = null;
  private remoteVideoElement: HTMLVideoElement | null = null;
  private channel: any = null;
  private roomId: string;
  private agoraChannel: string; // Short 4-8 character channel name
  private isHost: boolean;
  private onConnectionStateChange?: (state: string) => void;
  private senderId: string;
  private isChannelReady = false;
  private messageQueue: any[] = [];

  constructor(
    roomId: string,
    isHost: boolean,
    onConnectionStateChange?: (state: string) => void
  ) {
    this.roomId = roomId;
    this.agoraChannel = this.generateChannelName(roomId); // Generate 4-8 char channel
    this.isHost = isHost;
    this.onConnectionStateChange = onConnectionStateChange;
    this.senderId = crypto.randomUUID();
    console.log(`🆔 ScreenShareManager (Agora) - Room: ${roomId}, Agora Channel: ${this.agoraChannel}, Host: ${isHost}, ID: ${this.senderId}`);
  }

  private generateChannelName(roomId: string): string {
    // Generate a consistent 6-character channel name from room ID
    const hash = roomId.replace(/-/g, '').substring(0, 6).toLowerCase();
    return hash.length >= 4 ? hash : (hash + '0000').substring(0, 6);
  }

  private async fetchToken(uid: string, asSharer: boolean): Promise<{
    appId: string;
    rtcToken: string;
    rtmToken: string;
  }> {
    try {
      console.log("🎫 Requesting token for:", { uid, channel: this.agoraChannel, asSharer });

      const res = await fetch("/api/agora/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, channel: this.agoraChannel, asSharer })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("❌ Token fetch failed:", res.status, err);
        throw new Error(err.error || `Failed to fetch token: ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ Token fetched successfully");
      return { appId: data.appId, rtcToken: data.rtcToken, rtmToken: data.rtmToken };
    } catch (error) {
      console.error("❌ Token fetch error:", error);
      throw new Error(`Token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private setupRealtimeChannel() {
    console.log("Setting up Supabase broadcast channel for notifications:", this.roomId, "Agora Channel:", this.agoraChannel);
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
    this.channel = supabase.channel(`screen-share-${this.roomId}`)
      .subscribe((status) => {
        console.log("📡 Notification channel status:", status);
        if (status === "SUBSCRIBED") {
          this.isChannelReady = true;
          while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.channel?.send(message);
          }
        }
      });
  }

  private sendBroadcast(message: any): void {
    if (this.isChannelReady && this.channel) {
      this.channel.send(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  async startScreenShare(): Promise<void> {
    if (!this.isHost) throw new Error("Only the host can start screen sharing");

    this.setupRealtimeChannel();

    try {
      const uid = this.senderId;
      const { appId, rtcToken } = await this.fetchToken(uid, true);

      this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      this.client.on("connection-state-change", (cur) => {
        const map = {
          CONNECTED: "connected",
          CONNECTING: "connecting",
          DISCONNECTED: "disconnected",
          RECONNECTING: "connecting"
        } as Record<string, string>;
        this.onConnectionStateChange?.(map[cur] || "connecting");
      });

      await this.client.join(appId, this.agoraChannel, rtcToken, uid);

      // Check if we're in a secure context (HTTPS) for screen capture
      if (!window.isSecureContext) {
        throw new Error("Screen sharing requires a secure context (HTTPS)");
      }

      const screenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: {
          width: 1920,
          height: 1080,
          frameRate: 30,
          bitrateMin: 800,
          bitrateMax: 2000
        },
        optimizationMode: "detail"
      }, false);

      // Handle both single track and array of tracks
      if (Array.isArray(screenTrack)) {
        console.log("📹 Got screen tracks array:", screenTrack.length);
        this.screenTrack = screenTrack[0]; // Video track is first
        await this.client.publish(screenTrack); // Publish all tracks
      } else {
        console.log("📹 Got single screen track");
        this.screenTrack = screenTrack as ILocalVideoTrack;
        await this.client.publish([this.screenTrack]);
      }
      this.onConnectionStateChange?.("connected");

      // Fire existing notification for UI (re-using 'offer' event)
      this.sendBroadcast({
        type: "broadcast",
        event: "offer",
        payload: {
          roomId: this.roomId,
          senderId: this.senderId,
          agoraChannel: this.agoraChannel
        }
      });

      const mediaTrack = this.screenTrack as any;
      if (mediaTrack?.on) {
        mediaTrack.on("track-ended", () => this.stopScreenShare());
      }
    } catch (e) {
      console.error("❌ Failed to start Agora screen share:", e);
      throw e;
    }
  }

  async startScreenShareWithStream(stream: MediaStream): Promise<void> {
    if (!this.isHost) throw new Error("Only the host can start screen sharing");

    this.setupRealtimeChannel();

    try {
      const uid = this.senderId;
      const { appId, rtcToken } = await this.fetchToken(uid, true);

      this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      this.client.on("connection-state-change", (cur) => {
        const map = {
          CONNECTED: "connected",
          CONNECTING: "connecting",
          DISCONNECTED: "disconnected",
          RECONNECTING: "connecting"
        } as Record<string, string>;
        this.onConnectionStateChange?.(map[cur] || "connecting");
      });

      await this.client.join(appId, this.agoraChannel, rtcToken, uid);

      // Create video track from the provided stream
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error("No video track found in the provided stream");
      }

      // Create Agora video track from the MediaStreamTrack
      this.screenTrack = await AgoraRTC.createCustomVideoTrack({
        mediaStreamTrack: videoTrack,
      });

      await this.client.publish([this.screenTrack]);
      this.onConnectionStateChange?.("connected");

      // Fire existing notification for UI (re-using 'offer' event)
      this.sendBroadcast({
        type: "broadcast",
        event: "offer",
        payload: {
          roomId: this.roomId,
          senderId: this.senderId,
          agoraChannel: this.agoraChannel
        }
      });

      // Handle stream end
      videoTrack.addEventListener('ended', () => {
        console.log("🛑 Screen share ended by user");
        this.stopScreenShare();
      });

      const mediaTrack = this.screenTrack as any;
      if (mediaTrack?.on) {
        mediaTrack.on("track-ended", () => this.stopScreenShare());
      }
    } catch (e) {
      console.error("❌ Failed to start Agora screen share with stream:", e);
      throw e;
    }
  }

  async joinScreenShare(remoteVideoElement: HTMLVideoElement): Promise<void> {
    if (this.isHost) throw new Error("Host cannot join their own screen share");

    this.remoteVideoElement = remoteVideoElement;

    try {
      const uid = this.senderId;
      console.log("👀 Customer joining screen share, UID:", uid, "Room:", this.roomId, "Agora Channel:", this.agoraChannel);
      const { appId, rtcToken } = await this.fetchToken(uid, false);
      console.log("🎫 Got token for customer, App ID:", appId.substring(0, 8) + "...");

      this.client = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
        role: "audience" // Customer is audience/viewer
      });

      this.client.on("connection-state-change", (cur) => {
        console.log("📡 Customer connection state:", cur);
        const map = {
          CONNECTED: "connected",
          CONNECTING: "connecting",
          DISCONNECTED: "disconnected",
          RECONNECTING: "connecting"
        } as Record<string, string>;
        this.onConnectionStateChange?.(map[cur] || "connecting");
      });

      this.client.on("user-published", async (user: IRemoteUser, mediaType) => {
        console.log("👤 Remote user published:", user.uid, "Media:", mediaType);
        await this.client!.subscribe(user, mediaType);
        if (mediaType === "video" && user.videoTrack && this.remoteVideoElement) {
          console.log("📺 Playing remote video track");
          try {
            const track = user.videoTrack.getMediaStreamTrack();
            const stream = new MediaStream([track]);
            this.remoteVideoElement.srcObject = stream as any;
            await this.remoteVideoElement.play().catch(() => { });
            this.onConnectionStateChange?.("connected");
            console.log("✅ Remote video playing successfully");
          } catch (e) {
            console.log("🔄 Fallback to Agora play API");
            // fallback to play API
            try { user.videoTrack.play(this.remoteVideoElement as any); } catch { }
            this.onConnectionStateChange?.("connected");
          }
        }
      });

      this.client.on("user-unpublished", (user: IRemoteUser, mediaType) => {
        console.log("👤 Remote user unpublished:", user.uid, "Media:", mediaType);
      });

      console.log("🔌 Joining Agora channel...");
      await this.client.join(appId, this.agoraChannel, rtcToken, uid);
      console.log("✅ Customer joined Agora channel successfully");
    } catch (e) {
      console.error("❌ Failed to join Agora screen share:", e);
      throw e;
    }
  }

  async resetAndReconnect(remoteVideoElement: HTMLVideoElement): Promise<void> {
    this.cleanup();
    await this.joinScreenShare(remoteVideoElement);
  }

  stopScreenShare(): void {
    console.log("🛑 Stopping screen share (Agora)");
    if (this.isHost) {
      this.sendBroadcast({
        type: "broadcast",
        event: "screen-share-ended",
        payload: { roomId: this.roomId, senderId: this.senderId }
      });
    }
    this.cleanup();
  }

  cleanup(): void {
    try {
      if (this.screenTrack) {
        try { this.client?.unpublish().catch(() => { }); } catch { }
        this.screenTrack.close();
        this.screenTrack = null;
      }
      if (this.client) {
        try { this.client.leave().catch(() => { }); } catch { }
        this.client.removeAllListeners();
        this.client = null;
      }
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
      if (this.remoteVideoElement) {
        this.remoteVideoElement.srcObject = null;
        this.remoteVideoElement = null;
      }
      this.isChannelReady = false;
      this.messageQueue = [];
      this.onConnectionStateChange?.("disconnected");
    } catch (e) {
      console.warn("Cleanup error:", e);
    }
  }
}