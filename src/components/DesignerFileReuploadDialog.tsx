import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Upload, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DesignerFileReuploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  complaintId: string;
  originalFileId: string;
  sessionId: string;
  customerName: string;
  complaintTitle: string;
  complaintDescription: string;
  reuploadCount?: number;
  onFileUploaded: () => void;
}

export default function DesignerFileReuploadDialog({
  isOpen,
  onClose,
  complaintId,
  originalFileId,
  sessionId,
  customerName,
  complaintTitle,
  complaintDescription,
  reuploadCount = 0,
  onFileUploaded
}: DesignerFileReuploadDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'application/zip', 'application/x-rar-compressed'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid image, document, or archive file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // Get designer profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, full_name')
        .eq('user_id', user.id)
        .single();

      const designerName = profile?.full_name || 
        `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 
        'Designer';

      // Upload file to storage (same storage as session_files)
      const fileExt = selectedFile.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileName = `reupload-${reuploadCount + 1}-${timestamp}-${randomId}.${fileExt}`;
      const filePath = `session-files/${sessionId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('session-files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('session-files')
        .getPublicUrl(filePath);

      setUploadProgress(50);

      // Insert file record (same table as session_files)
      const { data: fileData, error: fileError } = await supabase
        .from('session_files')
        .insert({
          session_id: sessionId,
          name: selectedFile.name,
          file_url: publicUrl,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          uploaded_by: designerName,
          uploaded_by_type: 'designer',
          uploaded_by_id: user.id,
          status: 'pending',
          is_reupload: true,
          original_file_id: originalFileId,
          complaint_id: complaintId,
          reupload_number: reuploadCount + 1
        })
        .select()
        .single();

      if (fileError) throw fileError;

      setUploadProgress(75);

      // Use the workflow function to handle status update and notifications
      const { data: workflowResult, error: workflowError } = await (supabase as any).rpc('process_complaint_workflow', {
        p_complaint_id: complaintId,
        p_action: 'designer_upload',
        p_designer_id: user.id,
        p_new_file_id: fileData.id
      });

      if (workflowError) throw workflowError;

      const result = workflowResult as { success: boolean; error?: string };
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to update complaint workflow');
      }

      setUploadProgress(100);

      toast({
        title: "File Uploaded Successfully",
        description: "The corrected file has been uploaded and the customer has been notified to review it.",
      });

      onFileUploaded();
      onClose();
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setNotes('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {reuploadCount > 0 ? `Upload New Version (Attempt ${reuploadCount + 1})` : 'Upload Corrected File'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Complaint Details */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-orange-900">Complaint Details</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Customer:</strong> {customerName}</p>
                <p><strong>Title:</strong> {complaintTitle}</p>
                <p><strong>Description:</strong> {complaintDescription}</p>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Select Corrected File *</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: Images, PDF, Word, Excel, PowerPoint, Text, ZIP, RAR (Max 10MB)
              </p>
            </div>

            {selectedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about the corrections made..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Upload a corrected version of the file that addresses the customer's complaint</li>
              <li>• Ensure the file meets the quality standards and requirements</li>
              <li>• The customer will review your uploaded file and approve or reject it</li>
              <li>• You will be notified of the customer's decision</li>
              {reuploadCount > 0 && (
                <li>• This is attempt {reuploadCount + 1} - please address any previous feedback</li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
