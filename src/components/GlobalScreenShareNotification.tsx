import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Monitor, X, Video, User } from 'lucide-react';
import { ScreenShareModal } from '@/components/ScreenShareModal';
import { useNavigate } from 'react-router-dom';

interface ScreenShareNotification {
  show: boolean;
  sessionId: string;
  designerName: string;
  roomId: string;
}

export default function GlobalScreenShareNotification() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<ScreenShareNotification>({
    show: false,
    sessionId: '',
    designerName: '',
    roomId: ''
  });
  const [showScreenShare, setShowScreenShare] = useState(false);

  useEffect(() => {
    if (!user || !profile || !['client','customer'].includes(profile.user_type as any)) return;

    // Set up realtime subscription for screen share notifications
    const channel = supabase
      .channel(`customer_notifications_${user.id}`)
      .on(
        'broadcast',
        { event: 'live_session_accepted' },
        (payload) => {
          console.log('Global: Received live session accepted notification:', payload);
          
          const { sessionId, designerName } = payload.payload;
          
          // DON'T show the join screen yet - only show a toast that session is accepted
          // Customer will see join screen only when designer actually starts screen sharing
          toast({
            title: "Session Accepted",
            description: `${designerName} accepted your session request. Waiting for screen share to start...`,
            duration: 5000,
          });
          
          console.log('📝 Session accepted but NOT showing join screen yet. Waiting for screen_share_started event.');
        }
      )
      .on(
        'broadcast',
        { event: 'screen_share_started' },
        (payload) => {
          console.log('🎥 Global: Screen share ACTUALLY started! Showing join screen to customer:', payload);
          
          const { sessionId, designerName, roomId } = payload.payload;
          
          setNotification({
            show: true,
            sessionId: sessionId || roomId,
            designerName: designerName || 'Designer',
            roomId: roomId || sessionId
          });

          // Show toast notification when screen share actually starts
          toast({
            title: "Screen Share Started!",
            description: `${designerName} is now sharing their screen. Click to join!`,
            duration: 10000, // Longer duration since this is important
          });
        }
      )
      .on(
        'broadcast',
        { event: 'screen_share_ended' },
        (payload) => {
          console.log('Global: Screen share ended notification:', payload);
          setNotification(prev => ({ ...prev, show: false }));
          setShowScreenShare(false);
        }
      )
      .on(
        'broadcast',
        { event: 'live_session_rejected' },
        (payload) => {
          console.log('Global: Live session rejected notification:', payload);
          
          const { designerName, reason } = payload.payload;
          
          // Show toast notification about rejection with reason
          toast({
            title: "Session Request Rejected",
            description: `${designerName} rejected your session request. ${reason ? 'Reason: ' + reason : ''}`,
            variant: "destructive",
            duration: 8000,
          });
        }
      )
      .on(
        'broadcast',
        { event: 'navigate_to_session' },
        (payload) => {
          const { sessionId } = payload.payload || {};
          if (sessionId) {
            console.log('➡️ Customer received navigate_to_session event for sessionId:', sessionId);
            console.log('🚀 Current user:', user?.id, 'Profile type:', profile?.user_type);
            // Use React Router navigation instead of window.location.assign to avoid full page reload
            navigate(`/live-session/${sessionId}`, { replace: true });
            console.log('✅ Navigation command executed for customer');
          } else {
            console.error('❌ No sessionId in navigate_to_session payload:', payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, toast, navigate]);

  const joinScreenShare = () => {
    setShowScreenShare(true);
    setNotification(prev => ({ ...prev, show: false }));
  };

  const dismissNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const handleCloseScreenShare = () => {
    setShowScreenShare(false);
  };

  // Don't show anything if user is not a customer or there's no notification
  if (!user || !profile || profile.user_type !== 'client' || !notification.show) {
    return (
      <>
        {/* Screen Share Modal - always render but only show when needed */}
        {showScreenShare && notification.roomId && (
          <ScreenShareModal
            isOpen={showScreenShare}
            onClose={handleCloseScreenShare}
            roomId={notification.roomId}
            isHost={false}
            participantName={notification.designerName}
            designerName={notification.designerName}
            customerName={profile.first_name || 'Customer'}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* Global Screen Share Notification Overlay */}
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Background overlay */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />
        
        {/* Notification card */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">🎥 Screen Share Active!</h3>
                  <p className="text-sm text-gray-600">Designer is now sharing their screen</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissNotification}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Designer info */}
            <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{notification.designerName}</p>
                <p className="text-sm text-gray-600">is ready for your live session</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={joinScreenShare}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              >
                <Video className="w-4 h-4 mr-2" />
                Join Session
              </Button>
              <Button
                variant="outline"
                onClick={dismissNotification}
                className="px-4"
              >
                Later
              </Button>
            </div>

            {/* Additional info */}
            <p className="text-xs text-gray-500 mt-3 text-center">
              You can join the session anytime from your messages
            </p>
          </div>
        </div>
      </div>

      {/* Screen Share Modal */}
      {showScreenShare && notification.roomId && (
        <ScreenShareModal
          isOpen={showScreenShare}
          onClose={handleCloseScreenShare}
          roomId={notification.roomId}
          isHost={false}
          participantName={notification.designerName}
          designerName={notification.designerName}
          customerName={profile.first_name || 'Customer'}
        />
      )}
    </>
  );
}
