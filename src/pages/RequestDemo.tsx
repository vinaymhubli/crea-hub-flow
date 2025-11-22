import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Video, Calendar, Clock } from 'lucide-react';
import Header from '@/components/Header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RequestDemo() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: '',
    preferredDate: '',
    preferredTime: '',
    message: ''
  });

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : profile.display_name || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user, profile, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.projectType || !formData.preferredDate || !formData.preferredTime) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields (marked with *).',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Insert demo request
      const { error } = await (supabase as any)
        .from('demo_sessions')
        .insert({
          requester_name: formData.name,
          requester_email: formData.email,
          requester_phone: formData.phone || null,
          requester_company: formData.company || null,
          project_type: formData.projectType,
          preferred_date: formData.preferredDate || null,
          preferred_time: formData.preferredTime,
          requester_message: formData.message || null,
          status: 'pending',
          user_id: user?.id || null // Include user_id if logged in, null for guests
        });

      if (error) throw error;

      toast({
        title: 'Demo Request Submitted!',
        description: 'Our team will review your request and send you a meeting link via email.',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        projectType: '',
        preferredDate: '',
        preferredTime: '',
        message: ''
      });

      // Redirect to home after 2 seconds
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      console.error('Error submitting demo request:', err);
      toast({
        title: 'Submission Failed',
        description: err.message || 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8" />
                <div>
                  <CardTitle className="text-2xl">Request a Free Demo Session</CardTitle>
                  <CardDescription className="text-blue-100">
                    Experience our platform with a 30-minute demo call
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-sm">Flexible Scheduling</p>
                    <p className="text-xs text-gray-600">Choose your preferred time</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
                  <Clock className="w-6 h-6 text-indigo-600" />
                  <div>
                    <p className="font-semibold text-sm">30-Minute Session</p>
                    <p className="text-xs text-gray-600">Free of charge</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Your company name"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Your phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="projectType">Project Type *</Label>
                  <Select
                    value={formData.projectType}
                    onValueChange={(value) => setFormData({ ...formData, projectType: value })}
                    required
                  >
                    <SelectTrigger id="projectType">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="logo-design">Logo Design</SelectItem>
                      <SelectItem value="brand-identity">Brand Identity</SelectItem>
                      <SelectItem value="web-design">Web Design</SelectItem>
                      <SelectItem value="ui-ux-design">UI/UX Design</SelectItem>
                      <SelectItem value="graphic-design">Graphic Design</SelectItem>
                      <SelectItem value="print-design">Print Design</SelectItem>
                      <SelectItem value="packaging-design">Packaging Design</SelectItem>
                      <SelectItem value="social-media-design">Social Media Design</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="preferredDate">Preferred Date *</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    placeholder="dd/mm/yyyy"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="preferredTime">Preferred Time *</Label>
                  <Select
                    value={formData.preferredTime}
                    onValueChange={(value) => setFormData({ ...formData, preferredTime: value })}
                    required
                  >
                    <SelectTrigger id="preferredTime">
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00-10:00">09:00 AM - 10:00 AM</SelectItem>
                      <SelectItem value="10:00-11:00">10:00 AM - 11:00 AM</SelectItem>
                      <SelectItem value="11:00-12:00">11:00 AM - 12:00 PM</SelectItem>
                      <SelectItem value="12:00-13:00">12:00 PM - 01:00 PM</SelectItem>
                      <SelectItem value="13:00-14:00">01:00 PM - 02:00 PM</SelectItem>
                      <SelectItem value="14:00-15:00">02:00 PM - 03:00 PM</SelectItem>
                      <SelectItem value="15:00-16:00">03:00 PM - 04:00 PM</SelectItem>
                      <SelectItem value="16:00-17:00">04:00 PM - 05:00 PM</SelectItem>
                      <SelectItem value="17:00-18:00">05:00 PM - 06:00 PM</SelectItem>
                      <SelectItem value="18:00-19:00">06:00 PM - 07:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Tell us about your project</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your project requirements, goals, and any specific questions you have..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                  />
                </div>

                {/* What to expect section */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="font-semibold text-sm text-blue-900 mb-2">What to expect:</p>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>30-minute free consultation with our design expert</li>
                    <li>Discussion about your project requirements</li>
                    <li>Design recommendations and best practices</li>
                    <li>No charges, no commitments</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Request Free Demo'}
                  </Button>
                </div>
              </form>

              <p className="text-sm text-gray-600 text-center">
                Our team will review your request and send you a meeting link within 24 hours.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

