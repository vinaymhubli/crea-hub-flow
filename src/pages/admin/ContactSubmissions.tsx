import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Mail, 
  Phone, 
  MessageSquare,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Archive,
  Reply,
  User,
  FileText,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContactSubmission {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  user_type: string | null;
  priority: string | null;
  message: string;
  status: 'new' | 'read' | 'replied' | 'resolved' | 'archived';
  admin_notes: string | null;
  replied_at: string | null;
  replied_by: string | null;
  created_at: string;
  updated_at: string;
}

export default function ContactSubmissions() {
  const { user, profile } = useAuth();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);

  if (!user || !profile?.is_admin) {
    return <Navigate to="/admin-login" replace />;
  }

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_form_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching contact submissions:', error);
      toast.error('Failed to load contact submissions');
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (id: string, status: string, notes?: string) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'replied') {
        updateData.replied_at = new Date().toISOString();
        updateData.replied_by = user.id;
      }

      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from('contact_form_submissions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Submission status updated successfully');
      fetchSubmissions();
      setIsNotesDialogOpen(false);
      setSelectedSubmission(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update submission status');
    }
  };

  const handleViewDetails = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setAdminNotes(submission.admin_notes || '');
    setIsNotesDialogOpen(true);
    
    // Mark as read if it's new
    if (submission.status === 'new') {
      updateSubmissionStatus(submission.id, 'read');
    }
  };

  const handleEmailReply = (submission: ContactSubmission) => {
    const subject = `Re: ${submission.subject}`;
    const body = `Hello ${submission.name},\n\nThank you for contacting us regarding: "${submission.subject}"\n\n`;
    const mailtoLink = `mailto:${submission.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    
    // Mark as replied after opening email client
    if (submission.status !== 'replied') {
      updateSubmissionStatus(submission.id, 'replied', adminNotes);
    }
  };

  const handlePhoneCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };


  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      read: { color: 'bg-yellow-100 text-yellow-800', icon: Eye },
      replied: { color: 'bg-green-100 text-green-800', icon: Reply },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      archived: { color: 'bg-gray-100 text-gray-800', icon: Archive }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;
    
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800' },
      medium: { color: 'bg-yellow-100 text-yellow-800' },
      high: { color: 'bg-orange-100 text-orange-800' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return (
      <Badge className={config.color}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </Badge>
    );
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading contact submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Form Submissions</h1>
          <p className="text-gray-600">Manage and respond to contact form submissions from users</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, subject, or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchSubmissions} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submissions List */}
        <div className="grid gap-6">
          {filteredSubmissions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contact submissions found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'No contact form submissions have been received yet'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{submission.name}</h3>
                        {getStatusBadge(submission.status)}
                        {getPriorityBadge(submission.priority)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Mail className="w-4 h-4" />
                          <a 
                            href={`mailto:${submission.email}?subject=Re: ${encodeURIComponent(submission.subject)}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              handleEmailReply(submission);
                            }}
                          >
                            {submission.email}
                          </a>
                        </div>
                        {submission.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <a 
                              href={`tel:${submission.phone}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePhoneCall(submission.phone!);
                              }}
                            >
                              {submission.phone}
                            </a>
                          </div>
                        )}
                        {submission.user_type && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span className="capitalize">{submission.user_type}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-700">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">{submission.subject}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(submission.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {submission.status === 'replied' && submission.replied_at && (
                        <div>Replied: {new Date(submission.replied_at).toLocaleString()}</div>
                      )}
                    </div>
                    <div className="flex space-x-2 flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(submission)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEmailReply(submission)}
                        className="border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Email Reply
                      </Button>
                      {submission.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePhoneCall(submission.phone!)}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                      )}
                      {submission.status === 'new' && (
                        <Button
                          size="sm"
                          onClick={() => updateSubmissionStatus(submission.id, 'read')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Mark as Read
                        </Button>
                      )}
                      {submission.status !== 'resolved' && (
                        <Button
                          size="sm"
                          onClick={() => updateSubmissionStatus(submission.id, 'resolved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact Submission Details</DialogTitle>
            <DialogDescription>
              View and manage this contact form submission
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedSubmission.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-900">{selectedSubmission.email}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmailReply(selectedSubmission)}
                      className="h-7"
                    >
                      <Mail className="w-3 h-3 mr-1" />
                      Reply
                    </Button>
                  </div>
                </div>
                {selectedSubmission.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-900">{selectedSubmission.phone}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePhoneCall(selectedSubmission.phone!)}
                        className="h-7"
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                )}
                {selectedSubmission.user_type && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">User Type</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedSubmission.user_type}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Subject</label>
                  <p className="text-sm text-gray-900">{selectedSubmission.subject}</p>
                </div>
                {selectedSubmission.priority && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Priority</label>
                    <div className="mt-1">{getPriorityBadge(selectedSubmission.priority)}</div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <div className="mt-1 bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedSubmission.message}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this submission..."
                  rows={4}
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleEmailReply(selectedSubmission)}
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Email Reply
                  </Button>
                  {selectedSubmission.phone && (
                    <Button
                      variant="outline"
                      onClick={() => handlePhoneCall(selectedSubmission.phone!)}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Call User
                    </Button>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsNotesDialogOpen(false);
                      setSelectedSubmission(null);
                      setAdminNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      updateSubmissionStatus(selectedSubmission.id, 'replied', adminNotes);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    Mark as Replied
                  </Button>
                  <Button
                    onClick={() => {
                      updateSubmissionStatus(selectedSubmission.id, selectedSubmission.status, adminNotes);
                    }}
                  >
                    Save Notes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

