import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Mail, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FreeDemoSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FreeDemoSessionDialog({ isOpen, onClose }: FreeDemoSessionDialogProps) {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.first_name ? `${profile.first_name} ${profile.last_name}` : '',
    email: user?.email || '',
    company: '',
    projectType: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to request a free demo session');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('free_demo_requests')
        .insert([{
          user_id: user.id,
          name: formData.name,
          email: formData.email,
          company: formData.company,
          project_type: formData.projectType,
          preferred_date: formData.preferredDate,
          preferred_time: formData.preferredTime,
          message: formData.message,
          phone: formData.phone,
          status: 'pending'
        }]);

      if (error) throw error;

      toast.success('Free demo session request submitted successfully! Our team will contact you soon.');
      onClose();
      
      // Reset form
      setFormData({
        name: profile?.first_name ? `${profile.first_name} ${profile.last_name}` : '',
        email: user?.email || '',
        company: '',
        projectType: '',
        preferredDate: '',
        preferredTime: '',
        message: '',
        phone: ''
      });
    } catch (error: any) {
      console.error('Error submitting demo request:', error);
      toast.error('Failed to submit demo request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl">
            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span>Request Free Demo Session</span>
          </DialogTitle>
          <DialogDescription>
            Get a free 30-minute demo session with our design experts. No charges, no commitments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Full Name *</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email *</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company/Organization</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Your company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Your phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectType">Project Type *</Label>
            <Select value={formData.projectType} onValueChange={(value) => handleSelectChange('projectType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="logo-design">Logo Design</SelectItem>
                <SelectItem value="branding">Branding & Identity</SelectItem>
                <SelectItem value="web-design">Web Design</SelectItem>
                <SelectItem value="ui-ux">UI/UX Design</SelectItem>
                <SelectItem value="print-design">Print Design</SelectItem>
                <SelectItem value="social-media">Social Media Graphics</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferredDate" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Preferred Date *</span>
              </Label>
              <Input
                id="preferredDate"
                name="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredTime" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Preferred Time *</span>
              </Label>
              <Select value={formData.preferredTime} onValueChange={(value) => handleSelectChange('preferredTime', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00-09:30">9:00 AM - 9:30 AM</SelectItem>
                  <SelectItem value="09:30-10:00">9:30 AM - 10:00 AM</SelectItem>
                  <SelectItem value="10:00-10:30">10:00 AM - 10:30 AM</SelectItem>
                  <SelectItem value="10:30-11:00">10:30 AM - 11:00 AM</SelectItem>
                  <SelectItem value="11:00-11:30">11:00 AM - 11:30 AM</SelectItem>
                  <SelectItem value="11:30-12:00">11:30 AM - 12:00 PM</SelectItem>
                  <SelectItem value="14:00-14:30">2:00 PM - 2:30 PM</SelectItem>
                  <SelectItem value="14:30-15:00">2:30 PM - 3:00 PM</SelectItem>
                  <SelectItem value="15:00-15:30">3:00 PM - 3:30 PM</SelectItem>
                  <SelectItem value="15:30-16:00">3:30 PM - 4:00 PM</SelectItem>
                  <SelectItem value="16:00-16:30">4:00 PM - 4:30 PM</SelectItem>
                  <SelectItem value="16:30-17:00">4:30 PM - 5:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Tell us about your project</span>
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Describe your project requirements, goals, and any specific questions you have..."
              rows={4}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">What to expect:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 30-minute free consultation with our design expert</li>
              <li>• Discussion about your project requirements</li>
              <li>• Design recommendations and best practices</li>
              <li>• No charges, no commitments</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {isSubmitting ? 'Submitting...' : 'Request Free Demo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
