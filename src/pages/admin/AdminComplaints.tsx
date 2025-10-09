import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter,
  MessageSquare,
  User,
  Calendar,
  FileText,
  Eye,
  Edit,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  designer_name: string;
  file_name: string;
}

export default function AdminComplaints() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolution, setResolution] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      
      // Fetch complaints
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('customer_complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (complaintsError) throw complaintsError;

      // Fetch customer profiles
      const customerIds = [...new Set(complaintsData?.map(c => c.customer_id) || [])];
      const { data: customersData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, full_name')
        .in('user_id', customerIds);

      // Fetch designer profiles
      const designerIds = [...new Set(complaintsData?.map(c => c.designer_id) || [])];
      const { data: designersData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, full_name')
        .in('user_id', designerIds);

      // Fetch file information
      const fileIds = [...new Set(complaintsData?.map(c => c.file_id).filter(Boolean) || [])];
      const { data: filesData } = await supabase
        .from('session_files')
        .select('id, name')
        .in('id', fileIds);

      // Create lookup maps
      const customersMap = new Map(customersData?.map(c => [c.user_id, c]) || []);
      const designersMap = new Map(designersData?.map(d => [d.user_id, d]) || []);
      const filesMap = new Map(filesData?.map(f => [f.id, f]) || []);

      const formattedComplaints = complaintsData?.map(complaint => {
        const customer = customersMap.get(complaint.customer_id);
        const designer = designersMap.get(complaint.designer_id);
        const file = filesMap.get(complaint.file_id);

        return {
          ...complaint,
          customer_name: customer?.full_name || 
                       `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 
                       customer?.email || 'Unknown Customer',
          designer_name: designer?.full_name || 
                        `${designer?.first_name || ''} ${designer?.last_name || ''}`.trim() || 
                        designer?.email || 'Unknown Designer',
          file_name: file?.name || 'Unknown File'
        };
      }) || [];

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

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAdminNotes(complaint.admin_notes || '');
    setResolution(complaint.resolution || '');
    setShowDetails(true);
  };

  const handleUpdateComplaint = async (status: string) => {
    if (!selectedComplaint) return;

    try {
      setUpdating(true);

      // Use the new workflow function for better handling
      const { data: result, error } = await supabase.rpc('process_complaint_workflow', {
        p_complaint_id: selectedComplaint.id,
        p_action: status === 'rejected' ? 'admin_reject' : 
                  status === 'approved' ? 'admin_approve' : 'admin_update',
        p_admin_id: user?.id,
        p_notes: adminNotes
      });

      if (error) throw error;

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to update complaint');
      }

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: user?.id,
        p_action_type: 'complaint_update',
        p_target_type: 'complaint',
        p_target_id: selectedComplaint.id,
        p_description: `Updated complaint status to ${status}`,
        p_metadata: { status, admin_notes: adminNotes, resolution }
      });

      toast({
        title: "Complaint Updated",
        description: `Complaint status updated to ${status}. All parties have been notified.`,
      });

      setShowDetails(false);
      fetchComplaints();
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast({
        title: "Error",
        description: "Failed to update complaint",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Refund functionality removed - complaints now trigger file re-upload workflow instead

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
        return <CheckCircle className="w-4 h-4" />;
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

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.designer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || complaint.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || complaint.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  console.log({complaints})

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Complaints</h1>
          <p className="text-gray-600">Manage and resolve customer complaints about designer files</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="file_uploaded">File Uploaded</SelectItem>
                <SelectItem value="customer_approved">Customer Approved</SelectItem>
                <SelectItem value="customer_rejected">Customer Rejected</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Complaints Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Complaints ({filteredComplaints.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Designer</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium truncate">{complaint.title}</p>
                          <p className="text-sm text-gray-500 truncate">{complaint.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getComplaintTypeLabel(complaint.complaint_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {complaint.customer_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {complaint.designer_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="truncate max-w-32">{complaint.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(complaint.status)} className="flex items-center gap-1">
                          {getStatusIcon(complaint.status)}
                          {complaint.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadge(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(complaint)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complaint Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complaint Details</DialogTitle>
          </DialogHeader>
          
          {selectedComplaint && (
            <div className="space-y-6">
              {/* Complaint Information */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Complaint Information</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Title:</strong> {selectedComplaint.title}</p>
                        <p><strong>Type:</strong> {getComplaintTypeLabel(selectedComplaint.complaint_type)}</p>
                        <p><strong>Status:</strong> 
                          <Badge variant={getStatusBadge(selectedComplaint.status)} className="ml-2">
                            {selectedComplaint.status.replace('_', ' ')}
                          </Badge>
                        </p>
                        <p><strong>Priority:</strong> 
                          <Badge variant={getPriorityBadge(selectedComplaint.priority)} className="ml-2">
                            {selectedComplaint.priority}
                          </Badge>
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Related Information</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Customer:</strong> {selectedComplaint.customer_name}</p>
                        <p><strong>Designer:</strong> {selectedComplaint.designer_name}</p>
                        <p><strong>File:</strong> {selectedComplaint.file_name}</p>
                        <p><strong>Session ID:</strong> {selectedComplaint.session_id}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{selectedComplaint.description}</p>
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <div>
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea
                  id="admin_notes"
                  placeholder="Add internal notes about this complaint..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Resolution */}
              <div>
                <Label htmlFor="resolution">Resolution</Label>
                <Textarea
                  id="resolution"
                  placeholder="Describe how this complaint was resolved..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Cancel
                </Button>
                {selectedComplaint.status === 'pending' && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => handleUpdateComplaint('under_review')}
                      disabled={updating}
                    >
                      Mark Under Review
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleUpdateComplaint('rejected')}
                      disabled={updating}
                      className="text-red-600 hover:text-red-700"
                    >
                      Reject
                    </Button>
                    <Button 
                      onClick={() => handleUpdateComplaint('approved')}
                      disabled={updating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updating ? 'Updating...' : 'Approve'}
                    </Button>
                  </>
                )}
                {selectedComplaint.status === 'under_review' && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => handleUpdateComplaint('rejected')}
                      disabled={updating}
                      className="text-red-600 hover:text-red-700"
                    >
                      Reject
                    </Button>
                    <Button 
                      onClick={() => handleUpdateComplaint('approved')}
                      disabled={updating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updating ? 'Updating...' : 'Approve'}
                    </Button>
                  </>
                )}
                {selectedComplaint.status === 'customer_approved' && (
                  <Button 
                    onClick={() => handleUpdateComplaint('resolved')}
                    disabled={updating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updating ? 'Updating...' : 'Mark Resolved'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
