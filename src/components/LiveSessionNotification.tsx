import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, X, Check, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface LiveSessionNotificationProps {
  designerId: string;
  onSessionStart: (sessionId: string) => void;
}

interface SessionRequest {
  id: string;
  customer_id: string;
  message: string;
  created_at: string;
  customer: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export default function LiveSessionNotification({ designerId, onSessionStart }: LiveSessionNotificationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingRequests, setPendingRequests] = useState<SessionRequest[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!user || !designerId) return;

    loadPendingRequests();
    setupRealtimeSubscription();
  }, [user, designerId]);

  const loadPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('live_session_requests')
        .select(`
          id,
          customer_id,
          message,
          created_at
        `)
        .eq('designer_id', designerId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch customer profiles separately
      const customerIds = (data || []).map(req => req.customer_id);
      let customerProfiles: any = {};
      
      if (customerIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', customerIds);

        if (!profilesError && profiles) {
          customerProfiles = profiles.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {} as any);
        }
      }

      // Combine data with customer profiles
      const requestsWithProfiles = (data || []).map(request => ({
        ...request,
        customer: customerProfiles[request.customer_id] || {
          first_name: 'Unknown',
          last_name: 'Customer'
        }
      }));

      setPendingRequests(requestsWithProfiles);
      setShowNotification(requestsWithProfiles.length > 0);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`live_session_notifications_${designerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_session_requests',
          filter: `designer_id=eq.${designerId}`
        },
        (payload) => {
          console.log('New session request:', payload);
          loadPendingRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_session_requests',
          filter: `designer_id=eq.${designerId}`
        },
        (payload) => {
          console.log('Session request updated:', payload);
          loadPendingRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const respondToRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const updateData: any = { status };
      
      if (status === 'rejected' && rejectionReason.trim()) {
        updateData.rejection_reason = rejectionReason.trim();
      }

      const { error } = await supabase
        .from('live_session_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      if (status === 'accepted') {
        // Generate session ID and start screen sharing
        const sessionId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Notify customer that session is starting
        const request = pendingRequests.find(r => r.id === requestId);
        if (request) {
          await supabase
            .channel(`customer_notifications_${request.customer_id}`)
            .send({
              type: 'broadcast',
              event: 'live_session_accepted',
              payload: {
                sessionId,
                designerName: `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`
              }
            });
        }

        onSessionStart(sessionId);
        setShowNotification(false);
      }

      setRejectionReason('');
      toast({
        title: status === 'accepted' ? "Session accepted" : "Request rejected",
        description: status === 'accepted' 
          ? "Live session is starting..." 
          : "Request has been rejected",
      });

    } catch (error) {
      console.error('Error responding to request:', error);
      toast({
        title: "Error",
        description: "Failed to respond to request",
        variant: "destructive",
      });
    }
  };

  const dismissNotification = () => {
    setShowNotification(false);
  };

  if (!showNotification || pendingRequests.length === 0) {
    return null;
  }

  const latestRequest = pendingRequests[0];

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Video className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-900">Live Session Request</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={dismissNotification}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {latestRequest.customer?.first_name?.[0] || ''}{latestRequest.customer?.last_name?.[0] || ''}
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">
                  {latestRequest.customer?.first_name} {latestRequest.customer?.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(latestRequest.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-700 bg-white/50 rounded-lg p-2">
              {latestRequest.message}
            </p>

            <div className="space-y-2">
              <textarea
                placeholder="Reason for rejection (optional)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs p-2 border border-gray-200 rounded-lg resize-none"
                rows={2}
              />
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => respondToRequest(latestRequest.id, 'accepted')}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Accept & Start
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => respondToRequest(latestRequest.id, 'rejected')}
                  className="text-red-600 border-red-600 hover:bg-red-50 flex-1"
                >
                  <X className="w-3 h-3 mr-1" />
                  Reject
                </Button>
              </div>
            </div>

            {pendingRequests.length > 1 && (
              <div className="text-xs text-gray-500 text-center">
                +{pendingRequests.length - 1} more request{pendingRequests.length - 1 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
