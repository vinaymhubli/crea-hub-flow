import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  User, 
  Star,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CustomerSidebar } from '@/components/CustomerSidebar';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface SessionFile {
  id: string;
  session_id: string;
  name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_by: string;
  uploaded_by_type: 'designer' | 'customer';
  uploaded_by_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  designer_name?: string;
  designer_rating?: number;
  session_date?: string;
  total_amount?: number;
}

export default function CustomerFiles() {
  const { user } = useAuth();
  const [files, setFiles] = useState<SessionFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    if (user?.id) {
      loadFiles();
    }
  }, [user?.id]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading files for customer:', user?.id);
      
      // First get session approval requests for this customer
      const { data: approvalRequests, error: approvalError } = await (supabase as any)
        .from('session_approval_requests')
        .select('session_id, designer_id, total_amount, created_at, status')
        .eq('customer_id', user?.id);
        // Remove the status filter to see all approval requests

      if (approvalError) {
        console.error('❌ Error loading approval requests:', approvalError);
        toast.error('Failed to load session data. Please check console for details.');
        return;
      }

      if (!approvalRequests || approvalRequests.length === 0) {
        console.log('No approval requests found for customer:', user?.id);
        setFiles([]);
        setLoading(false);
        return;
      }

      console.log('Found approval requests:', approvalRequests.length);
      console.log('Approval request details:', approvalRequests);

      // Get session files for this customer - fetch files from active_sessions where customer_id matches
      const { data: customerSessions, error: sessionsError } = await (supabase as any)
        .from('active_sessions')
        .select('session_id, designer_id, booking_id')
        .eq('customer_id', user?.id);
      
      if (sessionsError) {
        console.error('❌ Error loading customer sessions:', sessionsError);
        return;
      }
      
      console.log('🔍 Customer sessions:', customerSessions);
      
      // Get session files for these sessions
      const sessionIds = customerSessions?.map(session => session.session_id) || [];
      console.log('🔍 Session IDs from active_sessions:', sessionIds);
      
      // Remove "live_" prefix from session IDs to match how files are saved
      const sessionIdsWithoutPrefix = sessionIds.map(id => id.replace('live_', ''));
      console.log('🔍 Session IDs without prefix:', sessionIdsWithoutPrefix);
      
      const { data: sessionFiles, error: filesError } = await (supabase as any)
        .from('session_files')
        .select('*')
        .in('session_id', sessionIdsWithoutPrefix)
        .order('created_at', { ascending: false });

      if (filesError) {
        console.error('Error loading files:', filesError);
        return;
      }

      console.log('Found session files:', sessionFiles?.length || 0);
      console.log('Session files details:', sessionFiles);
      console.log('Session IDs being searched:', sessionIds);
      
      // Show what uploaded_by_type and status the files actually have
      if (sessionFiles && sessionFiles.length > 0) {
        console.log('🔍 File details:');
        sessionFiles.forEach((file, index) => {
          console.log(`File ${index + 1}:`, {
            name: file.name,
            uploaded_by_type: file.uploaded_by_type,
            status: file.status,
            session_id: file.session_id
          });
        });
      }

      // DEBUG: Check ALL session files in database
      const { data: allSessionFiles, error: allFilesError } = await (supabase as any)
        .from('session_files')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!allFilesError) {
        console.log('🔍 ALL session files in database:', allSessionFiles?.length || 0);
        console.log('🔍 ALL session files details:', allSessionFiles);
        
        // Show session IDs from files vs approval requests
        const fileSessionIds = allSessionFiles?.map(f => f.session_id) || [];
        console.log('🔍 Session IDs in FILES:', fileSessionIds);
        console.log('🔍 Session IDs in APPROVAL REQUESTS:', sessionIds);
        
        // Find matching session IDs
        const matchingIds = sessionIds.filter(id => fileSessionIds.includes(id));
        console.log('🔍 MATCHING session IDs:', matchingIds);
      } else {
        console.error('❌ Error loading all session files:', allFilesError);
      }

      // Combine files with session data
      const filesWithDetails = await Promise.all(
        (sessionFiles || []).map(async (file: any) => {
          try {
            // Find matching customer session - remove "live_" prefix from session.session_id for comparison
            const customerSession = customerSessions?.find(session => 
              session.session_id.replace('live_', '') === file.session_id
            );

            if (!customerSession) {
              console.warn('No customer session found for file:', file.session_id);
              return null;
            }

            // Get designer name from profiles table using designer_id
            console.log('🔍 NEW CODE - Looking for designer profile with user_id:', customerSession.designer_id);
            
            let designerName = 'Unknown Designer';
            try {
              const { data: designerProfile, error: profileError } = await (supabase as any)
                .from('profiles')
                .select('first_name, last_name')
                .eq('user_id', customerSession.designer_id)
                .maybeSingle(); // Use maybeSingle instead of single to avoid errors
              
              if (designerProfile && !profileError) {
                designerName = `${designerProfile.first_name || ''} ${designerProfile.last_name || ''}`.trim();
                if (!designerName) designerName = 'Unknown Designer';
              }
              console.log('🔍 Designer profile result:', designerProfile, 'Error:', profileError);
            } catch (error) {
              console.error('🔍 Error fetching designer profile:', error);
            }

            // Get designer rating
            const { data: designerData } = await (supabase as any)
              .from('designers')
              .select('average_rating')
              .eq('user_id', customerSession.designer_id)
              .single();
            
            console.log('🔍 NEW CODE - Final designer name:', designerName);
            
            return {
              ...file,
              designer_name: designerName,
              designer_rating: designerData?.average_rating || 0,
              session_date: file.created_at,
              total_amount: 0 // We'll get this from approval requests if needed
            };
          } catch (error) {
            console.error('Error getting designer details:', error);
            const customerSession = customerSessions?.find(session => session.session_id === file.session_id);
            return {
              ...file,
              designer_name: 'Unknown Designer',
              designer_rating: 0,
              session_date: file.created_at,
              total_amount: 0
            };
          }
        })
      );

      // Filter out null values
      const validFiles = filesWithDetails.filter(file => file !== null);

      setFiles(validFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: SessionFile) => {
    try {
      // Create download link for background download
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.name;
      link.target = '_blank'; // Ensure download happens in background
      link.style.display = 'none'; // Hide the link element
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${file.name}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.designer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || file.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'designer':
        return (a.designer_name || '').localeCompare(b.designer_name || '');
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex h-screen bg-gray-50">
          <CustomerSidebar />
          <div className="flex-1 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <SidebarTrigger />
                  <h1 className="text-2xl font-bold text-gray-900">My Files</h1>
                </div>
              </div>
            </header>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your files...</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        <CustomerSidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-gray-900">My Files</h1>
                <Badge variant="secondary">{files.length} files</Badge>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {/* Filters and Search */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Design Files
                  </CardTitle>
                  <CardDescription>
                    All final design files from your completed sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search files or designers..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full sm:w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Files</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="name">File Name</SelectItem>
                        <SelectItem value="designer">Designer Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Files Grid */}
              {sortedFiles.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Files Found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'No files match your current filters.' 
                        : 'You haven\'t received any design files yet.'}
                    </p>
                    {searchTerm || filterStatus !== 'all' ? (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSearchTerm('');
                          setFilterStatus('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedFiles.map((file) => (
                    <Card key={file.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate" title={file.name}>
                              {file.name}
                            </CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <User className="w-4 h-4 mr-1" />
                              {file.designer_name}
                              {file.designer_rating > 0 && (
                                <div className="flex items-center ml-2">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-sm text-gray-600 ml-1">
                                    {file.designer_rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </CardDescription>
                          </div>
                          {getStatusBadge(file.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(file.session_date || file.created_at)}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <FileText className="w-4 h-4 mr-2" />
                            {file.file_type} • {formatFileSize(file.file_size)}
                          </div>

                          {file.total_amount && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium">Amount Paid: ${file.total_amount.toFixed(2)}</span>
                            </div>
                          )}

                          <div className="flex space-x-2 pt-2">
                            <Button
                              onClick={() => handleDownload(file)}
                              className="flex-1"
                              size="sm"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(file.file_url, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </SidebarProvider>
  );
}
