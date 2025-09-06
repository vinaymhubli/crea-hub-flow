import { useState, useEffect, useRef } from 'react';
import { Monitor, MonitorSpeaker, X, Users, Wifi, WifiOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      const manager = new ScreenShareManager(
        roomId,
        isHost,
        (state) => {
          console.log('Connection state changed:', state);
          setConnectionState(state);
          setIsConnected(state === 'connected');
        }
      );
      setScreenShareManager(manager);

      if (!isHost && remoteVideoRef.current) {
        manager.joinScreenShare(remoteVideoRef.current);
      }

      return () => {
        manager.stopScreenShare();
      };
    }
  }, [isOpen, roomId, isHost]);

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

  const handleClose = () => {
    if (screenShareManager) {
      screenShareManager.stopScreenShare();
    }
    setIsSharing(false);
    setIsConnected(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
                <p className="text-sm text-muted-foreground">
                  {isHost ? 'Share your screen with the participant' : 'Viewing shared screen'}
                </p>
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
            <Card className="h-full overflow-hidden bg-black">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                style={{ background: '#000' }}
              />
              {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Connecting to screen share...</p>
                  </div>
                </div>
              )}
            </Card>
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