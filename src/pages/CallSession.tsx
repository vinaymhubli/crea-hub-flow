import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import VideoCall from '@/components/VideoCall';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, Calendar, Clock, User, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface BookingDetails {
  id: string;
  service: string;
  status: string;
  scheduled_date: string;
  duration_hours: number;
  total_amount: number;
  description: string;
  customer_name: string;
  designer_name: string;
  designer_rating: number;
  designer_specialty: string;
}

export default function CallSession() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [callStarted, setCallStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDesigner = profile?.user_type === 'designer';

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch booking with related user information
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!customer_id(first_name, last_name),
          designer:designers!designer_id(
            user_id,
            specialty,
            rating,
            user:profiles!user_id(first_name, last_name)
          )
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) {
        console.error('Error fetching booking:', bookingError);
        setError('Booking not found');
        return;
      }

      if (!bookingData) {
        setError('Booking not found');
        return;
      }

      // Check if user has access to this booking
      const hasAccess = 
        (isDesigner && bookingData.designer?.user_id === profile?.user_id) ||
        (!isDesigner && bookingData.customer_id === profile?.user_id);

      if (!hasAccess) {
        setError('You do not have access to this booking');
        return;
      }

      const formattedBooking: BookingDetails = {
        id: bookingData.id,
        service: bookingData.service,
        status: bookingData.status,
        scheduled_date: bookingData.scheduled_date,
        duration_hours: bookingData.duration_hours,
        total_amount: bookingData.total_amount,
        description: bookingData.description || '',
        customer_name: `${bookingData.customer?.first_name || ''} ${bookingData.customer?.last_name || ''}`.trim(),
        designer_name: `${bookingData.designer?.user?.first_name || ''} ${bookingData.designer?.user?.last_name || ''}`.trim(),
        designer_rating: bookingData.designer?.rating || 0,
        designer_specialty: bookingData.designer?.specialty || '',
      };

      setBooking(formattedBooking);

      // Auto-start call if booking is confirmed and scheduled time has arrived
      const scheduledTime = new Date(bookingData.scheduled_date);
      const now = new Date();
      const timeDiff = scheduledTime.getTime() - now.getTime();
      
      if (bookingData.status === 'confirmed' && timeDiff <= 15 * 60 * 1000) { // 15 minutes before
        setCallStarted(true);
      }
      
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const startCall = async () => {
    try {
      // Update booking status to in_progress
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'in_progress' })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking status:', error);
        toast({
          title: "Error",
          description: "Failed to start the session",
          variant: "destructive",
        });
        return;
      }

      setCallStarted(true);
      
      toast({
        title: "Session started",
        description: "Your design session is now live",
      });
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Error",
        description: "Failed to start the session",
        variant: "destructive",
      });
    }
  };

  const endCall = async () => {
    try {
      // Update booking status to completed
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking status:', error);
      }

      toast({
        title: "Session ended",
        description: "Thank you for your session",
      });

      // Redirect back to dashboard
      if (isDesigner) {
        navigate('/designer-dashboard/bookings');
      } else {
        navigate('/customer-dashboard/bookings');
      }
    } catch (error) {
      console.error('Error ending call:', error);
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Session Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Session Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">The requested session could not be found.</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (callStarted) {
    return (
      <VideoCall
        bookingId={booking.id}
        isDesigner={isDesigner}
        participantName={isDesigner ? booking.customer_name : booking.designer_name}
        onEndCall={endCall}
      />
    );
  }

  // Pre-call waiting room
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="backdrop-blur-sm bg-white/80 border-white/50 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Design Session
            </CardTitle>
            <p className="text-gray-600">Ready to start your session?</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Session Details */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-teal-600" />
                    <div>
                      <p className="text-sm text-gray-500">
                        {isDesigner ? 'Customer' : 'Designer'}
                      </p>
                      <p className="font-medium text-gray-900">
                        {isDesigner ? booking.customer_name : booking.designer_name}
                      </p>
                    </div>
                  </div>
                  
                  {!isDesigner && (
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="text-sm text-gray-500">Rating</p>
                        <p className="font-medium text-gray-900">
                          {booking.designer_rating}/5.0 ({booking.designer_specialty})
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-teal-600" />
                    <div>
                      <p className="text-sm text-gray-500">Scheduled</p>
                      <p className="font-medium text-gray-900">
                        {new Date(booking.scheduled_date).toLocaleDateString()} at{' '}
                        {new Date(booking.scheduled_date).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-teal-600" />
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium text-gray-900">
                        {booking.duration_hours} hour{booking.duration_hours !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-medium text-gray-900">{booking.service}</p>
                  </div>
                  <Badge 
                    className={`${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}
                  >
                    {booking.status}
                  </Badge>
                </div>
                
                {booking.description && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{booking.description}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Call Controls */}
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Make sure your camera and microphone are working properly
              </p>
              
              <Button
                onClick={startCall}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-8 py-4 text-lg font-medium"
              >
                <Phone className="w-5 h-5 mr-2" />
                Join Session
              </Button>
              
              <div className="flex justify-center space-x-4 pt-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(isDesigner ? '/designer-dashboard/bookings' : '/customer-dashboard/bookings')}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}