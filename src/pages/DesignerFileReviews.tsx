import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDesignerProfile } from '@/hooks/useDesignerProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DesignerSidebar } from '@/components/DesignerSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Eye,
  FileText,
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';

interface SessionFile {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_by: string;
  uploaded_by_type: 'designer' | 'customer';
  uploaded_by_id: string;
  session_id: string;
  booking_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  reviewed_at: string | null;
  reviewed_by_id: string | null;
  review_notes: string | null;
  created_at: string;
}

export default function DesignerFileReviews() {
  const { user } = useAuth();
  const { designerProfile } = useDesignerProfile();
  const { toast } = useToast();
  const [files, setFiles] = useState<SessionFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (designerProfile?.id) {
      loadFiles();
    }
  }, [designerProfile]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      
      // Get all files from sessions where this designer is involved
      // This includes both booking sessions and live sessions
      const { data, error } = await supabase
        .from('session_files')
        .select(`
          id,
          name,
          file_type,
          file_size,
          file_url,
          uploaded_by,
          uploaded_by_type,
          uploaded_by_id,
          session_id,
          booking_id,
          status,
          reviewed_at,
          reviewed_by_id,
          review_notes,
          created_at,
          bookings!inner(designer_id)
        `)
        .eq('bookings.designer_id', designerProfile?.id)
        .order('created_at', { ascending: false });

      // For now, let's get all session files and filter them properly
      // Get all files from live sessions where this designer was involved
      const { data: allSessionFiles, error: sessionError } = await (supabase as any)
        .from('session_files')
        .select(`
          id,
          name,
          file_type,
          file_size,
          file_url,
          uploaded_by,
          uploaded_by_type,
          uploaded_by_id,
          session_id,
          booking_id,
          status,
          reviewed_at,
          reviewed_by_id,
          review_notes,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error || sessionError) throw error || sessionError;

      // Get designer's active sessions to filter relevant files
      const { data: designerSessions } = await (supabase as any)
        .from('active_sessions')
        .select('session_id')
        .eq('designer_id', designerProfile?.id);

      const designerSessionIds = (designerSessions || []).map(s => s.session_id);

      // Combine booking files and live session files
      const allFiles = [...(data || [])];
      
      // Add live session files where this designer was involved
      if (allSessionFiles) {
        const liveSessionFiles = allSessionFiles.filter(file => 
          (!file.booking_id && designerSessionIds.includes(file.session_id))
        );
        allFiles.push(...liveSessionFiles);
      }
      
      // Remove duplicates and sort by created_at
      const uniqueFiles = Array.from(
        new Map(allFiles.map(file => [file.id, file])).values()
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setFiles(uniqueFiles as any);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-300"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'revision_requested':
        return <Badge variant="outline" className="text-orange-600 border-orange-300"><AlertCircle className="w-3 h-3 mr-1" />Revision Requested</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filterFilesByStatus = (status: string) => {
    if (status === 'all') return files;
    return files.filter(file => file.status === status);
  };

  const downloadFile = async (file: SessionFile) => {
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
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

  const renderFileCard = (file: SessionFile) => (
    <Card key={file.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">{file.name}</CardTitle>
              <CardDescription className="text-sm">
                {file.file_type} • {formatFileSize(file.file_size)}
              </CardDescription>
              <div className="flex items-center space-x-2 mt-1">
                <User className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {file.uploaded_by_type === 'customer' ? 'From client' : 'From you'}
                </span>
                <span className="text-xs text-gray-300">•</span>
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {format(new Date(file.created_at), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge(file.status)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {file.review_notes && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-700">
              <strong>Review notes:</strong> {file.review_notes}
            </p>
            {file.reviewed_at && (
              <p className="text-xs text-gray-500 mt-1">
                Reviewed on {format(new Date(file.reviewed_at), 'MMM dd, yyyy at HH:mm')}
              </p>
            )}
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadFile(file)}
            className="flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(file.file_url, '_blank')}
            className="flex items-center space-x-1"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const pendingFiles = filterFilesByStatus('pending');
  const approvedFiles = filterFilesByStatus('approved');
  const rejectedFiles = filterFilesByStatus('rejected');
  const revisionFiles = filterFilesByStatus('revision_requested');

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
          <DesignerSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading files...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 px-4 sm:px-6 py-4 sm:py-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-6">
                <SidebarTrigger className="text-white hover:bg-white/20 rounded-lg p-2 flex-shrink-0" />
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/30 shadow-xl flex-shrink-0">
                    <FileCheck className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">File Reviews</h1>
                    <p className="text-white/90 text-xs sm:text-sm lg:text-lg truncate hidden sm:block">Manage client files and review status</p>
                    <div className="flex items-center space-x-2 sm:space-x-4 mt-1 sm:mt-2 text-xs sm:text-sm">
                      <span className="text-white/90 font-medium">
                        {pendingFiles.length} Pending Review
                      </span>
                      <span className="text-white/60">•</span>
                      <span className="text-white/90 font-medium">
                        {files.length} Total Files
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="pending" className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Pending ({pendingFiles.length})</span>
                </TabsTrigger>
                <TabsTrigger value="approved" className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Approved ({approvedFiles.length})</span>
                </TabsTrigger>
                <TabsTrigger value="rejected" className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4" />
                  <span>Rejected ({rejectedFiles.length})</span>
                </TabsTrigger>
                <TabsTrigger value="revision_requested" className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Revisions ({revisionFiles.length})</span>
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>All ({files.length})</span>
                </TabsTrigger>
              </TabsList> */}
              
            {/* Simple file list without tabs for now */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">All Files ({files.length})</h3>
              <ScrollArea className="h-[600px]">
                {files.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
                    <p className="text-gray-500">Files from live sessions will appear here.</p>
                  </div>
                ) : (
                  files.map(renderFileCard)
                )}
              </ScrollArea>
            </div>

              {/* <TabsContent value="pending" className="mt-6">
                <ScrollArea className="h-[600px]">
                  {pendingFiles.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No pending files</h3>
                      <p className="text-gray-500">All files have been reviewed.</p>
                    </div>
                  ) : (
                    pendingFiles.map(renderFileCard)
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                <ScrollArea className="h-[600px]">
                  {approvedFiles.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No approved files</h3>
                      <p className="text-gray-500">No files have been approved yet.</p>
                    </div>
                  ) : (
                    approvedFiles.map(renderFileCard)
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                <ScrollArea className="h-[600px]">
                  {rejectedFiles.length === 0 ? (
                    <div className="text-center py-12">
                      <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No rejected files</h3>
                      <p className="text-gray-500">No files have been rejected.</p>
                    </div>
                  ) : (
                    rejectedFiles.map(renderFileCard)
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="revision_requested" className="mt-6">
                <ScrollArea className="h-[600px]">
                  {revisionFiles.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No revision requests</h3>
                      <p className="text-gray-500">No files need revisions.</p>
                    </div>
                  ) : (
                    revisionFiles.map(renderFileCard)
                  )}
                </ScrollArea>
              </TabsContent>

            {/* </Tabs> */}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
