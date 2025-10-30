
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { checkDesignerAvailabilityForDateTime } from '@/utils/availabilityUtilsSlots';

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

  // Slots for the currently selected day
  const [daySlots, setDaySlots] = useState<{ start_time: string; end_time: string }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

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
    // Designer rate stored per minute; total for hours = perMin * 60 * hours
    const perMinuteRate = designer.hourly_rate || 0;
    return service?.price || (perMinuteRate * 60 * bookingData.duration_hours);
  };

  // Fetch slots for the selected day
  useEffect(() => {
    const fetchDaySlots = async () => {
      try {
        setSlotsLoading(true);
        // Determine day of week from the selected date, default to today if empty
        const dateStr = bookingData.scheduled_date || new Date().toISOString().slice(0, 16);
        const localDate = new Date(dateStr);
        const dayOfWeek = localDate.getDay(); // 0=Sun ... 6=Sat

        const { data, error } = await (supabase as any)
          .from('designer_slots')
          .select('start_time,end_time,is_active,day_of_week')
          .eq('designer_id', designer.id)
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true)
          .order('start_time', { ascending: true });

        if (error) throw error;
        setDaySlots((data || []).map((s: any) => ({ start_time: s.start_time, end_time: s.end_time })));
      } catch (e) {
        setDaySlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchDaySlots();
  }, [bookingData.scheduled_date, designer.id]);

  const handleSlotPick = (startTimeHHMM: string) => {
    // Keep the selected date part, set the time to the slot start
    const base = bookingData.scheduled_date ? new Date(bookingData.scheduled_date) : new Date();
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, '0');
    const dd = String(base.getDate()).padStart(2, '0');
    const newValue = `${yyyy}-${mm}-${dd}T${startTimeHHMM.slice(0,5)}`;
    setBookingData({ ...bookingData, scheduled_date: newValue });
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
      
      // Check if designer is available for the scheduled time
      const availabilityResult = await checkDesignerAvailabilityForDateTime(designer.id, scheduledDateTime);
      
      if (!availabilityResult.isAvailable) {
        toast.error(availabilityResult.reason || 'This designer is not available at the scheduled time.');
        return;
      }
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

      // Create or ensure conversation exists between customer and designer
      try {
        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('customer_id', user.id)
          .eq('designer_id', designer.id)
          .single();

        if (!existingConversation) {
          // Create new conversation
          await supabase
            .from('conversations')
            .insert({
              customer_id: user.id,
              designer_id: designer.id
            });
        }
      } catch (conversationError) {
        console.log('Conversation already exists or error creating:', conversationError);
        // Don't fail the booking if conversation creation fails
      }

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
          <div className="flex items-center space-x-2 mt-2">
            <div className={`w-3 h-3 rounded-full ${designer.is_online ? 'bg-green-400' : 'bg-gray-400'}`}></div>
            <span className={`text-sm font-medium ${designer.is_online ? 'text-green-600' : 'text-gray-500'}`}>
              {designer.is_online ? 'Designer is online' : 'Designer is offline'}
            </span>
          </div>
          {!designer.is_online && (
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded-lg">
              ⚠️ This designer is currently offline. You can still schedule a session for later, but they may not respond immediately.
            </div>
          )}
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
                        <span className="text-xs text-gray-500">₹{pkg.price} - {pkg.delivery_time_days} days</span>
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
            {/* Available Slots for the selected day */}
            <div className="mt-2">
              <div className="text-xs text-gray-600 mb-1">Available slots for this day:</div>
              {slotsLoading ? (
                <div className="text-xs text-gray-500">Loading slots...</div>
              ) : daySlots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((s, idx) => (
                    <Button key={idx} variant="outline" size="sm" onClick={() => handleSlotPick(s.start_time)}>
                      {s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500">No active slots for this day. Try another date.</div>
              )}
            </div>
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
                  <span className="text-lg font-bold text-green-600">₹{getCurrentPrice().toFixed(2)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Rate:</span>
                  <span className="font-medium">₹{designer.hourly_rate}/min</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="font-medium">{bookingData.duration_hours} hour{bookingData.duration_hours > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="text-lg font-bold text-green-600">₹{getCurrentPrice().toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          
          <Button 
            onClick={handleBooking}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white"
          >
            {loading ? 'Creating Booking...' : `Confirm Booking - ₹${getCurrentPrice().toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
