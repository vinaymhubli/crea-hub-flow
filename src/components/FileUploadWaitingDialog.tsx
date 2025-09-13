import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Upload, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadWaitingDialogProps {
  isOpen: boolean;
  designerName: string;
  onFileReady: (fileUrl: string, fileName: string) => void;
  sessionId: string;
}

export default function FileUploadWaitingDialog({
  isOpen,
  designerName,
  onFileReady,
  sessionId
}: FileUploadWaitingDialogProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'waiting' | 'uploading' | 'ready'>('waiting');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    console.log('FileUploadWaitingDialog: isOpen changed to:', isOpen);
    if (!isOpen) {
      setProgress(0);
      setStatus('waiting');
      setFileName('');
      setFileUrl('');
      return;
    }

    // Don't auto-increment progress - wait for actual file upload
    // Progress will be updated when file upload starts and completes
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Listen for file upload events
    const channel = supabase
      .channel(`file_upload_${sessionId}`)
      .on('broadcast', { event: 'file_upload_started' }, (payload) => {
        console.log('📤 File upload started');
        setStatus('uploading');
        setProgress(10);
      })
      .on('broadcast', { event: 'file_upload_progress' }, (payload) => {
        const { progress } = payload.payload;
        console.log('📤 File upload progress:', progress);
        setProgress(progress);
      })
      .on('broadcast', { event: 'file_uploaded' }, (payload) => {
        const { fileName: uploadedFileName, fileUrl: uploadedFileUrl } = payload.payload;
        console.log('📤 File upload completed:', uploadedFileName);
        setFileName(uploadedFileName);
        setFileUrl(uploadedFileUrl);
        setStatus('ready');
        setProgress(100);
        
        // Don't auto-download - let customer click download button manually
        console.log('📥 File ready for manual download:', uploadedFileName);
        
        onFileReady(uploadedFileUrl, uploadedFileName);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, sessionId, onFileReady]);

  const getStatusText = () => {
    switch (status) {
      case 'waiting':
        return 'Waiting for designer to upload file...';
      case 'uploading':
        return 'Designer is uploading your file...';
      case 'ready':
        return 'Your file is ready for download!';
      default:
        return 'Processing...';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'waiting':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'uploading':
        return <Upload className="w-5 h-5 text-blue-600" />;
      case 'ready':
        return <Download className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  console.log('FileUploadWaitingDialog: Rendering dialog with status:', status, 'progress:', progress);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {status === 'ready' ? 'File Ready!' : 'Please Wait'}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {status === 'ready' 
              ? `${designerName} has uploaded your final file.`
              : `${designerName} is preparing your final design file.`
            }
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {getStatusText()}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progress)}%
              </span>
            </div>
            
            <Progress value={progress} className="w-full h-2" />
            
            {status === 'ready' && fileName && (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800 mb-1">File Ready:</p>
                <p className="text-sm text-green-700">{fileName}</p>
              </div>
            )}
          </div>

          {/* Status Messages */}
          <div className="space-y-2 text-sm text-gray-600">
            {status === 'waiting' && (
              <p>• Designer is finalizing your design</p>
            )}
            {status === 'uploading' && (
              <>
                <p>• File is being uploaded securely</p>
                <p>• Processing and preparing for download</p>
              </>
            )}
            {status === 'ready' && (
              <>
                <p>• File has been uploaded successfully</p>
                <p>• Ready for immediate download</p>
              </>
            )}
          </div>

          {status === 'ready' && (
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-800 font-medium">
                Your design file is ready! You can now download it from the session panel.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
