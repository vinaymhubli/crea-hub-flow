import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, DollarSign, User, MessageCircle, Video, CalendarDays } from "lucide-react";
import { format } from "date-fns";

interface BookingDetailsDialogProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onReschedule?: () => void;
  onJoinSession?: () => void;
  onMessageClient?: () => void;
}

export function BookingDetailsDialog({
  booking,
  open,
  onOpenChange,
  onAccept,
  onDecline,
  onReschedule,
  onJoinSession,
  onMessageClient,
}: BookingDetailsDialogProps) {
  if (!booking) return null;

  const customerName = booking.customer 
    ? `${booking.customer.first_name || ''} ${booking.customer.last_name || ''}`.trim()
    : 'Unknown Customer';

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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Booking Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold text-lg">
                {customerName.split(' ').map((n: string) => n[0]).join('') || 'C'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{customerName}</h3>
              <p className="text-gray-600">Customer</p>
              {getStatusBadge(booking.status)}
            </div>
          </div>

          {/* Service Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Service</h4>
            <p className="text-lg font-medium text-gray-800">{booking.service}</p>
            {booking.description && (
              <p className="text-gray-600 mt-2">{booking.description}</p>
            )}
          </div>

          {/* Schedule Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{formatDate(booking.scheduled_date)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">{formatTime(booking.scheduled_date, booking.duration_hours)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
              <DollarSign className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium text-green-600">${booking.total_amount}</p>
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-1">Session Duration</h4>
            <p className="text-gray-700">{booking.duration_hours} hour{booking.duration_hours !== 1 ? 's' : ''}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onMessageClient}
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message Client
            </Button>

            {booking.status === 'pending' && (
              <>
                <Button
                  onClick={onAccept}
                  className="bg-green-500 hover:bg-green-600 text-white flex-1"
                >
                  Accept Booking
                </Button>
                <Button
                  variant="outline"
                  onClick={onDecline}
                  className="border-red-200 text-red-600 hover:bg-red-50 flex-1"
                >
                  Decline
                </Button>
              </>
            )}

            {booking.status === 'confirmed' && (
              <>
                <Button
                  onClick={onJoinSession}
                  className="bg-gradient-to-r from-green-400 to-blue-500 text-white flex-1"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Join Session
                </Button>
                <Button
                  variant="outline"
                  onClick={onReschedule}
                  className="flex-1"
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Reschedule
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}