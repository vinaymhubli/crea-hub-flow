import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageSquare,
  Bell,
  Send,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  Copy,
  FileText,
  Zap,
  Info,
  AlertCircle as AlertCircleIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { checkForContactInfo } from "@/utils/chatMonitor";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target: 'all' | 'designers' | 'clients' | 'admins';
  is_active: boolean;
  created_at: string;
  scheduled_for?: string;
  sent_count: number;
  // read_count: number; // Disabled
  created_by?: string;
}

interface AnnouncementTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target: 'all' | 'designers' | 'clients' | 'admins';
  category: string;
  description: string;
}

export default function Communications() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    target: 'all' | 'designers' | 'clients' | 'admins';
    is_active: boolean;
    scheduled_for: string;
  }>({
    title: '',
    message: '',
    type: 'info',
    target: 'all',
    is_active: true,
    scheduled_for: ''
  });

  // Predefined announcement templates
  const announcementTemplates: AnnouncementTemplate[] = [
    {
      id: 'maintenance',
      name: 'Platform Maintenance',
      title: 'Scheduled Platform Maintenance',
      message: 'We will be performing scheduled maintenance on {date} from {start_time} to {end_time} {timezone}. During this time, the platform will be temporarily unavailable. We apologize for any inconvenience and appreciate your patience.',
      type: 'warning',
      target: 'all',
      category: 'System',
      description: 'Notify users about planned maintenance windows'
    },
    {
      id: 'new-feature',
      name: 'New Feature Release',
      title: 'Exciting New Feature: {feature_name}',
      message: 'We\'re excited to announce the release of {feature_name}! This new feature will help you {benefit_description}. Check it out now and let us know what you think!',
      type: 'success',
      target: 'all',
      category: 'Product',
      description: 'Announce new platform features and updates'
    },
    {
      id: 'payment-update',
      name: 'Payment System Update',
      title: 'Payment Processing System Upgrade',
      message: 'We have upgraded our payment processing system for faster and more secure transactions. All existing payment methods remain valid. The new system will provide improved security and faster processing times.',
      type: 'info',
      target: 'all',
      category: 'System',
      description: 'Inform users about payment system improvements'
    },
    {
      id: 'verification-reminder',
      name: 'Designer Verification Reminder',
      title: 'Complete Your Designer Verification',
      message: 'New designers must complete the verification process within 48 hours of registration to maintain account access. Please upload your required documents and complete the verification steps.',
      type: 'error',
      target: 'designers',
      category: 'Account',
      description: 'Remind designers to complete verification'
    },
    {
      id: 'holiday-schedule',
      name: 'Holiday Schedule Notice',
      title: 'Holiday Schedule Update',
      message: 'Our support team will have limited availability during {holiday_name} (from {start_date} to {end_date}). Response times may be longer than usual. We appreciate your understanding.',
      type: 'info',
      target: 'all',
      category: 'Support',
      description: 'Inform users about holiday schedules'
    },
    {
      id: 'security-update',
      name: 'Security Update',
      title: 'Important Security Update',
      message: 'We have implemented enhanced security measures to protect your account and data. Please ensure your password is strong and consider enabling two-factor authentication for additional security.',
      type: 'warning',
      target: 'all',
      category: 'Security',
      description: 'Notify users about security improvements'
    }
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      
      // Fetch announcements from the database
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Transform database data to match our interface
        const transformedData: Announcement[] = data.map(item => ({
          id: item.id,
          title: item.title,
          message: item.message,
          type: item.type as 'info' | 'warning' | 'success' | 'error',
          target: item.target as 'all' | 'designers' | 'clients' | 'admins',
          is_active: item.is_active,
          created_at: item.created_at,
          scheduled_for: item.scheduled_for,
          sent_count: item.sent_count || 0, // Use actual value from database
          // read_count: item.read_count || 0, // Disabled
          created_by: item.created_by
        }));
        setAnnouncements(transformedData);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for contact information (phone numbers and email addresses) in announcement message
    const contactCheck = checkForContactInfo(formData.message.trim());
    if (contactCheck.hasContactInfo) {
      toast.error(contactCheck.message);
      return;
    }

    try {
      if (editingAnnouncement) {
        // Update existing announcement
        const updateData = {
          ...formData,
          scheduled_for: formData.scheduled_for ? new Date(formData.scheduled_for).toISOString() : null,
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('announcements')
          .update(updateData)
          .eq('id', editingAnnouncement.id);

        if (error) throw error;

        toast.success('Announcement updated successfully!');
        
        // Update local state
        setAnnouncements(announcements.map(announcement =>
          announcement.id === editingAnnouncement.id
            ? { ...announcement, ...formData }
            : announcement
        ));
      } else {
        // Create new announcement
        const announcementData = {
          ...formData,
          scheduled_for: formData.scheduled_for ? new Date(formData.scheduled_for).toISOString() : null,
          created_at: new Date().toISOString(),
          created_by: user?.id || null // Use the current user's ID
        };
        
        const { data, error } = await supabase
          .from('announcements')
          .insert([announcementData])
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const newAnnouncement: Announcement = {
            ...data,
            type: data.type as 'info' | 'warning' | 'success' | 'error',
            target: data.target as 'all' | 'designers' | 'clients' | 'admins',
            sent_count: 0,
            // read_count: 0 // Disabled
          };
          setAnnouncements([newAnnouncement, ...announcements]);
          toast.success('Announcement created successfully!');
        }
      }

      resetForm();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      target: 'all',
      is_active: true,
      scheduled_for: ''
    });
    setEditingAnnouncement(null);
    setShowCreateForm(false);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      target: announcement.target,
      is_active: announcement.is_active,
      scheduled_for: announcement.scheduled_for || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('announcements')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setAnnouncements(announcements.filter(announcement => announcement.id !== id));
        toast.success('Announcement deleted successfully!');
      } catch (error) {
        console.error('Error deleting announcement:', error);
        toast.error('Failed to delete announcement');
      }
    }
  };

  const toggleActive = async (id: string) => {
    try {
      const announcement = announcements.find(a => a.id === id);
      if (!announcement) return;

      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !announcement.is_active })
        .eq('id', id);

      if (error) throw error;

      setAnnouncements(announcements.map(announcement =>
        announcement.id === id
          ? { ...announcement, is_active: !announcement.is_active }
          : announcement
      ));

      toast.success(`Announcement ${!announcement.is_active ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling announcement status:', error);
      toast.error('Failed to update announcement status');
    }
  };

  const useTemplate = (template: AnnouncementTemplate) => {
    setFormData({
      title: template.title,
      message: template.message,
      type: template.type,
      target: template.target,
      is_active: true,
      scheduled_for: ''
    });
    setShowCreateForm(true);
    setShowTemplates(false);
    toast.success(`Template "${template.name}" loaded successfully!`);
  };

  const copyTemplate = (template: AnnouncementTemplate) => {
    navigator.clipboard.writeText(template.message);
    toast.success('Template message copied to clipboard!');
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      info: { color: 'bg-blue-100 text-blue-800', icon: 'ℹ️' },
      warning: { color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' },
      success: { color: 'bg-green-100 text-green-800', icon: '✅' },
      error: { color: 'bg-red-100 text-red-800', icon: '❌' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.info;

    return (
      <Badge className={config.color}>
        {config.icon} {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getTargetBadge = (target: string) => {
    const targetConfig = {
      all: { color: 'bg-gray-100 text-gray-800', icon: Users },
      designers: { color: 'bg-blue-100 text-blue-800', icon: Users },
      clients: { color: 'bg-green-100 text-green-800', icon: Users },
      admins: { color: 'bg-purple-100 text-purple-800', icon: Users }
    };

    const config = targetConfig[target as keyof typeof targetConfig] || targetConfig.all;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {target.charAt(0).toUpperCase() + target.slice(1)}
      </Badge>
    );
  };

  const getTargetCount = (target: string) => {
    // In a real app, this would query the actual user counts
    const counts = {
      all: 'All users',
      designers: 'Designers only',
      clients: 'Clients only',
      admins: 'Admins only'
    };
    return counts[target as keyof typeof counts] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading announcements...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Communications
          </h1>
          <p className="text-muted-foreground mt-2">Manage platform announcements and communications</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowTemplates(!showTemplates)}>
            <FileText className="w-4 h-4 mr-2" />
            {showTemplates ? 'Hide' : 'Show'} Templates
          </Button>
          <Button variant="outline" onClick={fetchAnnouncements}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* Announcement Templates */}
      {showTemplates && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Announcement Templates
            </CardTitle>
            <CardDescription>
              Pre-built templates for common announcements. Click "Use Template" to load one into the form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcementTemplates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-sm">{template.name}</h4>
                      <Badge variant="secondary" className="text-xs mt-1">{template.category}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyTemplate(template)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    {getTypeBadge(template.type)}
                    {getTargetBadge(template.target)}
                  </div>
                  <Button
                    onClick={() => useTemplate(template)}
                    size="sm"
                    className="w-full"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </CardTitle>
            <CardDescription>
              {editingAnnouncement ? 'Update the announcement details' : 'Send a new message to platform users'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter announcement title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target">Target Audience *</Label>
                  <Select value={formData.target} onValueChange={(value: any) => setFormData({...formData, target: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="designers">Designers Only</SelectItem>
                      <SelectItem value="clients">Clients Only</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getTargetCount(formData.target)}
                  </p>
                </div>
                <div>
                  <Label htmlFor="scheduled_for">Schedule For (Optional)</Label>
                  <Input
                    id="scheduled_for"
                    type="datetime-local"
                    value={formData.scheduled_for}
                    onChange={(e) => setFormData({...formData, scheduled_for: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to send immediately
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Enter announcement message"
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {`{variable_name}`} for dynamic content that can be replaced later
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="is_active">Active immediately</Label>
              </div>

              <div className="flex gap-3">
                <Button type="submit">
                  <Send className="w-4 h-4 mr-2" />
                  {editingAnnouncement ? 'Update' : 'Create'} Announcement
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Platform Announcements
          </CardTitle>
          <CardDescription>
            {announcements.length} announcement{announcements.length !== 1 ? 's' : ''} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No announcements found</p>
              <p className="text-sm">Create your first announcement to get started</p>
              <Button onClick={() => setShowCreateForm(true)} className="mt-2">
                <Plus className="w-4 h-4 mr-2" />
                Create Announcement
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{announcement.title}</h3>
                        {getTypeBadge(announcement.type)}
                        {getTargetBadge(announcement.target)}
                        <Badge variant={announcement.is_active ? "default" : "secondary"}>
                          {announcement.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <p className="text-gray-600 mb-3 whitespace-pre-wrap">{announcement.message}</p>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Send className="w-4 h-4" />
                          {announcement.sent_count} sent
                        </div>
                        {/* Read count disabled */}
                        {/* <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {announcement.read_count} read
                        </div> */}
                        {announcement.scheduled_for && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Scheduled: {new Date(announcement.scheduled_for).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(announcement.id)}
                      >
                        {announcement.is_active ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Communication Stats */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Communication Statistics</CardTitle>
            <CardDescription>Overview of platform communications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <Bell className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">Total Announcements</h3>
                <p className="text-2xl font-bold text-blue-600">{announcements.length}</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold">Active</h3>
                <p className="text-2xl font-bold text-green-600">
                  {announcements.filter(a => a.is_active).length}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Send className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold">Total Sent</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {announcements.reduce((sum, a) => sum + a.sent_count, 0)}
                </p>
              </div>
              {/* Read count disabled */}
              {/* <div className="text-center p-4 border rounded-lg">
                <Eye className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <h3 className="font-semibold">Total Read</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {announcements.reduce((sum, a) => sum + a.read_count, 0)}
                </p>
              </div> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
