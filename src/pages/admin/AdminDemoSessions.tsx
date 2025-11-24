import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Calendar, Clock, Mail, Phone, User, Check, X, Copy, ExternalLink, Building2, Briefcase } from 'lucide-react';

interface DemoSession {
  id: string;
  session_id: string | null;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  requester_company: string | null;
  project_type: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  requester_message: string | null;
  status: string;
  scheduled_date: string | null;
  meeting_link: string | null;
  duration_minutes: number;
  started_at: string | null;
  ended_at: string | null;
  admin_notes: string | null;
  created_at: string;
}

export default function AdminDemoSessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [demoSessions, setDemoSessions] = useState<DemoSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<DemoSession | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    fetchDemoSessions();
  }, []);

  const fetchDemoSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('demo_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDemoSessions((data || []) as DemoSession[]);
    } catch (err: any) {
      console.error('Error fetching demo sessions:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch demo sessions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSessionLink = async (sessionId: string) => {
    // Generate unique session_id using the database function
    const { data, error } = await (supabase as any).rpc('generate_demo_session_id');
    
    if (error) {
      console.error('Error generating session ID:', error);
      return null;
    }

    const generatedSessionId = data;
    const baseUrl = window.location.origin;
    return `${baseUrl}/demo-session/${generatedSessionId}`;
  };

  const approveSession = async () => {
    if (!selectedSession) {
      toast({
        title: 'Missing Information',
        description: 'Please select a session',
        variant: 'destructive'
      });
      return;
    }

    // Use the preferred date/time from the form submission
    const scheduledDateIso = (() => {
      if (selectedSession.preferred_date && selectedSession.preferred_time) {
        const [startTimeRaw] = selectedSession.preferred_time.split('-');
        const startTime = startTimeRaw?.trim();
        if (startTime) {
          const parsed = new Date(`${selectedSession.preferred_date}T${startTime}`);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString();
          }
        }
      }
      return new Date().toISOString();
    })();

    try {
      // Generate unique session_id and meeting link
      const { data: generatedId, error: idError } = await (supabase as any).rpc('generate_demo_session_id');
      
      if (idError) throw idError;

      const meetingLink = `${window.location.origin}/demo-session/${generatedId}`;

      // Update demo session
      const { error: updateError } = await (supabase as any)
        .from('demo_sessions')
        .update({
          status: 'approved',
          session_id: generatedId,
          scheduled_date: scheduledDateIso,
          meeting_link: meetingLink,
          admin_notes: adminNotes,
          created_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSession.id);

      if (updateError) throw updateError;

      // Refresh list
      await fetchDemoSessions();
      
      // Show the link in a dialog
      setGeneratedLink(meetingLink);
      setShowLinkDialog(true);
      
      // Auto-copy to clipboard
      navigator.clipboard.writeText(meetingLink);
      
      toast({
        title: 'Demo Session Approved',
        description: 'Meeting link has been generated and copied to clipboard.',
        duration: 5000
      });
      
      setSelectedSession(null);
      setAdminNotes('');
    } catch (err: any) {
      console.error('Error approving session:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to approve session',
        variant: 'destructive'
      });
    }
  };

  const rejectSession = async (sessionId: string, notes: string) => {
    try {
      const { error } = await (supabase as any)
        .from('demo_sessions')
        .update({
          status: 'rejected',
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Demo Session Rejected',
        description: 'The request has been marked as rejected.'
      });

      fetchDemoSessions();
    } catch (err: any) {
      console.error('Error rejecting session:', err);
      toast({
        title: 'Error',
        description: 'Failed to reject session',
        variant: 'destructive'
      });
    }
  };

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link Copied',
      description: 'Meeting link copied to clipboard'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      completed: 'outline',
      expired: 'outline'
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  const filteredSessions = demoSessions.filter(session => {
    if (activeTab === 'all') return true;
    return session.status === activeTab;
  });

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Video className="w-6 h-6" />
              <div>
                <CardTitle>Demo Sessions Management</CardTitle>
                <CardDescription className="text-blue-100">
                  Review and manage demo session requests
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{demoSessions.length}</p>
              <p className="text-sm text-blue-100">Total Requests</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <p className="text-center py-8 text-gray-500">Loading demo sessions...</p>
              ) : filteredSessions.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No demo sessions found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requester Info</TableHead>
                      <TableHead>Project Details</TableHead>
                      <TableHead>Preferred Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Meeting Link</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 font-medium">
                              <User className="w-4 h-4 text-gray-500" />
                              <span>{session.requester_name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Mail className="w-3 h-3" />
                              <span>{session.requester_email}</span>
                            </div>
                            {session.requester_phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Phone className="w-3 h-3" />
                                <span>{session.requester_phone}</span>
                              </div>
                            )}
                            {session.requester_company && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Building2 className="w-3 h-3" />
                                <span>{session.requester_company}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {session.project_type && (
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-gray-500" />
                                <span className="font-medium capitalize">{session.project_type.replace(/-/g, ' ')}</span>
                              </div>
                            )}
                            {session.requester_message && (
                              <p className="text-xs text-gray-600 max-w-xs truncate" title={session.requester_message}>
                                {session.requester_message}
                              </p>
                            )}
                            {!session.requester_message && (
                              <span className="text-xs text-gray-400">No project description</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {session.preferred_date && (
                              <div className="flex items-center gap-1 text-xs">
                                <Calendar className="w-3 h-3 text-gray-500" />
                                <span>{new Date(session.preferred_date).toLocaleDateString('en-IN')}</span>
                              </div>
                            )}
                            {session.preferred_time && (
                              <div className="text-xs text-gray-600">
                                {session.preferred_time}
                              </div>
                            )}
                            {!session.preferred_date && !session.preferred_time && (
                              <span className="text-xs text-gray-400">Not specified</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                        <TableCell>
                          {session.scheduled_date ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3" />
                              {new Date(session.scheduled_date).toLocaleString('en-IN')}
                            </div>
                          ) : (
                            <span className="text-gray-400">Not scheduled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {session.meeting_link ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyMeetingLink(session.meeting_link!)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(session.meeting_link!, '_blank')}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-gray-600 break-all max-w-xs">
                                {session.meeting_link}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not generated</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {/* Reply button - available for all statuses */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                let emailSubject = '';
                                let emailBody = '';
                                
                                if (session.status === 'pending') {
                                  emailSubject = encodeURIComponent('Re: Your Demo Session Request');
                                  emailBody = encodeURIComponent(
                                    `Hi ${session.requester_name},\n\nThank you for your interest in our demo session!\n\nWe have received your request and will review it shortly. Our team will get back to you within 24 hours with a scheduled time for your 30-minute free demo session.\n\nIf you have any questions in the meantime, please feel free to reply to this email.\n\nBest regards,\nThe Team`
                                  );
                                } else if (session.status === 'approved' && session.meeting_link) {
                                  emailSubject = encodeURIComponent('Your Demo Session Link');
                                  emailBody = encodeURIComponent(
                                    `Hi ${session.requester_name},\n\nYour demo session has been scheduled for ${new Date(session.scheduled_date!).toLocaleString('en-IN')}.\n\nJoin the demo session using this link:\n${session.meeting_link}\n\nThe session will last for 30 minutes.\n\nBest regards,\nThe Team`
                                  );
                                } else if (session.status === 'rejected') {
                                  emailSubject = encodeURIComponent('Re: Your Demo Session Request');
                                  emailBody = encodeURIComponent(
                                    `Hi ${session.requester_name},\n\nThank you for your interest in our demo session.\n\nUnfortunately, we are unable to accommodate your demo request at this time.${session.admin_notes ? `\n\nReason: ${session.admin_notes}` : ''}\n\nIf you have any questions, please feel free to reply to this email.\n\nBest regards,\nThe Team`
                                  );
                                } else {
                                  emailSubject = encodeURIComponent('Re: Your Demo Session');
                                  emailBody = encodeURIComponent(
                                    `Hi ${session.requester_name},\n\nThank you for your interest in our demo session.\n\nBest regards,\nThe Team`
                                  );
                                }
                                
                                window.location.href = `mailto:${session.requester_email}?subject=${emailSubject}&body=${emailBody}`;
                              }}
                            >
                              <Mail className="w-4 h-4 mr-1" />
                              Reply
                            </Button>

                            {session.status === 'pending' && (
                              <>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => {
                                        setSelectedSession(session);
                                        setAdminNotes(session.admin_notes || '');
                                      }}
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Approve Demo Session</DialogTitle>
                                      <DialogDescription>
                                        Schedule a demo session for {session.requester_name}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                                        <p className="text-sm font-semibold text-blue-900">User's Preferred Schedule:</p>
                                        <div className="space-y-1 text-sm text-blue-800">
                                          <p><strong>Date:</strong> {session.preferred_date || 'Not specified'}</p>
                                          <p><strong>Time:</strong> {session.preferred_time || 'Not specified'}</p>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2">
                                          ℹ️ The demo session will be scheduled for the above date/time
                                        </p>
                                      </div>
                                      <div>
                                        <Label htmlFor="admin_notes">Admin Notes (Optional)</Label>
                                        <Textarea
                                          id="admin_notes"
                                          value={adminNotes}
                                          onChange={(e) => setAdminNotes(e.target.value)}
                                          placeholder="Add any notes for internal reference..."
                                        />
                                      </div>
                                      <Button onClick={approveSession} className="w-full">
                                        Approve & Generate Link
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    const notes = prompt('Rejection reason (optional):');
                                    if (notes !== null) {
                                      rejectSession(session.id, notes);
                                    }
                                  }}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {session.status === 'approved' && session.meeting_link && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const emailSubject = encodeURIComponent('Your Demo Session Link');
                                  const emailBody = encodeURIComponent(
                                    `Hi ${session.requester_name},\n\nYour demo session has been scheduled for ${new Date(session.scheduled_date!).toLocaleString('en-IN')}.\n\nJoin the demo session using this link:\n${session.meeting_link}\n\nThe session will last for 30 minutes.\n\nBest regards,\nThe Team`
                                  );
                                  window.location.href = `mailto:${session.requester_email}?subject=${emailSubject}&body=${emailBody}`;
                                }}
                              >
                                <Mail className="w-4 h-4 mr-1" />
                                Send Link
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Link Display Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demo Session Link Generated</DialogTitle>
            <DialogDescription>
              The meeting link has been generated and copied to your clipboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Meeting Link</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    toast({
                      title: 'Link Copied',
                      description: 'Meeting link copied to clipboard'
                    });
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={() => {
                const emailSubject = encodeURIComponent('Your Demo Session Link');
                const emailBody = encodeURIComponent(
                  `Hi,\n\nYour demo session has been scheduled.\n\nJoin the demo session using this link:\n${generatedLink}\n\nThe session will last for 30 minutes.\n\nBest regards,\nThe Team`
                );
                window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
              }}
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Link via Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

