import { useState, useEffect, useRef } from 'react';
import { Monitor, MonitorSpeaker, X, Users, Wifi, WifiOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScreenShareManager } from '@/utils/ScreenShareWebRTC';
import { toast } from "sonner";

interface ScreenShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  isHost: boolean;
  participantName: string;
}

export function ScreenShareModal({ 
  isOpen, 
  onClose, 
  roomId, 
  isHost, 
  participantName 
}: ScreenShareModalProps) {
  const [screenShareManager, setScreenShareManager] = useState<ScreenShareManager | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [isConnected, setIsConnected] = useState(false);
  const [showConnectionHint, setShowConnectionHint] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      const manager = new ScreenShareManager(roomId, isHost, (state) => {
        setConnectionState(state);
        setIsConnected(state === 'connected');
      });

      setScreenShareManager(manager);

      // Auto-join if not host
      if (!isHost && remoteVideoRef.current) {
        manager.joinScreenShare(remoteVideoRef.current);
      }

      return () => {
        manager.cleanup();
        setScreenShareManager(null);
        setIsSharing(false);
        setConnectionState('new');
        setIsConnected(false);
        setShowConnectionHint(false);
      };
    }
  }, [isOpen, roomId, isHost]);

  // Show connection hint after 10 seconds if not connected
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
      setIsSharing(true);
      await screenShareManager.startScreenShare();
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

  const handleClose = () => {
    if (isSharing) {
      stopScreenShare();
    }
    setIsSharing(false);
    setConnectionState('new');
    setIsConnected(false);
    setShowConnectionHint(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-4xl w-full h-[80vh] max-h-[800px] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                {isHost ? <MonitorSpeaker className="w-5 h-5 text-primary" /> : <Monitor className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {isHost ? 'Share Your Screen' : `${participantName}'s Screen`}
                </DialogTitle>
                <DialogDescription>
                  {isHost ? 'Share your screen with the participant' : 'Viewing shared screen'}
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isConnected ? 'Connected' : 'Connecting...'}
              </Badge>
              
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 pt-4">
          {isHost ? (
            <Card className="h-full flex flex-col items-center justify-center border-2 border-dashed border-primary/20 bg-primary/5">
              {!isSharing ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <MonitorSpeaker className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Ready to Share</h3>
                    <p className="text-muted-foreground">
                      Click the button below to start sharing your screen
                    </p>
                  </div>
                  <Button onClick={startScreenShare} size="lg" className="gap-2">
                    <Monitor className="w-4 h-4" />
                    Start Screen Share
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <MonitorSpeaker className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-600">Sharing Your Screen</h3>
                    <p className="text-muted-foreground">
                      Your screen is now being shared with {participantName}
                    </p>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-2">
                      <Users className="w-4 h-4" />
                      <span>1 viewer{isConnected ? ' connected' : ' connecting...'}</span>
                    </div>
                  </div>
                  <Button onClick={stopScreenShare} variant="destructive" size="lg" className="gap-2">
                    <X className="w-4 h-4" />
                    Stop Sharing
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            // Viewer content
            <div className="space-y-6">
              <div className="relative bg-gray-900 rounded-lg aspect-video min-h-[400px] flex items-center justify-center">
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

        <div className="p-6 pt-0 border-t bg-muted/30">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Room: {roomId}</span>
              <span>Connection: {connectionState}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">Powered by WebRTC</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}