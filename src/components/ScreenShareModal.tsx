import { useState, useEffect, useRef } from 'react';
import { Monitor, MonitorSpeaker, X, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
            console.log("🎬 Opening ScreenShareModal for room:", roomId, "Host:", isHost);
            const manager = new ScreenShareManager(roomId, isHost, (state) => {
                console.log("📡 Connection state changed to:", state);
                setConnectionState(state);
                setIsConnected(state === 'connected');
            });

            setScreenShareManager(manager);

            return () => {
                console.log("🧹 Cleaning up ScreenShareModal");
                manager.cleanup();
                setScreenShareManager(null);
                setIsSharing(false);
                setConnectionState('new');
                setIsConnected(false);
                setShowConnectionHint(false);
            };
        }
    }, [isOpen, roomId, isHost]);

    useEffect(() => {
        if (!isHost && screenShareManager && remoteVideoRef.current && isOpen) {
            console.log("📺 Video element ready, customer joining screen share...");
            screenShareManager.joinScreenShare(remoteVideoRef.current).catch(error => {
                console.error("Failed to join screen share:", error);
                toast.error("Failed to join screen share");
            });
        }
    }, [isHost, screenShareManager, isOpen]);

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
            console.log("🎬 Starting screen share...");
            setIsSharing(true);
            await screenShareManager.startScreenShare();
            toast.success('Screen sharing started');
        } catch (error: any) {
            console.error('Failed to start screen share:', error);
            setIsSharing(false);
            toast.error('Failed to start screen sharing');
        }
    };

    const stopScreenShare = () => {
        if (screenShareManager) {
            console.log("🛑 Stopping screen share...");
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
                    <DialogTitle className="flex items-center space-x-2">
                        {isHost ? <MonitorSpeaker className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                        <span>{isHost ? 'Share Your Screen' : "Designer's Screen"}</span>
                    </DialogTitle>
                    <DialogDescription>
                        {isHost ? 'Share your screen with the participant' : 'Viewing shared screen'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 py-3 border-b bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' :
                                        connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                                            'bg-red-500'
                                    }`} />
                                <span className="text-sm text-gray-600 capitalize">
                                    {isConnected ? 'Connected' : connectionState}
                                </span>
                            </div>

                            {isHost && (
                                <div className="flex items-center space-x-2">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">
                                        {isConnected ? '1 viewer connected' : 'Waiting for viewers...'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            {isHost && (
                                <Button
                                    onClick={isSharing ? stopScreenShare : startScreenShare}
                                    variant={isSharing ? "destructive" : "default"}
                                    size="sm"
                                    disabled={!screenShareManager}
                                >
                                    {isSharing ? (
                                        <>
                                            <X className="w-4 h-4 mr-2" />
                                            Stop Sharing
                                        </>
                                    ) : (
                                        <>
                                            <Monitor className="w-4 h-4 mr-2" />
                                            Start Sharing
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 p-6">
                        {isHost && !isSharing ? (
                            <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Monitor className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Share</h3>
                                    <p className="text-gray-600 mb-4">
                                        Click "Start Sharing" to share your screen with {participantName}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full">
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
                </div>

                <div className="p-4 border-t bg-gray-50/50 text-center text-sm text-gray-500">
                    Room: {roomId.substring(0, 8)}... • Connection: {connectionState}
                </div>
            </DialogContent>
        </Dialog>
    );
}
