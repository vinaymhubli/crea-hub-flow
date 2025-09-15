import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter,
  FileText,
  User,
  Calendar,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FinalFile {
  file_id: string;
  session_id: string;
  booking_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  designer_id: string;
  designer_name: string;
  customer_id: string;
  customer_name: string;
  uploaded_at: string;
  complaint_count: number;
  has_complaints: boolean;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  complaint_type: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function AdminFinalFiles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<FinalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedFile, setSelectedFile] = useState<FinalFile | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showComplaints, setShowComplaints] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFinalFiles();
    }
  }, [user]);

  const fetchFinalFiles = async () => {
    try {
      setLoading(true);
      
      console.log('🚀 Starting to fetch final files - VERSION 2.0...');
      
      // Direct query approach - get all session files first
      const { data: allFiles, error: allFilesError } = await supabase
        .from('session_files')
        .select(`
          id,
          name,
          file_url,
          file_size,
          session_id,
          booking_id,
          uploaded_by_id,
          uploaded_by_type,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (allFilesError) {
        console.error('Error fetching session files:', allFilesError);
        throw allFilesError;
      }
      
      console.log('All session files fetched:', allFiles?.length || 0, 'files');
      console.log('Sample file:', allFiles?.[0]);
      
      // Get all sessions that have customers (not just active ones)
      // Try multiple approaches to find customer-linked sessions
      
      // Approach 1: Get from active_sessions
      const { data: activeSessions, error: sessionsError } = await supabase
        .from('active_sessions')
        .select('session_id, customer_id, designer_id');
      
      // Approach 2: Get from bookings table
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, customer_id, designer_id, session_id');
      
      // Approach 3: Get from session_approval_requests
      const { data: approvalRequests, error: approvalError } = await supabase
        .from('session_approval_requests')
        .select('session_id, customer_id, designer_id');
      
      if (sessionsError) console.error('Error fetching active sessions:', sessionsError);
      if (bookingsError) console.error('Error fetching bookings:', bookingsError);
      if (approvalError) console.error('Error fetching approval requests:', approvalError);
      
      console.log('Active sessions:', activeSessions);
      console.log('Bookings:', bookings);
      console.log('Approval requests:', approvalRequests);
      
      // Create a map of session_id to customer info from all sources
      const sessionToCustomerMap = new Map();
      
      // Add from active_sessions
      activeSessions?.forEach(session => {
        sessionToCustomerMap.set(session.session_id, {
          customer_id: session.customer_id,
          designer_id: session.designer_id,
          source: 'active_sessions'
        });
      });
      
      // Add from bookings
      bookings?.forEach(booking => {
        if (booking.session_id) {
          sessionToCustomerMap.set(booking.session_id, {
            customer_id: booking.customer_id,
            designer_id: booking.designer_id,
            source: 'bookings'
          });
        }
      });
      
      // Add from approval requests
      approvalRequests?.forEach(request => {
        sessionToCustomerMap.set(request.session_id, {
          customer_id: request.customer_id,
          designer_id: request.designer_id,
          source: 'approval_requests'
        });
      });
      
      console.log('Session to customer map:', Array.from(sessionToCustomerMap.entries()));
      
      // Also check if we need to handle session IDs with/without prefixes
      // Some files might have session_id like "1757509729664_wzastd3mu" 
      // while active_sessions might have "live_1757509729664_wzastd3mu"
      const sessionIdsFromFiles = allFiles?.map(f => f.session_id) || [];
      console.log('Session IDs from files:', sessionIdsFromFiles);
      
      // Try to match with and without "live_" prefix
      allFiles?.forEach(file => {
        const sessionId = file.session_id;
        const sessionIdWithPrefix = `live_${sessionId}`;
        const sessionIdWithoutPrefix = sessionId.replace('live_', '');
        
        // Check if any active session matches (with or without prefix)
        const matchingSession = activeSessions?.find(s => 
          s.session_id === sessionId || 
          s.session_id === sessionIdWithPrefix || 
          s.session_id === sessionIdWithoutPrefix ||
          s.session_id === sessionId.replace('live_', '') ||
          s.session_id === `live_${sessionId.replace('live_', '')}`
        );
        
        if (matchingSession) {
          sessionToCustomerMap.set(sessionId, {
            customer_id: matchingSession.customer_id,
            designer_id: matchingSession.designer_id,
            source: 'matched'
          });
          console.log(`✅ Matched session ${sessionId} with session ${matchingSession.session_id} from ${matchingSession.source || 'unknown'}`);
        } else {
          console.log(`❌ No match for session ${sessionId}`);
          console.log(`  -> Tried: ${sessionId}, ${sessionIdWithPrefix}, ${sessionIdWithoutPrefix}`);
          console.log(`  -> Available sessions:`, Array.from(sessionToCustomerMap.keys()));
        }
      });
      
      // TEMPORARY FIX: Show all approved designer files regardless of customer linking
      // This will help us see the files while we debug the session matching
      const directData = allFiles?.filter(file => {
        // Must be uploaded by a designer
        const isDesignerUpload = file.uploaded_by_type === 'designer' || 
                                file.uploaded_by_type === null || 
                                file.uploaded_by_type === undefined;
        
        // For now, show all approved files (we'll add customer linking back later)
        const isApproved = file.status === 'approved';
        
        console.log(`File ${file.name}: designer=${isDesignerUpload}, approved=${isApproved}, status=${file.status}, session_id=${file.session_id}`);
        
        return isDesignerUpload && isApproved;
      }) || [];
      
      console.log('Filtered designer files:', directData.length, 'files');
      console.log('Sample filtered file:', directData[0]);

        // Get designer and customer names separately
        const fileIds = directData?.map(f => f.uploaded_by_id) || [];
        const customerIds = directData?.map(f => {
          const sessionInfo = sessionToCustomerMap.get(f.session_id);
          return sessionInfo?.customer_id;
        }).filter(Boolean) || [];

        // Get designer profiles
        const { data: designers } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, full_name')
          .in('user_id', fileIds);

        // Get customer profiles
        const { data: customers } = customerIds.length > 0 ? await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, full_name')
          .in('user_id', customerIds) : { data: [] };

        // Get complaint counts
        const { data: complaints } = await supabase
          .from('customer_complaints')
          .select('file_id')
          .in('file_id', directData?.map(f => f.id) || []);

        // Create lookup maps
        const designersMap = new Map(designers?.map(d => [d.user_id, d]) || []);
        const customersMap = new Map(customers?.map(c => [c.user_id, c]) || []);
        const complaintsMap = new Map();
        complaints?.forEach(c => {
          complaintsMap.set(c.file_id, (complaintsMap.get(c.file_id) || 0) + 1);
        });

        // Format the data - using active_sessions for customer info
        const formattedFiles = directData?.map(file => {
          const designer = designersMap.get(file.uploaded_by_id);
          const sessionInfo = sessionToCustomerMap.get(file.session_id);
          const customer = sessionInfo ? customersMap.get(sessionInfo.customer_id) : null;
          const complaintCount = complaintsMap.get(file.id) || 0;

          return {
            file_id: file.id,
            session_id: file.session_id,
            booking_id: file.booking_id,
            file_name: file.name || 'Unknown File',
            file_url: file.file_url,
            file_size: file.file_size || 0,
            designer_id: file.uploaded_by_id,
            designer_name: designer?.full_name || 
                          `${designer?.first_name || ''} ${designer?.last_name || ''}`.trim() || 
                          'Unknown Designer',
            customer_id: sessionInfo?.customer_id || null,
            customer_name: customer?.full_name || 
                          `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 
                          (sessionInfo ? 'Unknown Customer' : 'Customer Link Pending'),
            uploaded_at: file.created_at,
            status: file.status || 'unknown',
            complaint_count: complaintCount,
            has_complaints: complaintCount > 0
          };
        }) || [];

        console.log('Formatted files:', formattedFiles.length, 'files');
        console.log('Sample formatted file:', formattedFiles[0]);

        setFiles(formattedFiles);
        console.log('Final files set:', formattedFiles.length, 'files');
    } catch (error) {
      console.error('Error fetching final files:', error);
      toast({
        title: "Error",
        description: "Failed to fetch final files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async (fileId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_complaints')
        .select('*')
        .eq('file_id', fileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast({
        title: "Error",
        description: "Failed to fetch complaints",
        variant: "destructive",
      });
    }
  };

  const handleViewComplaints = (file: FinalFile) => {
    setSelectedFile(file);
    fetchComplaints(file.file_id);
    setShowComplaints(true);
  };

  const downloadFile = async (file: FinalFile) => {
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getComplaintTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'quality_issue': 'Quality Issue',
      'wrong_file': 'Wrong File',
      'incomplete_work': 'Incomplete Work',
      'late_delivery': 'Late Delivery',
      'communication_issue': 'Communication Issue',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      'pending': 'secondary',
      'under_review': 'default',
      'resolved': 'default',
      'rejected': 'destructive'
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

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.designer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'with_complaints' && file.has_complaints) ||
                         (filterStatus === 'no_complaints' && !file.has_complaints);
    
    return matchesSearch && matchesFilter;
  });

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Final Files Management</h1>
          <p className="text-gray-600">View and manage all final files sent to customers by designers</p>
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
                  placeholder="Search by file name, designer, or customer..."
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
                <SelectItem value="all">All Files</SelectItem>
                <SelectItem value="with_complaints">With Complaints</SelectItem>
                <SelectItem value="no_complaints">No Complaints</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Final Files ({filteredFiles.length})
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
                    <TableHead>File Name</TableHead>
                    <TableHead>Designer</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Complaints</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.file_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{file.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {file.designer_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {file.customer_name}
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(file.file_size)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(file.uploaded_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {file.has_complaints ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {file.complaint_count}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            None
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadFile(file)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(file.file_url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {file.has_complaints && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewComplaints(file)}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complaints Dialog */}
      <Dialog open={showComplaints} onOpenChange={setShowComplaints}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Complaints for: {selectedFile?.file_name}
            </DialogTitle>
          </DialogHeader>
          
          {complaints.length > 0 ? (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <Card key={complaint.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{complaint.title}</h4>
                        <p className="text-sm text-gray-600">
                          {getComplaintTypeLabel(complaint.complaint_type)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getStatusBadge(complaint.status)}>
                          {complaint.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getPriorityBadge(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{complaint.description}</p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(complaint.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">No complaints found for this file</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
