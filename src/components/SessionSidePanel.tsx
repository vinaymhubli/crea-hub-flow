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
  userId,
  onRateChange,
  onMultiplierChange,
  formatMultiplier = 1
}: SessionSidePanelProps) {
  
  console.log('SessionSidePanel props:', { isDesigner, rate, formatMultiplier });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [isEditingMultiplier, setIsEditingMultiplier] = useState(false);
  const [newRate, setNewRate] = useState(rate);
  const [newMultiplier, setNewMultiplier] = useState(formatMultiplier);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load initial data and set up real-time subscriptions
  useEffect(() => {
    console.log('Setting up subscriptions for session:', sessionId);
    console.log('User ID:', userId);
    console.log('Is designer:', isDesigner);
    console.log('Designer name:', designerName);
    console.log('Customer name:', customerName);
    loadMessages();
    loadFiles();

    // Set up real-time subscriptions
    const messagesSubscription = supabase
      .channel(`session_messages_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${sessionId}`
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
  }, [sessionId, onPauseSession, onResumeSession, onMultiplierChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMessages = async () => {
    try {
      console.log('Loading messages for session:', sessionId);
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', sessionId)
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
      // TODO: Implement session files when database schema is ready
      // const { data, error } = await supabase
      //   .from('session_files')
      //   .select('*')
      //   .eq('session_id', sessionId)
      //   .order('created_at', { ascending: false });

      // if (error) throw error;
      // console.log('Loaded files:', data);
      setFiles([]);
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    try {
      const messageData = {
        conversation_id: sessionId,
        sender_id: userId,
        content: newMessage.trim(),
        message_type: 'text'
      };

      console.log('Sending message:', messageData);

      const { data, error } = await supabase
        .from('conversation_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      console.log('Message sent successfully:', data);

      // Don't add to local state here - let real-time subscription handle it
      // This prevents duplicates and ensures consistency
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
      // TODO: Implement file upload when database schema is ready
      // const fileExt = file.name.split('.').pop();
      // const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      // const filePath = `session-files/${sessionId}/${fileName}`;

      // const { error: uploadError } = await supabase.storage
      //   .from('session-files')
      //   .upload(filePath, file);

      // if (uploadError) throw uploadError;

      // const { data: { publicUrl } } = supabase.storage
      //   .from('session-files')
      //   .getPublicUrl(filePath);

      // const { data: fileData, error: insertError } = await supabase
      //   .from('session_files')
      //   .insert({
      //     session_id: sessionId,
      //     name: file.name,
      //     file_type: file.type || 'application/octet-stream',
      //     file_size: file.size,
      //     uploaded_by: isDesigner ? designerName : customerName,
      //     uploaded_by_type: isDesigner ? 'designer' : 'customer',
      //     uploaded_by_id: userId,
      //     file_url: publicUrl
      //   })
      //   .select()
      //   .single();

      // if (insertError) throw insertError;

      // Don't add to local state here - let real-time subscription handle it
      // This prevents duplicates and ensures consistency

      toast({
        title: "File upload",
        description: "File upload feature coming soon",
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

      // TODO: Implement session invoices when database schema is ready
      // const { error } = await supabase
      //   .from('session_invoices')
      //   .insert(invoiceData);

      // if (error) throw error;

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
    <div className="w-full lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col max-h-full overflow-auto md:overflow-hidden md:h-full h-[40vh]">
      <Tabs defaultValue="billing" className="flex-1 flex flex-col h-full min-h-0">
        <TabsList className="grid w-full grid-cols-4 h-10 shrink-0">
          <TabsTrigger value="billing" className="text-xs sm:text-sm px-1 sm:px-3">Billing</TabsTrigger>
          <TabsTrigger value="files" className="text-xs sm:text-sm px-1 sm:px-3">Files</TabsTrigger>
          <TabsTrigger value="chat" className="text-xs sm:text-sm px-1 sm:px-3">Chat</TabsTrigger>
          <TabsTrigger value="invoice" className="text-xs sm:text-sm px-1 sm:px-3">Invoice</TabsTrigger>
        </TabsList>

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
                        step="0.01"
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
                        step="0.1"
                        min="0.1"
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
                        <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadFile(file)}
                            className="ml-2 text-xs"
                          >
                            <span className="hidden sm:inline">Download</span>
                            <span className="sm:hidden">↓</span>
                          </Button>
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

        <TabsContent value="invoice" className="flex-1 p-2 sm:p-4 min-h-0">
          <Card className="h-full flex flex-col min-h-0">
            <CardHeader className="pb-2 sm:pb-3 shrink-0">
              <CardTitle className="text-xs sm:text-sm font-medium">Generate Invoice</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center min-h-0">
              <Button onClick={generateInvoice} className="w-full text-xs sm:text-sm">
                <span className="hidden sm:inline">Generate & Download Invoice</span>
                <span className="sm:hidden">Generate Invoice</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}