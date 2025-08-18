import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface BookingDialogProps {
  designer: any;
  children: React.ReactNode;
}

export function BookingDialog({ designer, children }: BookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    service: '',
    description: '',
    requirements: '',
    duration_hours: 1,
    scheduled_date: ''
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to book a session');
      return;
    }

    if (!bookingData.service || !bookingData.scheduled_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const scheduledDateTime = new Date(bookingData.scheduled_date).toISOString();
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          customer_id: user.id,
          designer_id: designer.id,
          service: bookingData.service,
          description: bookingData.description,
          requirements: bookingData.requirements,
          duration_hours: bookingData.duration_hours,
          scheduled_date: scheduledDateTime,
          total_amount: designer.hourly_rate * bookingData.duration_hours,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Booking request sent successfully!');
      setBookingData({
        service: '',
        description: '',
        requirements: '',
        duration_hours: 1,
        scheduled_date: ''
      });
      setOpen(false);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Design Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Service Type *</label>
            <Select value={bookingData.service} onValueChange={(value) => setBookingData({...bookingData, service: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="logo_design">Logo Design</SelectItem>
                <SelectItem value="web_design">Web Design</SelectItem>
                <SelectItem value="ui_ux">UI/UX Design</SelectItem>
                <SelectItem value="branding">Branding</SelectItem>
                <SelectItem value="consultation">Design Consultation</SelectItem>
                <SelectItem value="mobile_app">Mobile App Design</SelectItem>
                <SelectItem value="print_design">Print Design</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Project Description</label>
            <Textarea 
              value={bookingData.description}
              onChange={(e) => setBookingData({...bookingData, description: e.target.value})}
              placeholder="Describe your project..."
              rows={3}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Special Requirements</label>
            <Textarea 
              value={bookingData.requirements}
              onChange={(e) => setBookingData({...bookingData, requirements: e.target.value})}
              placeholder="Any specific requirements or preferences..."
              rows={2}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Duration (hours)</label>
            <Select value={bookingData.duration_hours.toString()} onValueChange={(value) => setBookingData({...bookingData, duration_hours: parseInt(value)})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="3">3 hours</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="8">8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Scheduled Date & Time *</label>
            <Input 
              type="datetime-local"
              value={bookingData.scheduled_date}
              onChange={(e) => setBookingData({...bookingData, scheduled_date: e.target.value})}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Rate:</span>
              <span className="font-medium">${designer.hourly_rate}/hour</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Duration:</span>
              <span className="font-medium">{bookingData.duration_hours} hour{bookingData.duration_hours > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Total:</span>
              <span className="text-lg font-bold text-green-600">${(designer.hourly_rate * bookingData.duration_hours).toFixed(2)}</span>
            </div>
          </div>
          
          <Button 
            onClick={handleBooking}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white"
          >
            {loading ? 'Creating Booking...' : 'Confirm Booking'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}