import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User,
  Calendar,
  FileText,
  Eye,
  Upload,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DesignerSidebar } from '@/components/DesignerSidebar';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import DesignerFileReuploadDialog from '@/components/DesignerFileReuploadDialog';

interface Complaint {
  id: string;
  session_id: string;
  booking_id: string;
  customer_id: string;
  designer_id: string;
  file_id: string;
  complaint_type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  admin_notes: string | null;
  resolution: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  customer_name: string;
  file_name: string;
  new_file_id?: string;
  new_file_uploaded_at?: string;
  customer_review_notes?: string;
  customer_reviewed_at?: string;
  reupload_count?: number;
  latest_file_id?: string;
}

export default function DesignerComplaints() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReuploadDialog, setShowReuploadDialog] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);

      // 1) Fetch complaints for this designer (only show approved complaints, not pending/under_review/rejected)
      const { data: rawComplaints, error: complaintsError } = await supabase
        .from('customer_complaints')
        .select('*')
        .eq('designer_id', user?.id)
        .not('status', 'in', '(pending,under_review,rejected)')
        .order('created_at', { ascending: false });

      if (complaintsError) throw complaintsError;

      const complaintsList = rawComplaints || [];
      if (complaintsList.length === 0) {
        setComplaints([]);
        return;
      }

      // 2) Batch fetch customer profiles
      const customerIds = Array.from(new Set(complaintsList.map(c => c.customer_id).filter(Boolean)));
      let customerMap: Record<string, { first_name?: string; last_name?: string; full_name?: string }> = {};
      if (customerIds.length > 0) {
        const { data: customerProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, full_name')
          .in('user_id', customerIds);
        if (!profilesError && customerProfiles) {
          customerProfiles.forEach(p => { customerMap[p.user_id] = p; });
        }
      }

      // 3) Batch fetch file names
      const fileIds = Array.from(new Set(complaintsList.map(c => c.file_id).filter(Boolean)));
      let fileMap: Record<string, { name?: string }> = {};
      if (fileIds.length > 0) {
        const { data: files, error: filesError } = await supabase
          .from('session_files')
          .select('id, name')
          .in('id', fileIds);
        if (!filesError && files) {
          files.forEach(f => { fileMap[f.id] = { name: f.name }; });
        }
      }

      // 4) Format
      const formattedComplaints: Complaint[] = complaintsList.map((c: any) => {
        const prof = customerMap[c.customer_id] || {} as any;
        const fullName = prof.full_name || `${prof.first_name || ''} ${prof.last_name || ''}`.trim();
        const fileName = (fileMap[c.file_id]?.name) || 'Unknown File';
        return {
          ...c,
          customer_name: fullName || prof.email || 'Unknown Customer',
          file_name: fileName,
        } as Complaint;
      });

      setComplaints(formattedComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast({
        title: "Error",
        description: "Failed to fetch complaints",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getComplaintTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'quality_issue': 'Quality Issue',
      'wrong_file': 'Wrong File',
      'incomplete_work': 'Incomplete Work',
      // 'late_delivery': 'Late Delivery',
      'communication_issue': 'Communication Issue',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      'pending': 'secondary',
      'under_review': 'default',
      'rejected': 'destructive',
      'approved': 'outline',
      'file_uploaded': 'secondary',
      'customer_approved': 'default',
      'customer_rejected': 'destructive',
      'resolved': 'default'
    };
    return variants[status] || 'default';
  };

  const getPriorityBadge = (priority: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      'low': 'outline',
      'medium': 'default',
      'high': 'secondary',
      'urgent': 'destructive'
    };
    return variants[priority] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'under_review':
        return <Eye className="w-4 h-4" />;
      case 'rejected':
        return <AlertTriangle className="w-4 h-4" />;
      case 'approved':
        return <Upload className="w-4 h-4" />;
      case 'file_uploaded':
        return <FileText className="w-4 h-4" />;
      case 'customer_approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'customer_rejected':
        return <AlertTriangle className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleReupload = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowReuploadDialog(true);
  };

  const handleReuploadComplete = () => {
    fetchComplaints();
    setShowReuploadDialog(false);
    setSelectedComplaint(null);
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <DesignerSidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <SidebarTrigger />
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate">Complaints</h1>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Customer Complaints</h2>
                  <p className="text-gray-600 text-sm sm:text-base truncate">View and respond to customer complaints about your work</p>
                </div>
              </div>

              {/* Complaints List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : complaints.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Complaints</h3>
                    <p className="text-gray-600">
                      You haven't received any complaints from customers yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {complaint.title}
                            </h3>
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{complaint.customer_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{complaint.file_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {new Date(complaint.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={getStatusBadge(complaint.status)} className="flex items-center gap-1">
                              {getStatusIcon(complaint.status)}
                              {complaint.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant={getPriorityBadge(complaint.priority)}>
                              {complaint.priority}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Complaint Type</h4>
                            <Badge variant="outline">
                              {getComplaintTypeLabel(complaint.complaint_type)}
                            </Badge>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                            <p className="text-gray-700">{complaint.description}</p>
                          </div>

                          {complaint.admin_notes && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Admin Notes</h4>
                              <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">
                                {complaint.admin_notes}
                              </p>
                            </div>
                          )}

                          {complaint.admin_notes && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Admin Notes</h4>
                              <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">
                                {complaint.admin_notes}
                              </p>
                            </div>
                          )}

                          {complaint.status === 'approved' && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                Action Required
                              </h4>
                              <p className="text-sm text-orange-800 mb-3">
                                This complaint has been approved. Please upload a corrected version of the file.
                              </p>
                              <Button 
                                onClick={() => handleReupload(complaint)}
                                className="bg-orange-600 hover:bg-orange-700"
                                size="sm"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Corrected File
                              </Button>
                            </div>
                          )}

                          {complaint.status === 'file_uploaded' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Waiting for Customer Review
                              </h4>
                              <p className="text-sm text-blue-800">
                                Your corrected file has been uploaded and is waiting for customer review.
                              </p>
                              {complaint.new_file_uploaded_at && (
                                <p className="text-xs text-blue-600 mt-2">
                                  Uploaded: {new Date(complaint.new_file_uploaded_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}

                          {complaint.status === 'customer_approved' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Customer Approved
                              </h4>
                              <p className="text-sm text-green-800">
                                The customer has approved your corrected file. This complaint is now resolved.
                              </p>
                              {complaint.customer_reviewed_at && (
                                <p className="text-xs text-green-600 mt-2">
                                  Approved: {new Date(complaint.customer_reviewed_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}

                          {complaint.status === 'customer_rejected' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Customer Rejected
                              </h4>
                              <p className="text-sm text-red-800 mb-3">
                                The customer has rejected your corrected file. Please upload another version.
                              </p>
                              {complaint.customer_review_notes && (
                                <div className="mb-3">
                                  <h5 className="font-medium text-red-900 mb-1">Customer Feedback:</h5>
                                  <p className="text-sm text-red-700 bg-red-100 p-2 rounded">
                                    {complaint.customer_review_notes}
                                  </p>
                                </div>
                              )}
                              <Button 
                                onClick={() => handleReupload(complaint)}
                                className="bg-red-600 hover:bg-red-700"
                                size="sm"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload New Version (Attempt {(complaint.reupload_count || 0) + 1})
                              </Button>
                            </div>
                          )}

                          {complaint.resolution && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Resolution</h4>
                              <p className="text-gray-700 bg-green-50 p-3 rounded-lg">
                                {complaint.resolution}
                              </p>
                            </div>
                          )}

                          {complaint.status === 'resolved' && complaint.resolved_at && (
                            <div className="text-sm text-gray-500">
                              Resolved on: {new Date(complaint.resolved_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Re-upload Dialog */}
      {selectedComplaint && (
        <DesignerFileReuploadDialog
          isOpen={showReuploadDialog}
          onClose={() => setShowReuploadDialog(false)}
          complaintId={selectedComplaint.id}
          originalFileId={selectedComplaint.file_id}
          sessionId={selectedComplaint.session_id}
          customerName={selectedComplaint.customer_name}
          complaintTitle={selectedComplaint.title}
          complaintDescription={selectedComplaint.description}
          reuploadCount={selectedComplaint.reupload_count || 0}
          onFileUploaded={handleReuploadComplete}
        />
      )}
    </SidebarProvider>
  );
}
