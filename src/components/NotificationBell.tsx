import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_id: string | null;
  data?: any;
  created_at: string;
}

export default function NotificationBell() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🔔 NotificationBell useEffect triggered');
    console.log('🔔 User:', user?.id);
    console.log('🔔 Profile:', profile?.user_type);
    
    if (!user || !profile) {
      console.log('🔔 Missing user or profile, returning early');
      return;
    }

    console.log('🔔 Fetching notifications...');
      fetchNotifications();
      
    // Set up real-time subscription for notifications table
    const notificationsChannel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
          setNotifications(prev => {
            // Check if notification already exists (by ID or content)
            const exists = prev.some(n => 
              n.id === newNotification.id ||
              (n.type === newNotification.type && n.message === newNotification.message && 
               Math.abs(new Date(n.created_at).getTime() - new Date(newNotification.created_at).getTime()) < 1000)
            );
            if (exists) {
              console.log('🔔 Duplicate database notification prevented:', newNotification.message);
              return prev;
            }
            return [newNotification, ...prev];
          });
          setUnreadCount(prev => prev + 1);
          
           // Show toast for important notifications (excluding chat messages)
           if (newNotification.type === 'booking_confirmation' || 
               newNotification.type === 'booking_confirmed' ||
               newNotification.type === 'booking_cancelled' ||
               newNotification.type === 'booking_accepted' ||
               newNotification.type === 'booking_rejected' ||
               newNotification.type === 'booking_requested' ||
               newNotification.type === 'complaint_received' ||
               newNotification.type === 'complaint_approved' ||
               newNotification.type === 'complaint_rejected' ||
               newNotification.type === 'complaint_registered' ||
               newNotification.type === 'file_ready_for_review' ||
               newNotification.type === 'file_uploaded' ||
               newNotification.type === 'invoice_generated' ||
               newNotification.type === 'wallet_transaction' ||
               newNotification.type === 'session_ended') {
             toast({
               title: newNotification.title,
               description: newNotification.message,
               duration: 5000,
             });
           }
        }
      )
      .subscribe();

      // Set up real-time subscription for bookings (for designers)
      let bookingsChannel: any = null;
      if (profile.user_type === 'designer') {
        // Get designer ID from designers table
        supabase
          .from('designers')
          .select('id')
          .eq('user_id', user.id)
          .single()
          .then(({ data: designerData, error }) => {
            if (error) {
              console.error('Error fetching designer ID:', error);
              return;
            }
            if (designerData?.id) {
              bookingsChannel = supabase
                .channel('designer_bookings')
                .on(
                  'postgres_changes',
                  {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bookings',
                    filter: `designer_id=eq.${designerData.id}`
                  },
            async (payload) => {
              const newBooking = payload.new;
              if (newBooking.status === 'pending') {
                // Fetch customer name for toast notification only
                const { data: customer } = await supabase
                  .from('profiles')
                  .select('first_name, last_name')
                  .eq('user_id', newBooking.customer_id)
                  .single();
                
                const customerName = customer 
                  ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                  : 'A customer';
                
                // Only show toast notification - database trigger will handle the persistent notification
                toast({
                  title: "New Booking Request!",
                  description: `${customerName} wants to book ${newBooking.service}`,
                  duration: 10000,
                });
              }
            }
          )
          .subscribe();
            } else {
              console.error('No designer ID found');
            }
          });
      }

    // Set up real-time subscription for messages
    let messagesChannel: any = null;
    if (profile.user_type === 'designer') {
      console.log('🔔 Setting up message notifications for designer...');
      console.log('🔔 Current user ID:', user.id);
      console.log('🔔 Profile type:', profile.user_type);
      
      // Get designer ID from designers table
      supabase
        .from('designers')
        .select('id')
        .eq('user_id', user.id)
        .single()
        .then(({ data: designerData, error }) => {
          if (error) {
            console.error('❌ Error fetching designer ID for messages:', error);
            return;
          }
          if (designerData?.id) {
            console.log('✅ Designer ID found for messages:', designerData.id);
            messagesChannel = supabase
              .channel('designer_conversation_messages')
              .on(
                'postgres_changes',
                {
                  event: 'INSERT',
                  schema: 'public',
                  table: 'conversation_messages'
                },
                async (payload) => {
                  console.log('🔔 Message notification received:', payload);
                  const newMessage = payload.new;
                  console.log('🔔 New message data:', newMessage);
                  console.log('🔔 Message sender_id:', newMessage.sender_id);
                  console.log('🔔 Current user ID:', user.id);
                  console.log('🔔 Message booking_id:', newMessage.booking_id);
                  console.log('🔔 Message content:', newMessage.content);
                  
                  // Check if message is not from current user
                  if (newMessage.sender_id !== user.id) {
                    console.log('🔔 Message is NOT from current user, proceeding...');
                    // Check if this message is for this designer by checking the conversation
                    const { data: conversation, error: conversationError } = await supabase
                      .from('conversations')
                      .select('designer_id, customer_id')
                      .eq('id', newMessage.conversation_id)
                      .single();

                    if (conversationError) {
                      console.error('❌ Error fetching conversation for message:', conversationError);
                      return;
                    }
                    
                    console.log('🔔 Conversation data:', conversation);
                    console.log('🔔 Conversation designer_id:', conversation?.designer_id);
                    console.log('🔔 Conversation customer_id:', conversation?.customer_id);
                    console.log('🔔 Current designer ID:', designerData.id);
                    
                    // Only process if this conversation belongs to the current designer
                    if (conversation?.designer_id === designerData.id) {
                      console.log('🔔 Processing message notification for designer');
                      // Fetch sender name and booking details
                      const { data: sender, error: senderError } = await supabase
                        .from('profiles')
                        .select('first_name, last_name')
                        .eq('user_id', newMessage.sender_id)
                        .single();

                      if (senderError) {
                        console.error('❌ Error fetching sender for message:', senderError);
                        // Continue with a generic sender name if profile fetch fails
                      }
                      
                      const senderName = sender 
                        ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim()
                        : 'Someone';
                      
                      console.log('🔔 Sender name:', senderName);
                      
                      const notification: Notification = {
                        id: `message-${newMessage.id}`,
                        type: 'message',
                        title: 'New Message',
                        message: `${senderName}: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`,
                        is_read: false,
                        related_id: newMessage.conversation_id,
                        data: { 
                          message_id: newMessage.id, 
                          conversation_id: newMessage.conversation_id,
                          sender_id: newMessage.sender_id
                        },
                        created_at: new Date().toISOString()
                      };
                      
                      console.log('🔔 Creating notification:', notification);
                      setNotifications(prev => {
                        // Check if notification already exists (by message_id or content)
                        const exists = prev.some(n => 
                          n.data?.message_id === notification.data?.message_id ||
                          (n.type === 'message' && n.message === notification.message && 
                           Math.abs(new Date(n.created_at).getTime() - new Date(notification.created_at).getTime()) < 1000)
                        );
                        if (exists) {
                          console.log('🔔 Duplicate notification prevented:', notification.message);
                          return prev;
                        }
                        return [notification, ...prev];
                      });
                      setUnreadCount(prev => prev + 1);
                      
                      // Try to save to database, but don't fail if it doesn't work
                      try {
                        await supabase
                          .from('notifications')
                          .insert({
                            user_id: user.id,
                            type: 'message',
                            title: 'New Message',
                            message: `${senderName}: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`,
                            is_read: false,
                            related_id: newMessage.conversation_id,
                            data: { 
                              message_id: newMessage.id, 
                              conversation_id: newMessage.conversation_id,
                              sender_id: newMessage.sender_id
                            }
                          });
                        console.log('✅ Message notification saved to database.');
                      } catch (dbError) {
                        console.warn('⚠️ Could not save message notification to database:', dbError);
                        // Continue anyway - the notification is already in the UI
                      }
                      
                      console.log('🔔 Designer message notification added to bell!');
                    } else {
                      console.log('🔔 Message conversation does not belong to current designer or conversation not found.');
                      console.log('🔔 Conversation designer_id:', conversation?.designer_id, 'vs Current designer ID:', designerData.id);
                    }
                  } else {
                    console.log('🔔 Message is from current user, skipping notification.');
                  }
                }
              )
              .subscribe((status) => {
                console.log('🔔 Message subscription status:', status);
              });
          } else {
            console.error('No designer ID found for messages');
          }
        });
    } else {
      // For customers
      console.log('🔔 Setting up message notifications for customer...');
      messagesChannel = supabase
        .channel('customer_conversation_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'conversation_messages'
          },
          async (payload) => {
            console.log('🔔 Customer message notification received:', payload);
            const newMessage = payload.new;
            console.log('🔔 New customer message data:', newMessage);
            
            // Check if message is not from current user
            if (newMessage.sender_id !== user.id) {
              console.log('🔔 Processing customer message notification...');
              
              // Check if this message is for this customer by checking the conversation
              const { data: conversation, error: conversationError } = await supabase
                .from('conversations')
                .select('customer_id, designer_id')
                .eq('id', newMessage.conversation_id)
                .single();

              if (conversationError) {
                console.error('❌ Error fetching conversation for customer message:', conversationError);
                return;
              }
              
              console.log('🔔 Conversation data:', conversation);
              console.log('🔔 Conversation customer_id:', conversation?.customer_id);
              console.log('🔔 Current user ID:', user.id);
              
              // Only process if this conversation belongs to the current customer
              if (conversation?.customer_id === user.id) {
                console.log('🔔 Processing message notification for customer');
                // Fetch sender name and booking details
                const { data: sender, error: senderError } = await supabase
                  .from('profiles')
                  .select('first_name, last_name')
                  .eq('user_id', newMessage.sender_id)
                  .single();

                if (senderError) {
                  console.error('❌ Error fetching sender for customer message:', senderError);
                  // Continue with a generic sender name if profile fetch fails
                }
                
                const senderName = sender 
                  ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim()
                  : 'Designer';
                
                const notification: Notification = {
                  id: `message-${newMessage.id}`,
                  type: 'message',
                  title: 'New Message',
                  message: `${senderName}: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`,
                  is_read: false,
                  related_id: newMessage.conversation_id,
                  data: {
                    message_id: newMessage.id, 
                    conversation_id: newMessage.conversation_id,
                    sender_id: newMessage.sender_id
                  },
                  created_at: new Date().toISOString()
                };
                
                // Add notification to state immediately for UI (with deduplication)
                setNotifications(prev => {
                  // Check if notification already exists (by message_id or content)
                  const exists = prev.some(n => 
                    n.data?.message_id === notification.data?.message_id ||
                    (n.type === 'message' && n.message === notification.message && 
                     Math.abs(new Date(n.created_at).getTime() - new Date(notification.created_at).getTime()) < 1000)
                  );
                  if (exists) {
                    console.log('🔔 Duplicate notification prevented:', notification.message);
                    return prev;
                  }
                  return [notification, ...prev];
                });
                setUnreadCount(prev => prev + 1);
                
                // Try to save to database, but don't fail if it doesn't work
                try {
                  await supabase
                    .from('notifications')
                    .insert({
                      user_id: user.id,
                      type: 'message',
                      title: 'New Message',
                      message: `${senderName}: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`,
                      is_read: false,
                      related_id: newMessage.conversation_id,
                      data: {
                        message_id: newMessage.id, 
                        conversation_id: newMessage.conversation_id,
                        sender_id: newMessage.sender_id
                      }
                    });
                } catch (dbError) {
                  console.warn('Could not save message notification to database:', dbError);
                  // Continue anyway - the notification is already in the UI
                }
                
                console.log('🔔 Customer message notification added to bell!');
              } else {
                console.log('🔔 Message conversation does not belong to current customer.');
              }
            } else {
              console.log('🔔 Customer message is from current user, skipping notification.');
            }
          }
        )
        .subscribe((status) => {
          console.log('🔔 Customer message subscription status:', status);
        });
    }

    // Set up real-time subscription for complaints (for designers)
    let complaintsChannel: any = null;
    if (profile.user_type === 'designer') {
      // Get designer ID from designers table
      supabase
        .from('designers')
        .select('id')
        .eq('user_id', user.id)
        .single()
        .then(({ data: designerData }) => {
          if (designerData?.id) {
            complaintsChannel = supabase
              .channel('designer_complaints')
              .on(
                'postgres_changes',
                {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'customer_complaints',
                  filter: `designer_id=eq.${designerData.id}`
                },
                async (payload) => {
                  const updatedComplaint = payload.new;
                  
                  // Check if complaint was approved by admin
                  if (updatedComplaint.status === 'approved' && payload.old.status !== 'approved') {
                    const { data: customer } = await supabase
                      .from('profiles')
                      .select('first_name, last_name')
                      .eq('user_id', updatedComplaint.customer_id)
                      .single();
                    
                    const customerName = customer 
                      ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                      : 'A customer';
                    
                    const notification: Notification = {
                      id: `complaint-${updatedComplaint.id}`,
                      type: 'complaint_received',
                      title: 'Complaint Approved - Action Required',
                      message: `${customerName}'s complaint has been approved. Please upload a corrected file.`,
                      is_read: false,
                      related_id: updatedComplaint.id,
                      data: { 
                        complaint_id: updatedComplaint.id,
                        file_id: updatedComplaint.file_id
                      },
                      created_at: new Date().toISOString()
                    };
                    
                    setNotifications(prev => {
                      // Check if notification already exists (by ID or content)
                      const exists = prev.some(n => 
                        n.id === notification.id ||
                        (n.type === notification.type && n.message === notification.message && 
                         Math.abs(new Date(n.created_at).getTime() - new Date(notification.created_at).getTime()) < 1000)
                      );
                      if (exists) {
                        console.log('🔔 Duplicate complaint notification prevented:', notification.message);
                        return prev;
                      }
                      return [notification, ...prev];
                    });
                    setUnreadCount(prev => prev + 1);
                    
                    toast({
                      title: "Complaint Approved - Action Required",
                      description: `${customerName}'s complaint has been approved. Please upload a corrected file.`,
                      duration: 10000,
                    });
                  }
          }
        )
        .subscribe();
          }
        });
    } else {
      // Set up real-time subscription for complaints (for customers)
      complaintsChannel = supabase
        .channel('customer_complaints')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'customer_complaints',
            filter: `customer_id=eq.${user.id}`
          },
          async (payload) => {
            const updatedComplaint = payload.new;
            const oldComplaint = payload.old;
            
            // Check if complaint status changed to approved by admin
            if (updatedComplaint.status === 'approved' && oldComplaint.status !== 'approved') {
              const notification: Notification = {
                id: `customer-complaint-approved-${updatedComplaint.id}`,
                type: 'complaint_approved',
                title: 'Complaint Approved',
                message: 'Your complaint has been approved by admin. The designer will provide a corrected version.',
                is_read: false,
                related_id: updatedComplaint.id,
                data: { 
                  complaint_id: updatedComplaint.id,
                  file_id: updatedComplaint.file_id
                },
                created_at: new Date().toISOString()
              };
              
              setNotifications(prev => {
                const exists = prev.some(n => 
                  n.id === notification.id ||
                  (n.type === notification.type && n.related_id === notification.related_id && 
                   Math.abs(new Date(n.created_at).getTime() - new Date(notification.created_at).getTime()) < 1000)
                );
                if (exists) {
                  console.log('🔔 Duplicate customer complaint approved notification prevented');
                  return prev;
                }
                return [notification, ...prev];
              });
              setUnreadCount(prev => prev + 1);
              
              toast({
                title: "Complaint Approved",
                description: "Your complaint has been approved by admin. The designer will provide a corrected version.",
                duration: 5000,
              });
            }
            
            // Check if complaint status changed to rejected by admin
            if (updatedComplaint.status === 'rejected' && oldComplaint.status !== 'rejected') {
              const notification: Notification = {
                id: `customer-complaint-rejected-${updatedComplaint.id}`,
                type: 'complaint_rejected',
                title: 'Complaint Rejected',
                message: 'Your complaint has been reviewed and rejected by our admin team.',
                is_read: false,
                related_id: updatedComplaint.id,
                data: { 
                  complaint_id: updatedComplaint.id,
                  admin_notes: updatedComplaint.admin_notes
                },
                created_at: new Date().toISOString()
              };
              
              setNotifications(prev => {
                const exists = prev.some(n => 
                  n.id === notification.id ||
                  (n.type === notification.type && n.related_id === notification.related_id && 
                   Math.abs(new Date(n.created_at).getTime() - new Date(notification.created_at).getTime()) < 1000)
                );
                if (exists) {
                  console.log('🔔 Duplicate customer complaint rejected notification prevented');
                  return prev;
                }
                return [notification, ...prev];
              });
              setUnreadCount(prev => prev + 1);
              
              toast({
                title: "Complaint Rejected",
                description: "Your complaint has been reviewed and rejected by our admin team.",
                duration: 5000,
              });
            }
            
            // Check if designer uploaded a new file for review
            if (updatedComplaint.status === 'file_uploaded' && oldComplaint.status !== 'file_uploaded') {
              const { data: designer } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('user_id', updatedComplaint.designer_id)
                .single();
              
              const designerName = designer 
                ? `${designer.first_name || ''} ${designer.last_name || ''}`.trim()
                : 'The designer';
              
              const notification: Notification = {
                id: `customer-file-ready-${updatedComplaint.id}`,
                type: 'file_ready_for_review',
                title: 'New File Ready for Review',
                message: `${designerName} has uploaded a corrected version. Please review and approve or reject it.`,
                is_read: false,
                related_id: updatedComplaint.id,
                data: { 
                  complaint_id: updatedComplaint.id,
                  new_file_id: updatedComplaint.new_file_id
                },
                created_at: new Date().toISOString()
              };
              
              setNotifications(prev => {
                const exists = prev.some(n => 
                  n.id === notification.id ||
                  (n.type === notification.type && n.related_id === notification.related_id && 
                   Math.abs(new Date(n.created_at).getTime() - new Date(notification.created_at).getTime()) < 1000)
                );
                if (exists) {
                  console.log('🔔 Duplicate customer file ready notification prevented');
                  return prev;
                }
                return [notification, ...prev];
              });
              setUnreadCount(prev => prev + 1);
              
              toast({
                title: "New File Ready for Review",
                description: `${designerName} has uploaded a corrected version. Please review and approve or reject it.`,
                duration: 8000,
              });
            }
          }
        )
        .subscribe();
    }

    // Set up real-time subscription for invoices (for designers)
    let invoicesChannel: any = null;
    if (profile.user_type === 'designer') {
      // Get designer ID from designers table
      supabase
        .from('designers')
        .select('id')
        .eq('user_id', user.id)
        .single()
        .then(({ data: designerData }) => {
          if (designerData?.id) {
            invoicesChannel = supabase
              .channel('designer_invoices')
              .on(
                'postgres_changes',
                {
                  event: 'INSERT',
                  schema: 'public',
                  table: 'invoices',
                  filter: `designer_id=eq.${designerData.id}`
                },
                (payload) => {
                  const newInvoice = payload.new;
                  
                  const notification: Notification = {
                    id: `invoice-${newInvoice.id}`,
                    type: 'invoice_generated',
                    title: 'New Invoice Generated',
                    message: `Invoice ${newInvoice.invoice_number} for ₹${newInvoice.total_amount} has been generated.`,
                    is_read: false,
                    related_id: newInvoice.id,
                    data: { 
                      invoice_id: newInvoice.id,
                      invoice_number: newInvoice.invoice_number,
                      session_id: newInvoice.session_id
                    },
                    created_at: new Date().toISOString()
                  };
                  
                  setNotifications(prev => {
                    // Check if notification already exists (by ID or content)
                    const exists = prev.some(n => 
                      n.id === notification.id ||
                      (n.type === notification.type && n.message === notification.message && 
                       Math.abs(new Date(n.created_at).getTime() - new Date(notification.created_at).getTime()) < 1000)
                    );
                    if (exists) {
                      console.log('🔔 Duplicate invoice notification prevented:', notification.message);
                      return prev;
                    }
                    return [notification, ...prev];
                  });
                  setUnreadCount(prev => prev + 1);
                  
                  toast({
                    title: "New Invoice Generated",
                    description: `Invoice ${newInvoice.invoice_number} for ₹${newInvoice.total_amount} has been generated.`,
                    duration: 5000,
                  });
                }
              )
              .subscribe();
          }
        });
    } else {
      // Set up real-time subscription for invoices (for customers)
      invoicesChannel = supabase
        .channel('customer_invoices')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'invoices',
            filter: `customer_id=eq.${user.id}`
          },
          (payload) => {
            const newInvoice = payload.new;
            
            // Only notify customers about their invoices (invoice_type = 'customer')
            if (newInvoice.invoice_type === 'customer') {
              const notification: Notification = {
                id: `customer-invoice-${newInvoice.id}`,
                type: 'invoice_generated',
                title: 'Session Invoice Generated',
                message: `Your session invoice ${newInvoice.invoice_number} for ₹${newInvoice.total_amount} has been generated.`,
                is_read: false,
                related_id: newInvoice.id,
                data: { 
                  invoice_id: newInvoice.id,
                  invoice_number: newInvoice.invoice_number,
                  session_id: newInvoice.session_id
                },
                created_at: new Date().toISOString()
              };
              
              setNotifications(prev => {
                // Check if notification already exists (by ID or content)
                const exists = prev.some(n => 
                  n.id === notification.id ||
                  (n.type === notification.type && n.message === notification.message && 
                   Math.abs(new Date(n.created_at).getTime() - new Date(notification.created_at).getTime()) < 1000)
                );
                if (exists) {
                  console.log('🔔 Duplicate customer invoice notification prevented:', notification.message);
                  return prev;
                }
                return [notification, ...prev];
              });
              setUnreadCount(prev => prev + 1);
              
              toast({
                title: "Session Invoice Generated",
                description: `Your session invoice ${newInvoice.invoice_number} for ₹${newInvoice.total_amount} has been generated.`,
                duration: 5000,
              });
            }
          }
        )
        .subscribe();
    }

    // Set up real-time subscription for session files (for customers)
    let sessionFilesChannel: any = null;
    if (profile.user_type === 'customer') {
      sessionFilesChannel = supabase
        .channel('customer_session_files')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'session_files'
          },
          async (payload) => {
            const newFile = payload.new;
            console.log('🔔 Customer session file notification received:', newFile);
            
            // Check if this file is for a session where the current user is the customer
            if (newFile.uploaded_by_type === 'designer' && newFile.booking_id) {
              const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .select('customer_id, designer_id')
                .eq('id', newFile.booking_id)
                .single();

              if (bookingError) {
                console.error('❌ Error fetching booking for session file:', bookingError);
                return;
              }
              
              // Only notify if this booking belongs to the current customer
              if (booking?.customer_id === user.id) {
                console.log('🔔 Processing session file notification for customer');
                
                const { data: designer } = await supabase
                  .from('profiles')
                  .select('first_name, last_name')
                  .eq('user_id', newFile.uploaded_by_id)
                  .single();
                
                const designerName = designer 
                  ? `${designer.first_name || ''} ${designer.last_name || ''}`.trim()
                  : 'The designer';
                
                const notification: Notification = {
                  id: `session-file-${newFile.id}`,
                  type: 'file_uploaded',
                  title: 'Final Design File Uploaded',
                  message: `${designerName} has uploaded your final design file: ${newFile.name}`,
                  is_read: false,
                  related_id: newFile.session_id,
                  data: { 
                    file_id: newFile.id,
                    file_name: newFile.name,
                    file_url: newFile.file_url,
                    session_id: newFile.session_id,
                    booking_id: newFile.booking_id
                  },
                  created_at: new Date().toISOString()
                };
                
                setNotifications(prev => {
                  const exists = prev.some(n => 
                    n.id === notification.id ||
                    (n.type === notification.type && n.data?.file_id === notification.data?.file_id && 
                     Math.abs(new Date(n.created_at).getTime() - new Date(notification.created_at).getTime()) < 1000)
                  );
                  if (exists) {
                    console.log('🔔 Duplicate session file notification prevented');
                    return prev;
                  }
                  return [notification, ...prev];
                });
                setUnreadCount(prev => prev + 1);
                
                // Try to save to database
                try {
                  await supabase
                    .from('notifications')
                    .insert({
                      user_id: user.id,
                      type: 'file_uploaded',
                      title: 'Final Design File Uploaded',
                      message: `${designerName} has uploaded your final design file: ${newFile.name}`,
                      is_read: false,
                      related_id: newFile.session_id,
                      data: { 
                        file_id: newFile.id,
                        file_name: newFile.name,
                        file_url: newFile.file_url,
                        session_id: newFile.session_id,
                        booking_id: newFile.booking_id
                      }
                    });
                } catch (dbError) {
                  console.warn('Could not save session file notification to database:', dbError);
                }
                
                toast({
                  title: "Final Design File Uploaded",
                  description: `${designerName} has uploaded your final design file: ${newFile.name}`,
                  duration: 8000,
                });
                console.log('🔔 Customer session file toast notification sent!');
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('🔔 Customer session files subscription status:', status);
        });
    }

    return () => {
      supabase.removeChannel(notificationsChannel);
      if (bookingsChannel) supabase.removeChannel(bookingsChannel);
      if (messagesChannel) supabase.removeChannel(messagesChannel);
      if (complaintsChannel) supabase.removeChannel(complaintsChannel);
      if (invoicesChannel) supabase.removeChannel(invoicesChannel);
      if (sessionFilesChannel) supabase.removeChannel(sessionFilesChannel);
    };
  }, [user?.id, profile?.user_type]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_notifications', {
        p_user_id: user?.id,
        p_limit: 20,
        p_offset: 0
      });

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
        p_user_id: user?.id
      });

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      for (const notification of unreadNotifications) {
        await supabase.rpc('mark_notification_read', {
          p_notification_id: notification.id,
          p_user_id: user?.id
        });
      }

      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Handle navigation based on notification type
    switch (notification.type) {
      case 'booking_confirmation':
        // Navigate to designer dashboard bookings
        if (profile?.user_type === 'designer') {
          navigate('/designer-dashboard/bookings');
        }
        break;
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_accepted':
      case 'booking_rejected':
        // Navigate to customer bookings page
        if (profile?.user_type === 'client') {
          navigate('/customer-dashboard/bookings');
        }
        break;
      case 'booking_requested':
        // Navigate to designer bookings page
        if (profile?.user_type === 'designer') {
          navigate('/designer-dashboard/bookings');
        }
        break;
      case 'message':
        // Navigate to messages page
        if (profile?.user_type === 'designer') {
          navigate('/designer-dashboard/messages');
        } else {
          navigate('/customer-dashboard/messages');
        }
        break;
      case 'complaint_received':
        // Navigate to designer complaints page
        if (profile?.user_type === 'designer') {
          navigate('/designer/complaints');
        }
        break;
      case 'complaint_approved':
      case 'complaint_rejected':
      case 'file_ready_for_review':
        // Navigate to customer complaints page
        if (profile?.user_type === 'client') {
          navigate('/customer/complaints');
        }
        break;
      case 'complaint_registered':
        // Navigate to designer complaints page
        if (profile?.user_type === 'designer') {
          navigate('/designer/complaints');
        }
        break;
      case 'file_uploaded':
        // Navigate to customer files or session history
        if (profile?.user_type === 'client') {
          navigate('/customer-dashboard/files');
        }
        break;
      case 'wallet_transaction':
        // Navigate to wallet page
        if (profile?.user_type === 'client') {
          navigate('/customer-dashboard/wallet');
        } else if (profile?.user_type === 'designer') {
          navigate('/designer-dashboard/earnings');
        }
        break;
      case 'session_ended':
        // Navigate to session history or invoices
        if (profile?.user_type === 'client') {
          navigate('/customer-dashboard/invoices');
        } else if (profile?.user_type === 'designer') {
          navigate('/designer-dashboard/invoices');
        }
        break;
      case 'invoice_generated':
        // Navigate to invoices page based on user type
        if (profile?.user_type === 'designer') {
          navigate('/designer-dashboard/earnings');
        } else {
          navigate('/customer-dashboard/invoices');
        }
        break;
      case 'session_earnings':
        // Navigate to designer invoices page
        if (profile?.user_type === 'designer') {
          navigate('/designer-dashboard/invoices');
        }
        break;
      case 'session_payment':
        // Navigate to customer wallet or invoices page
        if (profile?.user_type === 'customer') {
          navigate('/customer-dashboard/wallet');
        }
        break;
      case 'payment_received':
        // Navigate to designer earnings page
        if (profile?.user_type === 'designer') {
          navigate('/designer-dashboard/earnings');
        }
        break;
      case 'withdrawal_completed':
        // Navigate to designer earnings page
        if (profile?.user_type === 'designer') {
          navigate('/designer-dashboard/earnings');
        }
        break;
      case 'announcement':
      // For announcements, just mark as read and close
      return;
      default:
        // For other types, just close the notification panel
        break;
    }
    
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmation':
        return '📅';
      case 'booking_confirmed':
      case 'booking_accepted':
        return '✅';
      case 'booking_cancelled':
      case 'booking_rejected':
        return '❌';
      case 'booking_requested':
        return '📅';
      case 'message':
        return '💬';
      case 'complaint_received':
      case 'complaint_resolved':
      case 'complaint_updated':
        return '❗';
      case 'complaint_approved':
        return '✅';
      case 'complaint_rejected':
        return '❌';
      case 'complaint_registered':
        return '❗';
      case 'file_ready_for_review':
        return '📋';
      case 'file_uploaded':
        return '📎';
      case 'invoice_generated':
        return '📄';
      case 'session_earnings':
        return '💰';
      case 'session_payment':
        return '💳';
      case 'file_approved':
        return '✅';
      case 'file_rejected':
        return '❌';
      case 'payment_received':
        return '💰';
      case 'withdrawal_completed':
        return '🏦';
      case 'wallet_transaction':
        return '💰';
      case 'session_ended':
        return '🏁';
      case 'session_reminder':
        return '⏰';
      case 'admin_message':
        return '📢';
      case 'system_alert':
        return '🔔';
      case 'announcement':
      case 'announcement_info':
        return 'ℹ️';
      case 'announcement_warning':
        return '⚠️';
      case 'announcement_success':
        return '✅';
      case 'announcement_error':
        return '❌';
      default:
        return '📢';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (!user) return null;




  return (
    <div className="relative z-[999999]">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-[999999]"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
      

      {isOpen && (
        <>
          {/* Backdrop to ensure notification is on top */}
          <div className="fixed inset-0 z-[999998] bg-transparent" onClick={() => setIsOpen(false)}></div>
          <div className="fixed right-4 top-20 w-80 z-[999999] bg-white shadow-2xl border-2 border-gray-200 rounded-lg">
            <Card className="shadow-lg border bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No notifications
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                          !notification.is_read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        </>
      )}
    </div>
  );
}
