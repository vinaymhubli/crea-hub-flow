import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  User, 
  MessageCircle, 
  Video, 
  CalendarDays,
  Star,
  ExternalLink,
  XCircle,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface BookingDetailsDialogProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelBooking?: (bookingId: string) => void;
  onRescheduleBooking?: (bookingId: string) => void;
}

export function CustomerBookingDetailsDialog({
  booking,
  open,
  onOpenChange,
  onCancelBooking,
  onRescheduleBooking,
}: BookingDetailsDialogProps) {
  const navigate = useNavigate();

  if (!booking) return null;

  const designerName = booking.designer?.profile 
    ? `${booking.designer.profile.first_name || ''} ${booking.designer.profile.last_name || ''}`.trim()
    : 'Unknown Designer';

  const designerInitials = booking.designer?.profile 
    ? `${booking.designer.profile.first_name?.[0] || ''}${booking.designer.profile.last_name?.[0] || ''}`
    : 'UD';

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString: string, duration: number) => {
    try {
      const startTime = format(new Date(dateString), 'h:mm a');
      const endTime = format(new Date(new Date(dateString).getTime() + duration * 60 * 60 * 1000), 'h:mm a');
      return `${startTime} - ${endTime}`;
    } catch {
      return 'Invalid Time';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'pending': return 25;
      case 'confirmed': return 50;
      case 'in_progress': return 75;
      case 'completed': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const getProgressSteps = () => {
    const steps = [
      { label: 'Booking Placed', status: 'completed' },
      { label: 'Designer Confirmation', status: booking.status === 'pending' ? 'current' : 'completed' },
      { label: 'Session Ready', status: booking.status === 'confirmed' ? 'current' : booking.status === 'pending' ? 'pending' : 'completed' },
      { label: 'Session Complete', status: booking.status === 'completed' ? 'current' : booking.status === 'in_progress' ? 'current' : 'pending' }
    ];
    return steps;
  };

  const handleViewDesigner = () => {
    if (booking.designer_id) {
      navigate(`/designer/${booking.designer_id}`, { 
        state: { 
          hideGlobalChrome: true,
          fromPath: '/customer-dashboard/bookings'
        }
      });
      onOpenChange(false);
    }
  };

  const handleMessage = () => {
    navigate(`/customer-dashboard/messages?booking_id=${booking.id}`);
    onOpenChange(false);
  };

  const handleJoinSession = () => {
    navigate(`/session/${booking.id}`);
    onOpenChange(false);
  };

  const handleReschedule = () => {
    onRescheduleBooking?.(booking.id);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancelBooking?.(booking.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Booking Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Designer Info */}
          <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="w-16 h-16">
              <AvatarImage src={booking.designer?.profile?.avatar_url} alt={designerName} />
              <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold text-lg">
                {designerInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{designerName}</h3>
              <p className="text-muted-foreground">{booking.designer?.specialty}</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm">{booking.designer?.rating || 0}</span>
                  <span className="text-sm text-muted-foreground">({booking.designer?.reviews_count || 0} reviews)</span>
                </div>
                {booking.designer?.is_online && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(booking.status)}
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Booking Progress</h4>
            <Progress value={getProgressValue(booking.status)} className="h-2" />
            <div className="grid grid-cols-4 gap-2">
              {getProgressSteps().map((step, index) => (
                <div key={index} className="text-center">
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium ${
                    step.status === 'completed' ? 'bg-green-500 text-white' :
                    step.status === 'current' ? 'bg-blue-500 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {step.status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
                     step.status === 'current' ? <AlertTriangle className="w-4 h-4" /> :
                     index + 1}
                  </div>
                  <p className="text-xs mt-1 font-medium">{step.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Service Details</h4>
            <div className="space-y-2">
              <p className="text-lg font-medium">{booking.service}</p>
              {booking.description && (
                <p className="text-muted-foreground">{booking.description}</p>
              )}
              {booking.requirements && (
                <div>
                  <p className="font-medium mt-3 mb-1">Requirements:</p>
                  <p className="text-muted-foreground text-sm">{booking.requirements}</p>
                </div>
              )}
            </div>
          </div>

          {/* Schedule & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
              <Calendar className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(booking.scheduled_date)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
              <Clock className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{formatTime(booking.scheduled_date, booking.duration_hours)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium text-green-600">${booking.total_amount}</p>
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-4">
            <h4 className="font-semibold mb-1">Session Duration</h4>
            <p className="text-muted-foreground">{booking.duration_hours} hour{booking.duration_hours !== 1 ? 's' : ''}</p>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-4">
            <h4 className="font-semibold">Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleViewDesigner}
                className="w-full"
              >
                <User className="w-4 h-4 mr-2" />
                View Designer Profile
              </Button>

              <Button
                variant="outline"
                onClick={handleMessage}
                className="w-full"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message Designer
              </Button>

              {booking.status === 'confirmed' && (
                <Button
                  onClick={handleJoinSession}
                  className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Join Session
                </Button>
              )}

              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <Button
                  variant="outline"
                  onClick={handleReschedule}
                  className="w-full"
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Reschedule
                </Button>
              )}

              {booking.status === 'completed' && (
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Rate Designer
                </Button>
              )}

              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}