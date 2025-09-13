import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Edit, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SessionSidePanelProps {
    sessionId: string;
  designerName: string;
  customerName: string;
  isDesigner: boolean;
  duration: number;
  rate: number;
  balance: number;
  onPauseSession: () => void;
  onResumeSession: () => void;
  isPaused: boolean;
  bookingId?: string;
  userId?: string;
  onRateChange?: (newRate: number) => void;
  onMultiplierChange?: (newMultiplier: number) => void;
  formatMultiplier?: number;
  defaultTab?: string;
  mobileMode?: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  sender_type: 'designer' | 'customer';
  sender_id: string;
  sender_name: string;
  created_at: string;
}

interface FileItem {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_by: string;
  uploaded_by_type: 'designer' | 'customer';
  uploaded_by_id: string;
  created_at: string;
  session_id: string;
  status?: 'pending' | 'approved' | 'rejected';
  work_status?: 'pending' | 'in_review' | 'approved' | 'rejected';
  work_type?: 'file' | 'work';
  work_description?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
}

interface WorkReview {
  id: string;
  session_id: string;
  work_file_id: string;
  reviewer_id: string;
  reviewer_type: 'designer' | 'customer';
  review_status: 'pending' | 'approved' | 'rejected';
  review_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceMessage {
  id: string;
  session_id: string;
  invoice_id: string;
  message_id: string;
  created_at: string;
}

export default function SessionSidePanel({
  sessionId,
  designerName,
  customerName,
  isDesigner,
  duration,
  rate,
  balance,
  onPauseSession,
  onResumeSession,
  isPaused,
  bookingId,
  userId = '',
  onRateChange,
  onMultiplierChange,
  formatMultiplier = 1,
  defaultTab = 'billing',
  mobileMode = false
}: SessionSidePanelProps) {
  
    // SessionSidePanel rendered
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [workReviews, setWorkReviews] = useState<WorkReview[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [isEditingMultiplier, setIsEditingMultiplier] = useState(false);
  const [newRate, setNewRate] = useState(rate);
  const [newMultiplier, setNewMultiplier] = useState(formatMultiplier);
  const [reviewingFile, setReviewingFile] = useState<FileItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const pauseSession = async () => {
    if (!isDesigner) return;
    try {
      await supabase.channel(`session_control_${sessionId}`).send({ type: 'broadcast', event: 'session_pause', payload: {} });
      onPauseSession();
    } catch {}
  };

  const resumeSession = async () => {
    if (!isDesigner) return;
    try {
      await supabase.channel(`session_control_${sessionId}`).send({ type: 'broadcast', event: 'session_resume', payload: {} });
      onResumeSession();
    } catch {}
  };

  // Load initial data and set up real-time subscriptions
  useEffect(() => {
    loadMessages();
    loadFiles();
    loadWorkReviews();
    loadInvoices();

    // Set up real-time subscriptions
    const messagesSubscription = supabase
      .channel(`session_messages_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMessage = payload.new as {
            id: string;
            content: string;
            sender_id: string;
            sender_type?: string;
            sender_name?: string;
            created_at: string;
          };
          console.log('Real-time message received:', newMessage);
          
          // Transform the message to match our interface
          const transformedMessage: ChatMessage = {
            id: newMessage.id,
            content: newMessage.content,
            sender_type: (newMessage.sender_type as 'designer' | 'customer') || (newMessage.sender_id === userId ? (isDesigner ? 'designer' : 'customer') : (isDesigner ? 'customer' : 'designer')),
            sender_id: newMessage.sender_id,
            sender_name: newMessage.sender_name || (newMessage.sender_id === userId ? (isDesigner ? designerName : customerName) : (isDesigner ? customerName : designerName)),
            created_at: newMessage.created_at
          };
          
          // Check if message is not already in the list to avoid duplicates
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === transformedMessage.id);
            if (!exists) {
              console.log('Adding new message to list. Total messages before:', prev.length);
              return [...prev, transformedMessage];
            }
            console.log('Message already exists, skipping');
            return prev;
          });
        }
      )
      .on('broadcast', { event: 'session_pause' }, (payload) => {
        onPauseSession();
      })
      .on('broadcast', { event: 'session_resume' }, (payload) => {
        onResumeSession();
      })
      .on('broadcast', { event: 'pricing_change' }, (payload) => {
        console.log('Pricing changed to:', payload.newRate);
        setNewRate(payload.newRate);
        onRateChange?.(payload.newRate);
      })
      .on('broadcast', { event: 'multiplier_change' }, (payload) => {
        setNewMultiplier(payload.newMultiplier);
        onMultiplierChange?.(payload.newMultiplier);
        console.log('Multiplier changed to:', payload.newMultiplier);
      })
      .subscribe((status) => {
        console.log('Messages subscription status:', status);
      });

    const filesSubscription = supabase
      .channel(`session_files_${sessionId}`)
      .subscribe((status) => {
        console.log('Files subscription status:', status);
      });

    return () => {
      messagesSubscription.unsubscribe();
      filesSubscription.unsubscribe();
    };
  }, [sessionId, onPauseSession, onResumeSession, onMultiplierChange, userId, isDesigner, designerName, customerName]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMessages = async () => {
    try {
      console.log('Loading messages for session:', sessionId);
      const { data, error } = await (supabase as any)
        .from('session_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('Loaded messages:', data);
      
      // Transform the data to match our ChatMessage interface
      const transformedMessages: ChatMessage[] = (data || []).map((msg: {
        id: string;
        content: string;
        sender_id: string;
        sender_type?: string;
        sender_name?: string;
        created_at: string;
      }) => ({
        id: msg.id,
        content: msg.content,
        sender_type: (msg.sender_type as 'designer' | 'customer') || (msg.sender_id === userId ? (isDesigner ? 'designer' : 'customer') : (isDesigner ? 'customer' : 'designer')),
        sender_id: msg.sender_id,
        sender_name: msg.sender_name || (msg.sender_id === userId ? (isDesigner ? designerName : customerName) : (isDesigner ? customerName : designerName)),
        created_at: msg.created_at
      }));
      
      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const loadFiles = async () => {
    try {
      console.log('Loading files for session:', sessionId);
      const { data, error } = await (supabase as any)
        .from('session_files')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Loaded files:', data);
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    }
  };

  const loadWorkReviews = async () => {
    try {
      console.log('Loading work reviews for session:', sessionId);
      const { data, error } = await supabase
        .from('session_work_reviews')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Loaded work reviews:', data);
      setWorkReviews((data as any) || []);
    } catch (error) {
      console.error('Error loading work reviews:', error);
      setWorkReviews([]);
    }
  };

  const loadInvoices = async () => {
    try {
      console.log('Loading invoices for session:', sessionId);
      const { data, error } = await supabase
        .from('session_invoices')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Loaded invoices:', data);
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    try {
      // Get current user profile for sender name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', userId)
        .single();

      const senderName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'User';

      const messageData = {
        session_id: sessionId,
        booking_id: bookingId || null,
        content: newMessage.trim(),
        sender_type: isDesigner ? 'designer' : 'customer',
        sender_name: senderName,
        sender_id: userId
      };

      console.log('Sending session message:', messageData);

      const { data, error } = await (supabase as any)
        .from('session_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      console.log('Message sent successfully:', data);

      // Don't add to local state here - let real-time subscription handle it
      setNewMessage('');
      
      toast({
        title: "Message sent",
        description: "Your message has been sent",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `session-files/${sessionId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('session-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('session-files')
        .getPublicUrl(filePath);

      // Determine file status based on who uploads:
      // - Customer files: approved (go directly to designer, no review needed)
      // - Designer files: pending (need customer approval)
      const fileStatus = isDesigner ? 'pending' : 'approved';
      
      const { data: fileData, error: insertError } = await (supabase as any)
        .from('session_files')
        .insert({
          session_id: sessionId,
          booking_id: bookingId,
          name: file.name,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          uploaded_by: isDesigner ? designerName : customerName,
          uploaded_by_type: isDesigner ? 'designer' : 'customer',
          uploaded_by_id: userId,
          file_url: publicUrl,
          status: fileStatus,
          work_description: isDesigner ? 'Designer work for review' : 'Customer reference material'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Don't add to local state here - let real-time subscription handle it
      // This prevents duplicates and ensures consistency

      // If this is a designer uploading a final file, broadcast to customer
      if (isDesigner && fileStatus === 'pending') {
        const channel = supabase.channel(`file_upload_${sessionId}`);
        channel.send({
          type: 'broadcast',
          event: 'file_uploaded',
          payload: {
            fileName: file.name,
            fileUrl: publicUrl
          }
        });
      }

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadFile = async (file: FileItem) => {
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

  const downloadInvoice = async (invoice: any) => {
    try {
      // Generate HTML invoice
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice #${invoice.id.slice(-8)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 30px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .total-section { text-align: right; margin-top: 20px; }
            .total-line { margin: 5px 0; }
            .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <p>Invoice #${invoice.id.slice(-8)}</p>
            <p>Date: ${new Date(invoice.invoice_date).toLocaleDateString()}</p>
          </div>
          
          <div class="invoice-details">
            <p><strong>Designer:</strong> ${invoice.designer_name}</p>
            <p><strong>Customer:</strong> ${invoice.customer_name}</p>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Duration</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Design Session</td>
                <td>${invoice.duration_minutes} minutes</td>
                <td>$${invoice.rate_per_minute}/min</td>
                <td>$${invoice.subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-line">Subtotal: $${invoice.subtotal.toFixed(2)}</div>
            <div class="total-line">GST (18%): $${invoice.gst_amount.toFixed(2)}</div>
            <div class="total-line grand-total">Total: $${invoice.total_amount.toFixed(2)}</div>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([invoiceHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.id.slice(-8)}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Error",
        description: "Failed to download invoice",
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

  const submitWorkForReview = async (file: FileItem) => {
    if (!workDescription.trim()) {
      toast({
        title: "Work description required",
        description: "Please provide a description of the work",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update file as work submission
      const { error: fileError } = await (supabase as any)
        .from('session_files')
        .update({
          work_type: 'work',
          work_description: workDescription,
          work_status: 'in_review'
        })
        .eq('id', file.id);

      if (fileError) throw fileError;

      // Get the reviewer ID (the other party in the session)
      let reviewerId = null;
      if (bookingId) {
        // For booking sessions, get the other user from booking
        const { data: booking } = await supabase
          .from('bookings')
          .select('customer_id, designers(user_id)')
          .eq('id', bookingId)
          .single();
        
        if (booking) {
          reviewerId = isDesigner ? booking.customer_id : booking.designers?.user_id;
        }
      } else {
        // For live sessions, get the other user from active_sessions
        const { data: session } = await (supabase as any)
          .from('active_sessions')
          .select('customer_id, designers(user_id)')
          .eq('session_id', sessionId)
          .single();
        
        if (session) {
          reviewerId = isDesigner ? session.customer_id : session.designers?.user_id;
        }
      }

      // Create work review (only if we have a valid reviewer ID)
      if (reviewerId) {
        const { error: reviewError } = await (supabase as any)
          .from('session_work_reviews')
          .insert({
            session_id: sessionId,
            work_file_id: file.id,
            reviewer_id: reviewerId,
            reviewer_type: isDesigner ? 'customer' : 'designer',
            review_status: 'pending'
          });

        if (reviewError) throw reviewError;
      }

      // Update local state
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, work_type: 'work', work_description: workDescription, work_status: 'in_review' }
          : f
      ));

      setReviewingFile(null);
      setWorkDescription('');
      
      toast({
        title: "Work submitted for review",
        description: "Your work has been submitted for review",
      });
    } catch (error) {
      console.error('Error submitting work for review:', error);
      toast({
        title: "Error",
        description: "Failed to submit work for review",
        variant: "destructive",
      });
    }
  };

  const approveWork = async (file: FileItem) => {
    try {
      // Create file review record
      const { error: reviewError } = await (supabase as any)
        .from('file_reviews')
        .insert({
          file_id: file.id,
          reviewer_id: userId,
          reviewer_type: isDesigner ? 'designer' : 'customer',
          action: 'approve',
          notes: reviewNotes.trim() || null
        });

      if (reviewError) throw reviewError;

      // Update local state - set as approved and keep as regular file (not work under review)
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { 
              ...f, 
              status: 'approved', 
              work_status: 'approved',
              work_type: 'file', // Keep as regular file, don't move to work review
              reviewed_at: new Date().toISOString(), 
              review_notes: reviewNotes 
            }
          : f
      ));

      setReviewingFile(null);
      setReviewNotes('');
      
      toast({
        title: "File approved",
        description: "The file has been approved successfully",
      });
    } catch (error) {
      console.error('Error approving file:', error);
      toast({
        title: "Error",
        description: "Failed to approve file",
        variant: "destructive",
      });
    }
  };

  const rejectWork = async (file: FileItem) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create file review record
      const { error: reviewError } = await (supabase as any)
        .from('file_reviews')
        .insert({
          file_id: file.id,
          reviewer_id: userId,
          reviewer_type: isDesigner ? 'designer' : 'customer',
          action: 'reject',
          notes: rejectionReason.trim()
        });

      if (reviewError) throw reviewError;

      // Update local state - set as rejected and move to work under review
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { 
              ...f, 
              status: 'rejected', 
              work_status: 'rejected',
              work_type: 'work',
              reviewed_at: new Date().toISOString(), 
              review_notes: rejectionReason 
            }
          : f
      ));

      setReviewingFile(null);
      setRejectionReason('');
      
      toast({
        title: "File rejected",
        description: "The file has been rejected with feedback",
      });
    } catch (error) {
      console.error('Error rejecting file:', error);
      toast({
        title: "Error",
        description: "Failed to reject file",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'revision_requested': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'in_review': return 'In Review';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const getWorkStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      case 'revision_requested': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'in_review': return 'In Review';
      case 'revision_requested': return 'Revision Requested';
      case 'pending': return 'Pending Review';
      default: return 'Unknown';
    }
  };

  const generateInvoice = async () => {
    try {
      const subtotal = Math.ceil(duration / 60) * rate * formatMultiplier;
      const gstAmount = subtotal * 0.18;
      const total = subtotal + gstAmount;

      const invoiceData = {
        session_id: sessionId,
        designer_name: designerName,
        customer_name: customerName,
        duration_minutes: Math.ceil(duration / 60),
        rate_per_minute: rate,
        subtotal: subtotal,
        gst_amount: gstAmount,
        total_amount: total,
        invoice_date: new Date().toISOString()
      };

      // Save invoice to database
      const { data: invoice, error } = await supabase
        .from('session_invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;

      // Send invoice as a message in chat
      const messageData = {
        conversation_id: sessionId,
        sender_id: userId,
        content: `📄 Invoice generated for ${Math.ceil(duration / 60)} minutes of work. Total: $${total.toFixed(2)}`,
        message_type: 'invoice'
      };

      const { data: message, error: messageError } = await supabase
        .from('conversation_messages')
        .insert(messageData)
        .select()
        .single();

      if (messageError) throw messageError;

      // Link invoice to message
      const { error: linkError } = await supabase
        .from('session_invoice_messages')
        .insert({
          session_id: sessionId,
          invoice_id: invoice.id,
          message_id: message.id
        });

      if (linkError) throw linkError;

      // Generate beautiful HTML invoice
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice - ${sessionId}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
            .invoice-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 1.1em; }
            .content { padding: 40px; }
            .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section h3 { color: #374151; margin-bottom: 15px; font-size: 1.2em; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .detail-label { color: #6b7280; }
            .detail-value { font-weight: 500; color: #111827; }
            .billing-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            .billing-table th { background: #f3f4f6; padding: 15px; text-align: left; font-weight: 600; color: #374151; }
            .billing-table td { padding: 15px; border-bottom: 1px solid #e5e7eb; }
            .billing-table .total-row { background: #f9fafb; font-weight: 600; }
            .amount { text-align: right; }
            .total-section { background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .final-total { font-size: 1.5em; font-weight: 700; color: #1f2937; border-top: 2px solid #e5e7eb; padding-top: 15px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 0.9em; }
            .payment-info { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-top: 20px; }
            .payment-info h4 { margin: 0 0 10px 0; color: #92400e; }
            .payment-info p { margin: 5px 0; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <h1>INVOICE</h1>
              <p>Design Session Payment</p>
            </div>
            
            <div class="content">
              <div class="invoice-details">
                <div>
                  <h3>Designer Details</h3>
                  <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${designerName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Session ID:</span>
                    <span class="detail-value">${sessionId}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div>
                  <h3>Customer Details</h3>
                  <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${customerName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Rate:</span>
                    <span class="detail-value">$${rate.toFixed(2)}/min</span>
                  </div>
                </div>
              </div>

              <table class="billing-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th class="amount">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Design Session (${Math.ceil(duration / 60)} minutes × $${rate.toFixed(2)}/min × ${formatMultiplier}x)</td>
                    <td class="amount">$${subtotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div class="total-section">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>GST (18%):</span>
                  <span>$${gstAmount.toFixed(2)}</span>
                </div>
                <div class="total-row final-total">
                  <span>Total Amount:</span>
                  <span>$${total.toFixed(2)}</span>
                </div>
              </div>

              <div class="payment-info">
                <h4>💳 Payment Information</h4>
                <p><strong>Payment Status:</strong> Pending</p>
                <p><strong>Due Date:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                <p><strong>Payment Method:</strong> Bank Transfer / UPI / Card</p>
                <p><strong>Contact Designer:</strong> For payment details and bank information</p>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing our design services!</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create and download the invoice
      const blob = new Blob([invoiceHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${sessionId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Invoice generated",
        description: "Beautiful invoice has been downloaded",
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      });
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync local state with props when they change
  useEffect(() => {
    setNewRate(rate);
  }, [rate]);

  useEffect(() => {
    setNewMultiplier(formatMultiplier);
  }, [formatMultiplier]);

  return (
    <div className={mobileMode ? "w-full bg-white flex flex-col h-full" : "w-full lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col max-h-full overflow-auto md:overflow-hidden md:h-full h-[40vh]"}>
      <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col h-full min-h-0">
        {!mobileMode && (
          <TabsList className="grid w-full grid-cols-5 h-10 shrink-0">
            <TabsTrigger value="billing" className="text-xs sm:text-sm px-1 sm:px-3">Billing</TabsTrigger>
            <TabsTrigger value="files" className="text-xs sm:text-sm px-1 sm:px-3">Files</TabsTrigger>
            <TabsTrigger value="chat" className="text-xs sm:text-sm px-1 sm:px-3">Chat</TabsTrigger>
            <TabsTrigger value="review" className="text-xs sm:text-sm px-1 sm:px-3">Review</TabsTrigger>
            <TabsTrigger value="invoice" className="text-xs sm:text-sm px-1 sm:px-3">Invoice</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="billing" className="flex-1 p-2 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
          <Card className="h-full min-h-[20rem] flex flex-col min-h-">
            <CardHeader className="pb-2 sm:pb-3 shrink-0">
              <CardTitle className="text-xs sm:text-sm font-medium">$ Session Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto min-h-0">
              <div className="space-y-1 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 truncate">Designer:</span>
                  <span className="font-medium truncate ml-2">{designerName}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 truncate">Customer:</span>
                  <span className="font-medium truncate ml-2">{customerName}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Rate per minute:</span>
                  {isDesigner && isEditingRate ? (
                    <div className="flex items-center space-x-1">
                      <Input
                        type="number"
                        step=".1"
                        min="0"
                        value={newRate}
                        onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                        className="w-16 h-6 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          onRateChange?.(newRate);
                          setIsEditingRate(false);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setNewRate(rate);
                          setIsEditingRate(false);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <span>${rate.toFixed(2)}</span>
                      {isDesigner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0"
                          onClick={() => {
                            console.log('Edit rate clicked');
                            setIsEditingRate(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Format Multiplier:</span>
                  {isDesigner && isEditingMultiplier ? (
                    <div className="flex items-center space-x-1">
                      <Input
                        type="number"
                        step=".1"
                        min="0"
                        value={newMultiplier}
                        onChange={(e) => setNewMultiplier(parseFloat(e.target.value) || 1)}
                        className="w-16 h-6 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          onMultiplierChange?.(newMultiplier);
                          setIsEditingMultiplier(false);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setNewMultiplier(formatMultiplier);
                          setIsEditingMultiplier(false);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <span>{formatMultiplier}x</span>
                      {isDesigner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0"
                          onClick={() => {
                            console.log('Edit multiplier clicked');
                            setIsEditingMultiplier(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-xs sm:text-sm">
                  <span>Subtotal:</span>
                  <span>${(Math.ceil(duration / 60) * rate * formatMultiplier).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span>GST (18%):</span>
                  <span>${(Math.ceil(duration / 60) * rate * formatMultiplier * 0.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm sm:text-lg">
                  <span>Total:</span>
                  <span>${(Math.ceil(duration / 60) * rate * formatMultiplier * 1.18).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="flex-1 p-2 sm:p-4 min-h-0">
          <Card className="h-full md:min-h-fit min-h-[20rem] flex flex-col">
            <CardHeader className="pb-2 sm:pb-3 shrink-0">
              <CardTitle className="text-xs sm:text-sm font-medium">Session Files</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="space-y-2 sm:space-y-3 flex-1 flex flex-col">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                  size="sm"
                >
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <ScrollArea className="flex-1 min-h-0">
                  {files.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-500 text-center py-4">
                      No files uploaded yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div key={file.id} className="p-3 bg-gray-50 rounded border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                              <p className="text-xs text-gray-400">Uploaded by: {file.uploaded_by}</p>
                              {file.work_description && (
                                <p className="text-xs text-blue-600 mt-1">
                                  <strong>Work:</strong> {file.work_description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(file.status || 'pending')}`}>
                                {getStatusText(file.status || 'pending')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadFile(file)}
                              className="text-xs"
                            >
                              <span className="hidden sm:inline">Download</span>
                              <span className="sm:hidden">↓</span>
                            </Button>
                            
                            {/* Designer can submit work for review */}
                            {isDesigner && file.uploaded_by_type === 'designer' && file.work_type === 'file' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReviewingFile(file)}
                                className="text-blue-600 hover:text-blue-700 text-xs"
                              >
                                Submit for Review
                              </Button>
                            )}
                            
                            {/* Customer can review designer work */}
                            {!isDesigner && file.uploaded_by_type === 'designer' && file.status === 'pending' && (
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setReviewingFile(file)}
                                  className="text-green-600 hover:text-green-700 text-xs"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setReviewingFile(file)}
                                  className="text-red-600 hover:text-red-700 text-xs"
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                            
                            {/* Designer can resubmit rejected work */}
                            {isDesigner && file.uploaded_by_type === 'designer' && file.work_status === 'rejected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReviewingFile(file)}
                                className="text-orange-600 hover:text-orange-700 text-xs"
                              >
                                Resubmit
                              </Button>
                            )}
                          </div>
                          
                          {file.work_status === 'rejected' && file.rejection_reason && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="text-xs text-red-600">
                                <strong>Rejection reason:</strong> {file.rejection_reason}
                              </p>
                            </div>
                          )}
                          
                          {file.work_status === 'approved' && file.review_notes && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                              <p className="text-xs text-green-600">
                                <strong>Review notes:</strong> {file.review_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="flex-1 p-2 sm:p-4 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col h-full min-h-0">
            <CardHeader className="pb-2 sm:pb-3 shrink-0">
              <CardTitle className="text-xs sm:text-sm font-medium">Session Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ScrollArea className="flex-1 mb-2 sm:mb-3 min-h-0 max-h-[300px] sm:max-h-[400px]">
                <div className="space-y-2 p-2">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500">No messages yet</p>
                      <p className="text-xs text-gray-400 mt-1">Start the conversation below</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg text-xs sm:text-sm ${
                          message.sender_type === (isDesigner ? 'designer' : 'customer')
                            ? 'bg-blue-100 ml-4 sm:ml-8 border-l-2 border-blue-300'
                            : 'bg-gray-100 mr-4 sm:mr-8 border-l-2 border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-700 text-xs">
                            {message.sender_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="break-words text-gray-800">{message.content}</p>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="flex space-x-2 shrink-0">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 text-xs sm:text-sm"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()} size="sm" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Send</span>
                  <span className="sm:hidden">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="flex-1 p-2 sm:p-4 min-h-0">
          <Card className="h-full flex flex-col min-h-0">
            <CardHeader className="pb-2 sm:pb-3 shrink-0">
              <CardTitle className="text-xs sm:text-sm font-medium">Work Review</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ScrollArea className="flex-1 min-h-0">
                {files.filter(file => file.work_type === 'work' && (file.work_status === 'in_review' || file.work_status === 'rejected')).length === 0 ? (
                  <p className="text-xs sm:text-sm text-gray-500 text-center py-4">
                    No work pending review
                  </p>
                ) : (
                  <div className="space-y-3">
                    {files
                      .filter(file => file.work_type === 'work' && (file.work_status === 'in_review' || file.work_status === 'rejected'))
                      .map((file) => (
                        <div key={file.id} className="p-3 bg-gray-50 rounded border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                              <p className="text-xs text-gray-400">By: {file.uploaded_by}</p>
                              {file.work_description && (
                                <p className="text-xs text-blue-600 mt-1">
                                  <strong>Description:</strong> {file.work_description}
                                </p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWorkStatusColor(file.work_status || 'pending')}`}>
                              {getWorkStatusText(file.work_status || 'pending')}
                            </span>
                          </div>
                          
                          {file.work_status === 'rejected' && file.rejection_reason && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="text-xs text-red-600">
                                <strong>Rejection reason:</strong> {file.rejection_reason}
                              </p>
                            </div>
                          )}
                          
                          <div className="mt-2 flex justify-between">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadFile(file)}
                              className="text-xs"
                            >
                              Download
                            </Button>
                            
                            {!isDesigner && file.work_status === 'in_review' && (
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setReviewingFile(file)}
                                  className="text-green-600 hover:text-green-700 text-xs"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setReviewingFile(file)}
                                  className="text-red-600 hover:text-red-700 text-xs"
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                            
                            {isDesigner && file.work_status === 'rejected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReviewingFile(file)}
                                className="text-orange-600 hover:text-orange-700 text-xs"
                              >
                                Resubmit
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice" className="flex-1 p-2 sm:p-4 min-h-0">
          <Card className="h-full flex flex-col min-h-0">
            <CardHeader className="pb-2 sm:pb-3 shrink-0">
              <CardTitle className="text-xs sm:text-sm font-medium">Invoices</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="space-y-3">
                <Button onClick={generateInvoice} className="w-full text-xs sm:text-sm">
                  <span className="hidden sm:inline">Generate New Invoice</span>
                  <span className="sm:hidden">Generate Invoice</span>
                </Button>
                
                <ScrollArea className="flex-1 min-h-0">
                  {invoices.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-500 text-center py-4">
                      No invoices generated yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {invoices.map((invoice) => (
                        <div key={invoice.id} className="p-3 bg-gray-50 rounded border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium">Invoice #{invoice.id.slice(-8)}</p>
                              <p className="text-xs text-gray-500">
                                {Math.ceil(invoice.duration_minutes)} minutes @ ${invoice.rate_per_minute}/min
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(invoice.invoice_date).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-green-600">
                              ${invoice.total_amount.toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadInvoice(invoice)}
                              className="text-xs"
                            >
                              Download
                            </Button>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                              invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Work Review Dialog */}
      {reviewingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {reviewingFile.work_type === 'work' ? 'Review Work' : 'Submit Work for Review'}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm font-medium">{reviewingFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(reviewingFile.file_size)}</p>
              <p className="text-xs text-gray-400">By: {reviewingFile.uploaded_by}</p>
            </div>

            {reviewingFile.work_type === 'file' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Work Description *</label>
                  <textarea
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    placeholder="Describe the work you've completed..."
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {reviewingFile.work_type === 'work' && reviewingFile.work_status === 'in_review' && (
              <div className="space-y-4">
                {reviewingFile.work_description && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-600">
                      <strong>Work Description:</strong> {reviewingFile.work_description}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-2">Review Notes (Optional)</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add review notes..."
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Rejection Reason (Required for rejection)</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {reviewingFile.work_type === 'work' && reviewingFile.work_status === 'rejected' && (
              <div className="space-y-4">
                {reviewingFile.work_description && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-600">
                      <strong>Work Description:</strong> {reviewingFile.work_description}
                    </p>
                  </div>
                )}
                
                {reviewingFile.rejection_reason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-600">
                      <strong>Rejection Reason:</strong> {reviewingFile.rejection_reason}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-2">Updated Work Description *</label>
                  <textarea
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    placeholder="Describe the updated work..."
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setReviewingFile(null);
                  setReviewNotes('');
                  setRejectionReason('');
                  setWorkDescription('');
                }}
              >
                Cancel
              </Button>
              
              {reviewingFile.work_type === 'file' && (
                <Button
                  onClick={() => submitWorkForReview(reviewingFile)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Submit for Review
                </Button>
              )}
              
              {reviewingFile.work_type === 'work' && reviewingFile.work_status === 'in_review' && reviewingFile.status !== 'rejected' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => rejectWork(reviewingFile)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => approveWork(reviewingFile)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                </>
              )}
              
              {reviewingFile.work_type === 'work' && reviewingFile.work_status === 'rejected' && (
                <Button
                  onClick={() => submitWorkForReview(reviewingFile)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Resubmit
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}