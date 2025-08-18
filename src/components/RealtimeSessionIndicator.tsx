import { useState, useEffect } from 'react';
import { Video, Phone, MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { useAuth } from '@/hooks/useAuth';

export const RealtimeSessionIndicator = () => {
  const { activeSession } = useRealtimeBookings();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!!activeSession);
  }, [activeSession]);

  if (!activeSession || !isVisible) return null;

  const isDesigner = profile?.user_type === 'designer';
  const participantName = isDesigner 
    ? `${activeSession.customer?.first_name || ''} ${activeSession.customer?.last_name || ''}`.trim()
    : `${activeSession.designer?.user?.first_name || ''} ${activeSession.designer?.user?.last_name || ''}`.trim();

  const handleJoinSession = () => {
    navigate(`/session/${activeSession.id}`);
  };

  const handleMinimize = () => {
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
      <Card className="bg-gradient-to-r from-green-500 to-teal-600 text-white border-0 shadow-2xl max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-bold text-sm">Active Session</span>
            </div>
            <button 
              onClick={handleMinimize}
              className="text-white/70 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 mb-4">
            <p className="font-semibold text-sm">{activeSession.service}</p>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">with {participantName}</span>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 text-xs">
              {isDesigner ? 'Designer Session' : 'Customer Session'}
            </Badge>
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={handleJoinSession}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
              size="sm"
            >
              <Video className="w-4 h-4 mr-1" />
              Join
            </Button>
            <Button 
              variant="outline" 
              className="bg-white/10 hover:bg-white/20 text-white border-white/30"
              size="sm"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};