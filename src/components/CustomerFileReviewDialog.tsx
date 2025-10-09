import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  Download, 
  Eye,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomerFileReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  complaintId: string;
  newFileId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  designerName: string;
  complaintTitle: string;
  originalDescription: string;
  reuploadCount?: number;
  onReviewComplete: () => void;
}

export default function CustomerFileReviewDialog({
  isOpen,
  onClose,
  complaintId,
  newFileId,
  fileName,
  fileUrl,
  fileType,
  fileSize,
  uploadedAt,
  designerName,
  complaintTitle,
  originalDescription,
  reuploadCount = 0,
  onReviewComplete
}: CustomerFileReviewDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);

  const handleDownload = () => {
    window.open(fileUrl, '_blank');
  };

  const handlePreview = () => {
    window.open(fileUrl, '_blank');
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!reviewNotes.trim() && action === 'reject') {
      toast({
        title: "Notes Required",
        description: "Please provide notes explaining why you're rejecting the file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // Update complaint status
      const newStatus = action === 'approve' ? 'customer_approved' : 'customer_rejected';
      
      const { error: complaintError } = await supabase
        .from('customer_complaints')
        .update({
          status: newStatus,
          customer_review_notes: reviewNotes,
          customer_reviewed_at: new Date().toISOString(),
          customer_reviewed_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', complaintId);

      if (complaintError) throw complaintError;

      // Send notification to designer
      const notificationType = action === 'approve' ? 'file_approved' : 'file_rejected';
      const notificationTitle = action === 'approve' ? 'File Approved' : 'File Rejected';
      const notificationMessage = action === 'approve' 
        ? 'The customer has approved your corrected file. The complaint is now resolved.'
        : 'The customer has rejected your corrected file. Please upload another version.';

      // Get designer ID from complaint
      const { data: complaint } = await supabase
        .from('customer_complaints')
        .select('designer_id')
        .eq('id', complaintId)
        .single();

      if (complaint?.designer_id) {
        await supabase.rpc('send_notification', {
          p_user_id: complaint.designer_id,
          p_type: notificationType,
          p_title: notificationTitle,
          p_message: notificationMessage,
          p_action_url: '/designer/complaints',
          p_metadata: { 
            complaint_id: complaintId, 
            new_file_id: newFileId,
            customer_notes: reviewNotes
          }
        });
      }

      toast({
        title: action === 'approve' ? "File Approved" : "File Rejected",
        description: action === 'approve' 
          ? "The file has been approved and the complaint is resolved."
          : "The file has been rejected. The designer will be notified to upload another version.",
      });

      onReviewComplete();
      onClose();
      
    } catch (error) {
      console.error('Error reviewing file:', error);
      toast({
        title: "Review Failed",
        description: "Failed to submit your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReviewNotes('');
    setDecision(null);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📁';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {reuploadCount > 0 ? `Review New Version (Attempt ${reuploadCount + 1})` : 'Review Corrected File'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Complaint Context */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-blue-900">Original Complaint</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Title:</strong> {complaintTitle}</p>
                <p><strong>Description:</strong> {originalDescription}</p>
                <p><strong>Designer:</strong> {designerName}</p>
              </div>
            </CardContent>
          </Card>

          {/* New File Details */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-green-900">Corrected File</h4>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getFileIcon(fileType)}</div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{fileName}</h5>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{formatFileSize(fileSize)}</span>
                      <span>•</span>
                      <span>{new Date(uploadedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreview}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="review_notes">
                Review Notes {decision === 'reject' && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="review_notes"
                placeholder={
                  decision === 'approve' 
                    ? "Optional: Add any notes about the corrected file..."
                    : "Please explain why you're rejecting this file..."
                }
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>

            {/* Decision Buttons */}
            <div className="flex gap-3">
              <Button
                variant={decision === 'approve' ? 'default' : 'outline'}
                onClick={() => setDecision('approve')}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve File
              </Button>
              <Button
                variant={decision === 'reject' ? 'destructive' : 'outline'}
                onClick={() => setDecision('reject')}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject File
              </Button>
            </div>

            {decision && (
              <div className={`p-3 rounded-lg border ${
                decision === 'approve' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {decision === 'approve' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    decision === 'approve' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {decision === 'approve' 
                      ? 'You are about to approve this file. The complaint will be resolved.'
                      : 'You are about to reject this file. The designer will be asked to upload another version.'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Review Guidelines
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Carefully review the corrected file to ensure it addresses your original complaint</li>
              <li>• Check that the quality meets your expectations</li>
              <li>• If you approve, the complaint will be resolved and the designer will be notified</li>
              <li>• If you reject, provide clear feedback so the designer can make better corrections</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            {decision && (
              <Button 
                onClick={() => handleReview(decision)} 
                disabled={loading || (decision === 'reject' && !reviewNotes.trim())}
                className={
                  decision === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    {decision === 'approve' ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    {decision === 'approve' ? 'Approve' : 'Reject'} File
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
