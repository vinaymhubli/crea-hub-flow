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
      
      console.log('🚀 Starting to fetch final files - VERSION 6.0 - ALL SESSIONS CREATED! CACHE BUSTED!');
      
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
      
      // FALLBACK: Try active_sessions first, then session_approval_requests
      const { data: activeSessions, error: sessionsError } = await supabase
        .from('active_sessions')
        .select('session_id, customer_id, designer_id');
      
      const { data: approvalRequests, error: approvalError } = await supabase
        .from('session_approval_requests')
        .select('session_id, customer_id, designer_id');
      
      if (sessionsError) console.error('Error fetching active sessions:', sessionsError);
      if (approvalError) console.error('Error fetching approval requests:', approvalError);
      
      console.log('Active sessions:', activeSessions);
      console.log('Active sessions count:', activeSessions?.length || 0);
      console.log('Approval requests:', approvalRequests);
      console.log('Approval requests count:', approvalRequests?.length || 0);
      
      // DEBUG: Check sample session data
      if (activeSessions && activeSessions.length > 0) {
        console.log('Sample active session:', activeSessions[0]);
      }
      if (approvalRequests && approvalRequests.length > 0) {
        console.log('Sample approval request:', approvalRequests[0]);
      }
      
      // Create a comprehensive map - handle "live_" prefix mismatch
      const sessionToCustomerMap = new Map();
      
      // Add active sessions
      activeSessions?.forEach(session => {
        sessionToCustomerMap.set(session.session_id, {
          customer_id: session.customer_id,
          designer_id: session.designer_id,
          source: 'active_sessions'
        });
        if (session.session_id.startsWith('live_')) {
          const withoutPrefix = session.session_id.replace('live_', '');
          sessionToCustomerMap.set(withoutPrefix, {
            customer_id: session.customer_id,
            designer_id: session.designer_id,
            source: 'active_sessions'
          });
        }
      });
      
      // Add approval requests (fallback for missing active sessions)
      approvalRequests?.forEach(request => {
        if (!sessionToCustomerMap.has(request.session_id)) {
          sessionToCustomerMap.set(request.session_id, {
            customer_id: request.customer_id,
            designer_id: request.designer_id,
            source: 'approval_requests'
          });
        }
        if (request.session_id.startsWith('live_')) {
          const withoutPrefix = request.session_id.replace('live_', '');
          if (!sessionToCustomerMap.has(withoutPrefix)) {
            sessionToCustomerMap.set(withoutPrefix, {
              customer_id: request.customer_id,
              designer_id: request.designer_id,
              source: 'approval_requests'
            });
          }
        }
      });
      
      console.log('Session to customer map:', Array.from(sessionToCustomerMap.entries()));
      console.log('📊 SessionToCustomerMap size:', sessionToCustomerMap.size);
      console.log('🔍 SessionToCustomerMap keys:', Array.from(sessionToCustomerMap.keys()));
      console.log('🔍 First few file session_ids:', allFiles?.slice(0, 5).map(f => f.session_id));
      
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
      
      // DEBUG: Check if files have session_ids
      console.log('Files with session_ids:', directData?.map(f => ({ 
        name: f.name, 
        session_id: f.session_id, 
        has_session_id: !!f.session_id 
      })));

      // Get designer and customer names separately
      const fileIds = directData?.map(f => f.uploaded_by_id) || [];
      const customerIds = directData?.map(f => {
        // Try exact match first
        let sessionData = sessionToCustomerMap.get(f.session_id);
        
        // If no exact match, try with "live_" prefix
        if (!sessionData && !f.session_id.startsWith('live_')) {
          sessionData = sessionToCustomerMap.get(`live_${f.session_id}`);
        }
        
        // If still no match, try without "live_" prefix
        if (!sessionData && f.session_id.startsWith('live_')) {
          sessionData = sessionToCustomerMap.get(f.session_id.replace('live_', ''));
        }
        
        return sessionData?.customer_id;
      }).filter(Boolean) || [];

      console.log('Customer IDs to fetch:', customerIds);
      console.log('Session to customer map entries:', Array.from(sessionToCustomerMap.entries()));
      console.log('Sample file session_ids:', directData?.slice(0, 3).map(f => ({ file: f.name, session_id: f.session_id })));
      
      // Debug: Check if session_ids match
      directData?.slice(0, 3).forEach(file => {
        const sessionData = sessionToCustomerMap.get(file.session_id);
        console.log(`File: ${file.name}, Session ID: ${file.session_id}, Found in map: ${!!sessionData}, Customer ID: ${sessionData?.customer_id}`);
      });

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

      console.log('Fetched customers:', customers);
      console.log('Customer count:', customers?.length || 0);
      
      // DEBUG: Let's also check if there are any customers at all in the database
      const { data: allCustomers } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, full_name, user_type')
        .eq('user_type', 'client')
        .limit(5);
      console.log('All customers in DB:', allCustomers);
      
      // CORRECT APPROACH: session_files.session_id -> active_sessions.session_id (with live_ prefix) -> customer_id -> profiles
      console.log('🎯 CORRECT APPROACH: Using session_id with live_ prefix to find customers...');
      
      // Get ALL customer profiles from database
      const { data: allCustomerProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, full_name, user_type')
        .eq('user_type', 'client');
      
      console.log('All customer profiles from DB:', allCustomerProfiles);
      
      // Create customer lookup map
      const customerLookupMap = new Map();
      allCustomerProfiles?.forEach(customer => {
        customerLookupMap.set(customer.user_id, customer);
      });
      
      console.log('Customer lookup map size:', customerLookupMap.size);
      
      // Get ALL active sessions to map session_id -> customer_id (ADMIN ACCESS)
      const { data: allActiveSessions, error: activeSessionsError } = await supabase
        .from('active_sessions')
        .select('session_id, customer_id, designer_id, status, created_at');
      
      console.log('All active sessions fetched:', allActiveSessions?.length || 0);
      console.log('Active sessions error:', activeSessionsError);
      console.log('All active sessions data:', allActiveSessions);
      
      // TEST: Check if admin function works from frontend
      const { data: adminTest } = await supabase.rpc('is_user_admin');
      console.log('🔍 Admin test from frontend:', adminTest);
      
      // TEST: Try to get ALL sessions without filters
      const { data: allSessionsTest, error: allSessionsError } = await supabase
        .from('active_sessions')
        .select('session_id, customer_id, designer_id');
      
      console.log('🔍 All sessions test:', allSessionsTest?.length || 0, 'sessions found');
      console.log('🔍 All sessions error:', allSessionsError);
      
      if (allSessionsTest && allSessionsTest.length > 1) {
        console.log('✅ ADMIN ACCESS WORKING! Found', allSessionsTest.length, 'sessions');
        // Use the working data
        const workingSessions = allSessionsTest;
        allActiveSessions.length = 0; // Clear the old array
        allActiveSessions.push(...workingSessions); // Add the working data
      } else {
        console.log('❌ Admin access still not working from frontend');
      }
      
      
      // MOST IMPORTANT: Get session_approval_requests - this has ALL historical sessions!
      const { data: allApprovalRequests } = await supabase
        .from('session_approval_requests')
        .select('session_id, customer_id, designer_id');
      
      console.log('All approval requests fetched:', allApprovalRequests?.length || 0);
      console.log('Sample approval request:', allApprovalRequests?.[0]);
      
      // Update the existing sessionToCustomerMap with active sessions
      allActiveSessions?.forEach(session => {
        sessionToCustomerMap.set(session.session_id, {
          customer_id: session.customer_id,
          designer_id: null,
          source: 'active_sessions'
        });
        // Also add without live_ prefix for matching
        if (session.session_id.startsWith('live_')) {
          sessionToCustomerMap.set(session.session_id.replace('live_', ''), {
            customer_id: session.customer_id,
            designer_id: null,
            source: 'active_sessions'
          });
        }
      });
      
      // Add ALL approval requests (this is where the historical data is!)
      allApprovalRequests?.forEach(request => {
        sessionToCustomerMap.set(request.session_id, {
          customer_id: request.customer_id,
          designer_id: request.designer_id,
          source: 'approval_requests'
        });
        // Also add without live_ prefix for matching
        if (request.session_id.startsWith('live_')) {
          sessionToCustomerMap.set(request.session_id.replace('live_', ''), {
            customer_id: request.customer_id,
            designer_id: request.designer_id,
            source: 'approval_requests'
          });
        }
      });
      
      console.log('Updated session to customer map size:', sessionToCustomerMap.size);
      console.log('Sample session mappings:', Array.from(sessionToCustomerMap.entries()).slice(0, 5));
      
      // DEBUG: Print all session IDs we have vs what files need
      console.log('🔍 SESSION IDs WE HAVE:', Array.from(sessionToCustomerMap.keys()));
      console.log('🔍 SESSION IDs FILES NEED:', directData?.slice(0, 10).map(f => f.session_id));
      console.log('🔍 SESSION IDs FILES NEED WITH LIVE PREFIX:', directData?.slice(0, 10).map(f => `live_${f.session_id}`));

        // Use the simple customer lookup map
        const finalCustomers = allCustomerProfiles || [];
        console.log('Using final customers:', finalCustomers);

        // Get complaint counts
        const { data: complaints } = await supabase
          .from('customer_complaints')
          .select('file_id')
          .in('file_id', directData?.map(f => f.id) || []);

        // Create lookup maps
        const designersMap = new Map(designers?.map(d => [d.user_id, d] as [string, any]) || []);
        const customersMap = new Map(finalCustomers?.map(c => [c.user_id, c] as [string, any]) || []);
        const complaintsMap = new Map();
        complaints?.forEach(c => {
          complaintsMap.set(c.file_id, (complaintsMap.get(c.file_id) || 0) + 1);
        });

        // IMPROVED SOLUTION: Link files to customers by session_id
        console.log('Available customers:', customers?.length || 0);
        console.log('Sample customer:', customers?.[0]);
        
        const formattedFiles = directData?.map(file => {
          const designer = designersMap.get(file.uploaded_by_id);
          
          // CORRECT APPROACH: Use session_id to get customer
          let customer = null;
          let customerId = null;
          
          if (file.session_id) {
            // Try exact match first
            let sessionData = sessionToCustomerMap.get(file.session_id);
            
            // If no match, try with live_ prefix (THIS IS THE KEY!)
            if (!sessionData && !file.session_id.startsWith('live_')) {
              sessionData = sessionToCustomerMap.get(`live_${file.session_id}`);
              console.log(`🔍 Trying with live_ prefix: live_${file.session_id}`);
            }
            
            if (sessionData) {
              customerId = sessionData.customer_id;
              customer = customerLookupMap.get(customerId);
              console.log(`✅ Found customer via session ${file.session_id}: ${customerId} -> ${(customer as any)?.first_name} ${(customer as any)?.last_name}`);
            } else {
              console.log(`❌ No customer found for session ${file.session_id} (tried both with and without live_ prefix)`);
            }
          } else {
            console.log(`❌ No session_id for file ${file.name}`);
          }
          
          const complaintCount = complaintsMap.get(file.id) || 0;

          return {
            file_id: file.id,
            session_id: file.session_id,
            booking_id: file.booking_id,
            file_name: file.name || 'Unknown File',
            file_url: file.file_url,
            file_size: file.file_size || 0,
            designer_id: file.uploaded_by_id,
            designer_name: (designer as any)?.full_name || 
                          `${(designer as any)?.first_name || ''} ${(designer as any)?.last_name || ''}`.trim() || 
                          (designer as any)?.email || 'Unknown Designer',
            customer_id: customerId || null,
            customer_name: (customer as any)?.full_name || 
                          `${(customer as any)?.first_name || ''} ${(customer as any)?.last_name || ''}`.trim() || 
                          (customer as any)?.email || 'No Customer Found',
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
