import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, File, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface DesignerFileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUploaded: (fileUrl: string, fileName: string) => void;
  onEndSession: () => void;
  sessionId: string;
  designerName: string;
  customerName: string;
  designerId?: string;
  bookingId?: string;
}

export default function DesignerFileUploadDialog({
  isOpen,
  onClose,
  onFileUploaded,
  onEndSession,
  sessionId,
  designerName,
  customerName,
  designerId,
  bookingId
}: DesignerFileUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{name: string, url: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      console.log('🎨 Designer uploading final file:', file.name);
      console.log('📋 Props received:', { sessionId, bookingId, designerId, designerName });

      // Broadcast upload started
      const channel = supabase.channel(`file_upload_${sessionId}`);
      channel.send({
        type: 'broadcast',
        event: 'file_upload_started',
        payload: { fileName: file.name }
      });

      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `final-design-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `session-files/${sessionId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('session-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Broadcast upload progress
      channel.send({
        type: 'broadcast',
        event: 'file_upload_progress',
        payload: { progress: 50 }
      });

      const { data: { publicUrl } } = supabase.storage
        .from('session-files')
        .getPublicUrl(filePath);

      // Resolve the best designer display name
      let resolvedDesignerName = designerName;
      try {
        if (!resolvedDesignerName || resolvedDesignerName.toLowerCase() === 'designer') {
          // Try resolve via designers -> profiles
          if (designerId) {
            const { data: designerRow } = await (supabase as any)
              .from('designers')
              .select('user_id')
              .eq('id', designerId)
              .single();
            if (designerRow?.user_id) {
              const { data: prof } = await (supabase as any)
                .from('profiles')
                .select('first_name, last_name, full_name, email')
                .eq('user_id', designerRow.user_id)
                .maybeSingle();
              if (prof) {
                resolvedDesignerName = prof.full_name || `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || prof.email || designerName;
              }
            }
          }
        }
      } catch (e) {
        console.log('Name resolution skipped:', e);
      }

      // Save file record to database
      console.log('💾 Saving file record to database:', {
        session_id: sessionId,
        booking_id: bookingId,
        name: file.name,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: resolvedDesignerName,
        uploaded_by_type: 'designer',
        uploaded_by_id: designerId,
        file_url: publicUrl,
        status: 'approved'
      });

      // Check if session_files table exists and has the right structure
      console.log('🔍 Checking session_files table structure...');
      const { data: tableInfo, error: tableError } = await (supabase as any)
        .from('session_files')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('❌ session_files table error:', tableError);
      } else {
        console.log('✅ session_files table accessible, sample data:', tableInfo);
      }

      const insertData = {
        session_id: sessionId,
        booking_id: bookingId || null,
        name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        uploaded_by: resolvedDesignerName,
        uploaded_by_type: 'designer',
        uploaded_by_id: designerId || '',
        file_url: publicUrl,
        status: 'approved' // Final design files are automatically approved
      };

      console.log('💾 Attempting to insert file record:', insertData);

      const { data: fileData, error: insertError } = await (supabase as any)
        .from('session_files')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ File record insert failed:', insertError);
        toast({
          title: "File Upload Warning",
          description: "File uploaded but database record failed. Please contact support.",
          variant: "destructive",
        });
      } else {
        console.log('✅ File record saved successfully:', fileData);
      }

      setUploadedFile({ name: file.name, url: publicUrl });

      // Broadcast upload completed
      channel.send({
        type: 'broadcast',
        event: 'file_uploaded',
        payload: {
          fileName: file.name,
          fileUrl: publicUrl
        }
      });

      console.log('✅ File uploaded successfully and broadcast sent');
      
      toast({
        title: "File Uploaded Successfully",
        description: `${file.name} has been uploaded and the customer has been notified.`,
      });

      // Call the callback to notify parent component
      onFileUploaded(publicUrl, file.name);

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setUploadedFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Upload Final Design
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Upload the final design file for {customerName}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!uploadedFile ? (
            <>
              {/* Upload Instructions */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <File className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 mb-1">Final Design File</p>
                    <p className="text-sm text-blue-700">
                      Please upload the completed design file. The customer will be notified immediately once uploaded.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleFileSelect}
                disabled={isUploading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Choose File to Upload
                  </>
                )}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".jpg,.jpeg,.png,.pdf,.ai,.psd,.svg,.zip,.rar"
                className="hidden"
              />
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">File Uploaded Successfully!</p>
                    <p className="text-sm text-green-700 mt-1">
                      {uploadedFile.name} has been uploaded and the customer has been notified.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleClose}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-medium"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Done
                </Button>
                
                <Button
                  onClick={onEndSession}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg font-medium"
                >
                  End Session
                </Button>
              </div>
            </>
          )}

          {/* Cancel button removed - designer must upload file to proceed */}
        </CardContent>
      </Card>
    </div>
  );
}
