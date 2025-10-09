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
  RefreshCw,
  Upload,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustomerSidebar } from '@/components/CustomerSidebar';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import CustomerFileReviewDialog from '@/components/CustomerFileReviewDialog';

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
  designer_name: string;
  file_name: string;
  new_file_id?: string;
  new_file_uploaded_at?: string;
  customer_review_notes?: string;
  customer_reviewed_at?: string;
  reupload_count?: number;
  latest_file_id?: string;
}

export default function CustomerComplaints() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [newFileData, setNewFileData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);

      // 1) Fetch complaints for this customer (no joins)
      const { data: rawComplaints, error: complaintsError } = await supabase
        .from('customer_complaints')
        .select('*')
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (complaintsError) throw complaintsError;

      const complaintsList = rawComplaints || [];
      if (complaintsList.length === 0) {
        setComplaints([]);
        return;
      }

      // 2) Batch fetch designer profiles
      const designerIds = Array.from(new Set(complaintsList.map(c => c.designer_id).filter(Boolean)));
      let designerMap: Record<string, { first_name?: string; last_name?: string; full_name?: string }> = {};
      if (designerIds.length > 0) {
        const { data: designerProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, full_name')
          .in('user_id', designerIds);
        if (!profilesError && designerProfiles) {
          designerProfiles.forEach(p => { designerMap[p.user_id] = p; });
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

      // 4) Format results
      const formattedComplaints: Complaint[] = complaintsList.map((c: any) => {
        const prof = designerMap[c.designer_id] || {} as any;
        const fullName = prof.full_name || `${prof.first_name || ''} ${prof.last_name || ''}`.trim();
        const fileName = (fileMap[c.file_id]?.name) || 'Unknown File';
        return {
          ...c,
          designer_name: fullName || prof.email || 'Unknown Designer',
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
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      'under_review': { color: 'bg-blue-100 text-blue-800', icon: Eye, label: 'Under Review' },
      'rejected': { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Rejected' },
      'approved': { color: 'bg-orange-100 text-orange-800', icon: Upload, label: 'Approved' },
      'file_uploaded': { color: 'bg-purple-100 text-purple-800', icon: FileText, label: 'File Ready' },
      'customer_approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
      'customer_rejected': { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Rejected' },
      'resolved': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Resolved' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'low': { color: 'bg-gray-100 text-gray-800', label: 'Low' },
      'medium': { color: 'bg-blue-100 text-blue-800', label: 'Medium' },
      'high': { color: 'bg-orange-100 text-orange-800', label: 'High' },
      'urgent': { color: 'bg-red-100 text-red-800', label: 'Urgent' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReviewFile = async (complaint: Complaint) => {
    if (!complaint.new_file_id) return;

    try {
      // Fetch the new file details
      const { data: fileData, error } = await supabase
        .from('session_files')
        .select('*')
        .eq('id', complaint.new_file_id)
        .single();

      if (error) throw error;

      setNewFileData(fileData);
      setSelectedComplaint(complaint);
      setShowReviewDialog(true);
    } catch (error) {
      console.error('Error fetching file details:', error);
      toast({
        title: "Error",
        description: "Failed to load file details",
        variant: "destructive",
      });
    }
  };

  const handleReviewComplete = () => {
    fetchComplaints();
    setShowReviewDialog(false);
    setSelectedComplaint(null);
    setNewFileData(null);
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <CustomerSidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-semibold text-gray-900">My Complaints</h1>
              </div>
              <Button onClick={fetchComplaints} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Your Complaints</h2>
                  <p className="text-gray-600">View the status of complaints you've submitted about designer work</p>
                </div>
              </div>

              {/* Complaints List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading complaints...</p>
                  </div>
                </div>
              ) : complaints.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Complaints Yet</h3>
                      <p className="text-gray-600 mb-4">You haven't submitted any complaints yet.</p>
                      <p className="text-sm text-gray-500">Use the complaint button next to files in your Files section to submit feedback about designer work.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {complaints.map((complaint) => (
                    <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-lg">{complaint.title}</CardTitle>
                              {getStatusBadge(complaint.status)}
                              {getPriorityBadge(complaint.priority)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>Against: {complaint.designer_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                <span>File: {complaint.file_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Submitted: {formatDate(complaint.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getComplaintTypeLabel(complaint.complaint_type)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {complaint.description}
                            </p>
                          </div>

                          {complaint.admin_notes && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Admin Notes:</h4>
                              <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">
                                {complaint.admin_notes}
                              </p>
                            </div>
                          )}

                          {complaint.status === 'approved' && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                Complaint Approved
                              </h4>
                              <p className="text-sm text-orange-800 mb-3">
                                Your complaint has been approved. The designer will upload a corrected version of the file.
                              </p>
                              <p className="text-xs text-orange-600">
                                You will be notified when the corrected file is ready for your review.
                              </p>
                            </div>
                          )}

                          {complaint.status === 'file_uploaded' && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                New File Ready for Review
                              </h4>
                              <p className="text-sm text-purple-800 mb-3">
                                The designer has uploaded a corrected version. Please review it and approve or reject it.
                                {complaint.reupload_count && complaint.reupload_count > 0 && (
                                  <span className="block mt-1 text-xs text-purple-600">
                                    This is attempt {complaint.reupload_count + 1} - please check if the previous feedback has been addressed.
                                  </span>
                                )}
                              </p>
                              {complaint.new_file_uploaded_at && (
                                <p className="text-xs text-purple-600 mb-3">
                                  Uploaded: {formatDate(complaint.new_file_uploaded_at)}
                                </p>
                              )}
                              <Button 
                                onClick={() => handleReviewFile(complaint)}
                                className="bg-purple-600 hover:bg-purple-700"
                                size="sm"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Review File
                              </Button>
                            </div>
                          )}

                          {complaint.status === 'customer_approved' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                File Approved
                              </h4>
                              <p className="text-sm text-green-800">
                                You have approved the corrected file. This complaint is now resolved.
                              </p>
                              {complaint.customer_reviewed_at && (
                                <p className="text-xs text-green-600 mt-2">
                                  Approved: {formatDate(complaint.customer_reviewed_at)}
                                </p>
                              )}
                            </div>
                          )}

                          {complaint.status === 'customer_rejected' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                File Rejected
                              </h4>
                              <p className="text-sm text-red-800 mb-3">
                                You have rejected the corrected file. The designer will upload another version.
                              </p>
                              {complaint.customer_review_notes && (
                                <div className="mb-3">
                                  <h5 className="font-medium text-red-900 mb-1">Your Feedback:</h5>
                                  <p className="text-sm text-red-700 bg-red-100 p-2 rounded">
                                    {complaint.customer_review_notes}
                                  </p>
                                </div>
                              )}
                              {complaint.customer_reviewed_at && (
                                <p className="text-xs text-red-600">
                                  Rejected: {formatDate(complaint.customer_reviewed_at)}
                                </p>
                              )}
                            </div>
                          )}

                          {complaint.resolution && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Resolution:</h4>
                              <p className="text-gray-700 bg-green-50 p-3 rounded-lg">
                                {complaint.resolution}
                              </p>
                              {complaint.resolved_at && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Resolved on: {formatDate(complaint.resolved_at)}
                                </p>
                              )}
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

      {/* File Review Dialog */}
      {selectedComplaint && newFileData && (
        <CustomerFileReviewDialog
          isOpen={showReviewDialog}
          onClose={() => setShowReviewDialog(false)}
          complaintId={selectedComplaint.id}
          newFileId={newFileData.id}
          fileName={newFileData.name}
          fileUrl={newFileData.file_url}
          fileType={newFileData.file_type}
          fileSize={newFileData.file_size}
          uploadedAt={newFileData.created_at}
          designerName={selectedComplaint.designer_name}
          complaintTitle={selectedComplaint.title}
          originalDescription={selectedComplaint.description}
          reuploadCount={selectedComplaint.reupload_count || 0}
          onReviewComplete={handleReviewComplete}
        />
      )}
    </SidebarProvider>
  );
}
