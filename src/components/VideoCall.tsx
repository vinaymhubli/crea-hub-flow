import { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  MessageCircle, 
  Send,
  Settings,
  Users,
  Clock,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

interface VideoCallProps {
  bookingId: string;
  isDesigner: boolean;
  participantName: string;
  onEndCall: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: 'me' | 'other';
  timestamp: Date;
}

export default function VideoCall({ bookingId, isDesigner, participantName, onEndCall }: VideoCallProps) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  // Initialize media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        toast({
          title: "Camera and microphone connected",
          description: "Your video call is ready",
        });
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast({
          title: "Media access error",
          description: "Please allow camera and microphone access",
          variant: "destructive",
        });
      }
    };

    initializeMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  // Call duration timer
  useEffect(() => {
    if (isCallActive) {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isCallActive]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
        setIsAudioOn(!isAudioOn);
      }
    }
  };

  const endCall = () => {
    setIsCallActive(false);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    onEndCall();
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        sender: 'me',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // In a real app, this would send through WebSocket/Supabase realtime
      console.log('Sending message:', message);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex ${isFullscreen ? 'flex-col' : 'flex-row'}`}>
      {/* Video Area */}
      <div className={`relative ${isFullscreen || !isChatOpen ? 'flex-1' : 'flex-1 lg:flex-[2]'} flex flex-col`}>
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-sm p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live Call</span>
            </div>
            <Separator orientation="vertical" className="h-4 bg-white/20" />
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatDuration(callDuration)}</span>
            </div>
            <Separator orientation="vertical" className="h-4 bg-white/20" />
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">with {participantName}</span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                {isDesigner ? 'Designer' : 'Customer'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-white hover:bg-white/10"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="text-white hover:bg-white/10"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Video Streams */}
        <div className="flex-1 relative p-4">
          {/* Remote Video (Main) */}
          <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Placeholder for remote video */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-400/20 via-teal-500/20 to-blue-500/20">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">
                    {participantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <p className="text-lg font-medium">{participantName}</p>
                <p className="text-sm text-gray-300">Connecting...</p>
              </div>
            </div>
          </div>

          {/* Local Video (Picture in Picture) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
            />
            {!isVideoOn && (
              <div className="w-full h-full flex items-center justify-center bg-gray-600">
                <VideoOff className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 text-xs bg-black/50 px-2 py-1 rounded">
              You
            </div>
          </div>
        </div>

        {/* Call Controls */}
        <div className="bg-black/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant={isVideoOn ? "secondary" : "destructive"}
              size="lg"
              onClick={toggleVideo}
              className="w-14 h-14 rounded-full"
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>
            
            <Button
              variant={isAudioOn ? "secondary" : "destructive"}
              size="lg"
              onClick={toggleAudio}
              className="w-14 h-14 rounded-full"
            >
              {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>
            
            <Button
              variant="destructive"
              size="lg"
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="w-8 h-8" />
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              className="w-14 h-14 rounded-full"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      {isChatOpen && (
        <div className={`${isFullscreen ? 'h-80' : 'w-80 h-full'} bg-white text-gray-900 flex flex-col border-l border-gray-200`}>
          <Card className="h-full rounded-none border-0 shadow-none">
            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b">
              <CardTitle className="text-lg text-gray-900 flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Session Chat</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 flex flex-col">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Start chatting during your session</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            message.sender === 'me'
                              ? 'bg-gradient-to-r from-green-400 to-teal-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender === 'me' ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 border-gray-200 focus:border-teal-400 focus:ring-teal-400/20"
                  />
                  <Button
                    onClick={sendMessage}
                    size="sm"
                    className="bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}