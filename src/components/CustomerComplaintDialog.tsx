import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomerComplaintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  sessionId: string;
  bookingId?: string | null;
  designerId: string;
  designerName: string;
  fileName: string;
}

export default function CustomerComplaintDialog({
  isOpen,
  onClose,
  fileId,
  sessionId,
  bookingId,
  designerId,
  designerName,
  fileName
}: CustomerComplaintDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState({
    title: '',
    description: '',
    complaint_type: '',
    priority: 'medium'
  });

  const complaintTypes = [
    { value: 'quality_issue', label: 'Quality Issue' },
    { value: 'wrong_file', label: 'Wrong File' },
    { value: 'incomplete_work', label: 'Incomplete Work' },
    { value: 'late_delivery', label: 'Late Delivery' },
    { value: 'communication_issue', label: 'Communication Issue' },
    { value: 'other', label: 'Other' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const handleSubmit = async () => {
    console.log('🔍 Complaint submission data:', {
      fileId,
      designerId,
      sessionId,
      bookingId,
      designerName,
      fileName,
      complaint
    });

    if (!complaint.title || !complaint.description || !complaint.complaint_type) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate required IDs
    if (!fileId || !designerId || !sessionId) {
      console.error('Missing required IDs:', { fileId, designerId, sessionId });
      toast({
        title: "Missing File Information",
        description: "Unable to identify the file or designer. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // Create complaint
      const payload = {
        session_id: sessionId,
        booking_id: bookingId ?? null,
        customer_id: user.id,
        designer_id: designerId,
        file_id: fileId,
        title: complaint.title,
        description: complaint.description,
        complaint_type: complaint.complaint_type,
        priority: complaint.priority,
        status: 'pending'
      } as const;

      console.log('📝 Insert payload (customer_complaints):', payload);

      const { data: complaintData, error } = await supabase
        .from('customer_complaints')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Complaint insert error:', error);
        throw error;
      }

      // Send notifications to designer and admin
      await supabase.rpc('send_notification', {
        p_user_id: designerId,
        p_type: 'complaint_received',
        p_title: 'Customer Complaint Received',
        p_message: `A customer has filed a complaint about your file "${fileName}". Please review the details.`,
        p_action_url: `/designer/complaints`,
        p_metadata: { complaint_id: complaintData.id, file_id: fileId, customer_id: user.id }
      });

      // Notify all admins
      const { data: admins } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('is_admin', true);

      if (admins) {
        for (const admin of admins) {
          await supabase.rpc('send_notification', {
            p_user_id: admin.user_id,
            p_type: 'complaint_received',
            p_title: 'New Customer Complaint',
            p_message: `A new complaint has been filed about file "${fileName}". Please review and take action.`,
            p_action_url: `/admin/complaints`,
            p_metadata: { complaint_id: complaintData.id, file_id: fileId, customer_id: user.id, designer_id: designerId }
          });
        }
      }

      toast({
        title: "Complaint Submitted",
        description: "Your complaint has been submitted and the designer and admin team have been notified.",
      });

      // Reset form
      setComplaint({
        title: '',
        description: '',
        complaint_type: '',
        priority: 'medium'
      });

      onClose();
    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      
      let errorMessage = "Failed to submit complaint. Please try again.";
      
      if (error?.message) {
        if (error.message.includes('customer_complaints')) {
          errorMessage = "Database table not found. Please contact support.";
        } else if (error.message.includes('permission')) {
          errorMessage = "Permission denied. Please check your access.";
        } else if (error.message.includes('constraint')) {
          errorMessage = "Invalid data provided. Please check your inputs.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setComplaint({
      title: '',
      description: '',
      complaint_type: '',
      priority: 'medium'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Submit Complaint
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Information */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">File Details</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>File:</strong> {fileName}</p>
                <p><strong>Designer:</strong> {designerName}</p>
                <p><strong>Session ID:</strong> {sessionId}</p>
              </div>
            </CardContent>
          </Card>

          {/* Complaint Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Complaint Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={complaint.title}
                onChange={(e) => setComplaint(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="type">Complaint Type *</Label>
              <Select 
                value={complaint.complaint_type} 
                onValueChange={(value) => setComplaint(prev => ({ ...prev, complaint_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select complaint type" />
                </SelectTrigger>
                <SelectContent>
                  {complaintTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority Level</Label>
              <Select 
                value={complaint.priority} 
                onValueChange={(value) => setComplaint(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityLevels.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about the issue. Include specific problems, what you expected, and any relevant context."
                value={complaint.description}
                onChange={(e) => setComplaint(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          {/* Guidelines */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Complaint Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Be specific about the issues you encountered</li>
                <li>• Provide clear examples of what went wrong</li>
                <li>• Include any relevant context or requirements</li>
                <li>• Our admin team will review and respond within 24 hours</li>
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Submit Complaint
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
