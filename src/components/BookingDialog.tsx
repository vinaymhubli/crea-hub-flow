
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface BookingDialogProps {
  designer: any;
  children: React.ReactNode;
  service?: {
    id: string;
    title: string;
    price: number;
    delivery_time_days: number;
    packages?: Array<{
      tier: 'basic' | 'standard' | 'premium';
      title: string;
      price: number;
      delivery_time_days: number;
      features: string[];
    }>;
  };
}

export function BookingDialog({ designer, children, service }: BookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('basic');
  const [bookingData, setBookingData] = useState({
    service: service?.title || '',
    description: '',
    requirements: '',
    duration_hours: 1,
    scheduled_date: ''
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const getCurrentPackage = () => {
    if (service?.packages && service.packages.length > 0) {
      return service.packages.find(p => p.tier === selectedPackage) || service.packages[0];
    }
    return null;
  };

  const getCurrentPrice = () => {
    const currentPackage = getCurrentPackage();
    if (currentPackage) {
      return currentPackage.price;
    }
    return service?.price || (designer.hourly_rate * bookingData.duration_hours);
  };

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
      const currentPackage = getCurrentPackage();
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          customer_id: user.id,
          designer_id: designer.id,
          service: bookingData.service + (currentPackage ? ` (${currentPackage.title})` : ''),
          description: bookingData.description,
          requirements: bookingData.requirements,
          duration_hours: bookingData.duration_hours,
          scheduled_date: scheduledDateTime,
          total_amount: getCurrentPrice(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Booking request sent successfully!');
      setBookingData({
        service: service?.title || '',
        description: '',
        requirements: '',
        duration_hours: 1,
        scheduled_date: ''
      });
      setOpen(false);
      navigate('/customer-dashboard/bookings');
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {service ? `Book "${service.title}"` : 'Book Design Session'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Package Selection for Services */}
          {service?.packages && service.packages.length > 0 && (
            <div>
              <label className="text-sm font-medium">Package *</label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  {service.packages.map(pkg => (
                    <SelectItem key={pkg.tier} value={pkg.tier}>
                      <div className="flex flex-col">
                        <span className="font-medium capitalize">{pkg.title}</span>
                        <span className="text-xs text-gray-500">${pkg.price} - {pkg.delivery_time_days} days</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Package Details */}
              {getCurrentPackage() && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Package includes:</h4>
                  <ul className="text-xs space-y-1">
                    {getCurrentPackage()!.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!service && (
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
          )}
          
          <div>
            <label className="text-sm font-medium">Project Description</label>
            <Textarea 
              value={bookingData.description}
              onChange={(e) => setBookingData({...bookingData, description: e.target.value})}
              placeholder="Describe your project needs..."
              rows={3}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Special Requirements</label>
            <Textarea 
              value={bookingData.requirements}
              onChange={(e) => setBookingData({...bookingData, requirements: e.target.value})}
              placeholder="Any specific requirements, style preferences, deadlines..."
              rows={2}
            />
          </div>
          
          {/* Only show duration for non-service bookings */}
          {!service && (
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
          )}
          
          <div>
            <label className="text-sm font-medium">Preferred Start Date & Time *</label>
            <Input 
              type="datetime-local"
              value={bookingData.scheduled_date}
              onChange={(e) => setBookingData({...bookingData, scheduled_date: e.target.value})}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            {service ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Service:</span>
                  <span className="font-medium">{getCurrentPackage()?.title || service.title}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Delivery:</span>
                  <span className="font-medium">{getCurrentPackage()?.delivery_time_days || service.delivery_time_days} days</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="text-lg font-bold text-green-600">${getCurrentPrice().toFixed(2)}</span>
                </div>
              </>
            ) : (
              <>
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
                  <span className="text-lg font-bold text-green-600">${getCurrentPrice().toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          
          <Button 
            onClick={handleBooking}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white"
          >
            {loading ? 'Creating Booking...' : `Confirm Booking - $${getCurrentPrice().toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
