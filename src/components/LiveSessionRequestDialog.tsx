import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Video, MessageCircle, Clock, User, X, Check, Send } from 'lucide-react';
import { checkDesignerBookingAvailability } from '@/utils/availabilityUtils';

interface LiveSessionRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  designer: any;
  onSessionStart: (sessionId: string) => void;
}

interface SessionRequest {
  id: string;
  customer_id: string;
  designer_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  rejection_reason?: string;
  created_at: string;
  customer: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  designer: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export default function LiveSessionRequestDialog({
  isOpen,
  onClose,
  designer,
  onSessionStart
}: LiveSessionRequestDialogProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [requestMessage, setRequestMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [isDesigner, setIsDesigner] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setIsDesigner(profile?.user_type === 'designer');
      loadSessionRequests();
      setupRealtimeSubscription();
    }
  }, [isOpen, user, profile]);

  const loadSessionRequests = async () => {
    try {
      if (isDesigner) {
        // Load requests for this designer
        const { data, error } = await supabase
          .from('live_session_requests' as any)
          .select('*')
          .eq('designer_id', designer.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch customer profiles separately
        const customerIds = (data || []).map((req: any) => req.customer_id);
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
        const requestsWithProfiles = (data || []).map((request: any) => ({
          ...request,
          customer: customerProfiles[request.customer_id] || {
            first_name: 'Unknown',
            last_name: 'Customer'
          }
        }));

        setSessionRequests(requestsWithProfiles);
      } else {
        // Load requests from this customer to this designer
        const { data, error } = await supabase
          .from('live_session_requests' as any)
          .select('*')
          .eq('customer_id', user.id)
          .eq('designer_id', designer.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch designer profiles separately
          const designerIds = (data || []).map((req: any) => req.designer_id);
          let designerProfiles: any = {};
          
          if (designerIds.length > 0) {
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('user_id, first_name, last_name, avatar_url')
              .in('user_id', designerIds);

            if (!profilesError && profiles) {
              designerProfiles = profiles.reduce((acc, profile) => {
                acc[profile.user_id] = profile;
                return acc;
              }, {} as any);
            }
          }

          // Combine data with designer profiles
          const requestsWithProfiles = (data || []).map((request: any) => ({
            ...request,
            designer: designerProfiles[request.designer_id] || {
            first_name: 'Unknown',
            last_name: 'Designer'
          }
        }));

        setSessionRequests(requestsWithProfiles);
      }
    } catch (error) {
      console.error('Error loading session requests:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`live_session_requests_${designer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_session_requests',
          filter: isDesigner 
            ? `designer_id=eq.${designer.id}`
            : `customer_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Session request updated:', payload);
          loadSessionRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendSessionRequest = async () => {
    if (!user || !requestMessage.trim()) return;

    // Check if designer is available based on their schedule
    const availabilityResult = await checkDesignerBookingAvailability(designer.id);
    
    if (!availabilityResult.isAvailable) {
      toast({
        title: "Designer Not Available",
        description: availabilityResult.reason || "This designer is not available for live sessions",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { data, error } = await supabase
        .from('live_session_requests' as any)
        .insert({
          customer_id: user.id,
          designer_id: designer.id,
          message: requestMessage.trim(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setRequestMessage('');
      toast({
        title: "Request sent",
        description: "Your live session request has been sent to the designer",
      });

      // Small delay to ensure database insert is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Notify designer via real-time broadcast (for immediate notifications)
      console.log('📡 Sending broadcast notification to designer:', designer.id);
      try {
        const broadcastResult = await supabase
          .channel(`designer_notifications_${designer.id}`)
          .send({
            type: 'broadcast',
            event: 'live_session_request',
            payload: {
              requestId: (data as any)?.id,
              customerName: `${profile?.first_name} ${profile?.last_name}`,
              message: requestMessage.trim()
            }
          });
        
        console.log('📡 Broadcast result:', broadcastResult);
      } catch (broadcastError) {
        console.error('❌ Broadcast notification failed:', broadcastError);
        // Don't fail the entire request if broadcast fails
      }

      // The postgres_changes subscription in LiveSessionNotification will also trigger
      // automatically when the INSERT happens, providing double coverage for notifications

    } catch (error) {
      console.error('Error sending session request:', error);
      toast({
        title: "Error",
        description: "Failed to send session request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        const currentRequest = sessionRequests.find(r => r.id === requestId);
        
        // Create active session record
        const { error: sessionError } = await supabase
          .from('active_sessions' as any)
          .insert({
            session_id: sessionId,
            designer_id: designer.id,
            customer_id: currentRequest?.customer_id,
            session_type: 'live_session',
            status: 'active'
          });

        if (sessionError) {
          console.error('Error creating active session:', sessionError);
          toast({
            title: "Error",
            description: "Failed to start session",
            variant: "destructive",
          });
          return;
        }
        
        // Notify customer that session is starting
        await supabase
          .channel(`customer_notifications_${currentRequest?.customer_id}`)
          .send({
            type: 'broadcast',
            event: 'live_session_accepted',
            payload: {
              sessionId,
              designerName: `${designer.profiles?.first_name} ${designer.profiles?.last_name}`
            }
          });

        // Immediately navigate customer's app to the live session page
        await supabase
          .channel(`customer_notifications_${currentRequest?.customer_id}`)
          .send({
            type: 'broadcast',
            event: 'navigate_to_session',
            payload: { sessionId }
          });

        onSessionStart(sessionId);
        onClose();
      }

      if (status === 'rejected') {
        // When rejecting, immediately end any active sessions for this designer
        console.log('🚫 Session rejected, ending any active sessions for designer:', designer.id);
        
        const currentRequest = sessionRequests.find(r => r.id === requestId);
        
        // End any active sessions for this designer
        const { error: endSessionError } = await supabase
          .from('active_sessions' as any)
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('designer_id', designer.id)
          .eq('status', 'active');

        if (endSessionError) {
          console.warn('Error ending active sessions after rejection:', endSessionError);
        }

        // Notify customer about rejection with reason
        if (currentRequest) {
          await supabase
            .channel(`customer_notifications_${currentRequest.customer_id}`)
            .send({
              type: 'broadcast',
              event: 'live_session_rejected',
              payload: {
                designerName: `${designer.profiles?.first_name} ${designer.profiles?.last_name}`,
                reason: rejectionReason.trim() || 'No reason provided'
              }
            });
        }

        console.log('✅ Session ended due to rejection');
      }

      setRejectionReason('');
      toast({
        title: status === 'accepted' ? "Session accepted" : "Request rejected",
        description: status === 'accepted' 
          ? "Live session is starting..." 
          : `Request rejected. ${rejectionReason.trim() ? 'Reason: ' + rejectionReason.trim() : ''}`,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-green-600" />
            <span>Live Design Session</span>
            {designer && (
              <span className="text-sm text-muted-foreground">
                with {designer.profiles?.first_name} {designer.profiles?.last_name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Form (for customers) */}
          {!isDesigner && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Request Live Session</h3>
                <Textarea
                  placeholder="Describe what you'd like to work on in this live session..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="mb-3"
                  rows={3}
                />
                <Button 
                  onClick={sendSessionRequest}
                  disabled={!requestMessage.trim() || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Sending..." : "Send Request"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Session Requests */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Session Requests</span>
            </h3>
            
            <ScrollArea className="h-64">
              {sessionRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isDesigner ? "No session requests yet" : "No requests sent yet"}
                </div>
              ) : (
                <div className="space-y-3">
                  {sessionRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {isDesigner 
                              ? `${request.customer?.first_name?.[0] || ''}${request.customer?.last_name?.[0] || ''}`
                              : `${request.designer?.first_name?.[0] || ''}${request.designer?.last_name?.[0] || ''}`
                            }
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {isDesigner 
                                ? `${request.customer?.first_name} ${request.customer?.last_name}`
                                : `${request.designer?.first_name} ${request.designer?.last_name}`
                              }
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{request.message}</p>
                      
                      {request.rejection_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-red-800">
                            <strong>Reason:</strong> {request.rejection_reason}
                          </p>
                        </div>
                      )}

                      {/* Designer Actions */}
                      {isDesigner && request.status === 'pending' && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Reason for rejection (optional)"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="text-sm"
                            rows={2}
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => respondToRequest(request.id, 'accepted')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept & Start
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => respondToRequest(request.id, 'rejected')}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
