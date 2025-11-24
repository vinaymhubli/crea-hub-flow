import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Edit, Check, X, Paperclip, Download, File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { checkForContactInfo } from "@/utils/chatMonitor";
import { processFileWithWatermark } from "@/utils/watermark";
import { playNotificationSound } from "@/utils/notificationSound";

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
  onMultiplierChange?: (newMultiplier: number, fileFormat?: string) => void;
  formatMultiplier?: number;
  defaultTab?: string;
  mobileMode?: boolean;
  isDemo?: boolean; // NEW: Flag for demo sessions
}

interface ChatMessage {
  id: string;
  content: string;
  sender_type: "designer" | "customer";
  sender_id: string;
  sender_name: string;
  created_at: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_watermarked?: boolean;
}

interface FileItem {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_by: string;
  uploaded_by_type: "designer" | "customer";
  uploaded_by_id: string;
  created_at: string;
  session_id: string;
  status?: "pending" | "approved" | "rejected";
  work_status?: "pending" | "in_review" | "approved" | "rejected";
  work_type?: "file" | "work";
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
  reviewer_type: "designer" | "customer";
  review_status: "pending" | "approved" | "rejected";
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
  userId = "",
  onRateChange,
  onMultiplierChange,
  formatMultiplier = 1,
  defaultTab = "billing",
  mobileMode = false,
  isDemo = false, // NEW: Default to false (regular session)
}: SessionSidePanelProps) {
  // Determine which tables to use based on session type
  const messagesTable = isDemo ? "demo_session_messages" : "session_messages";
  const filesTable = isDemo ? "demo_session_files" : "session_files";
  // SessionSidePanel rendered
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  // Simplified: files/review/invoice tabs removed
  // const [files, setFiles] = useState<FileItem[]>([]);
  // const [workReviews, setWorkReviews] = useState<WorkReview[]>([]);
  // const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [isEditingMultiplier, setIsEditingMultiplier] = useState(false);
  const [newRate, setNewRate] = useState(rate);
  const [newMultiplier, setNewMultiplier] = useState(formatMultiplier);
  // const [reviewingFile, setReviewingFile] = useState<FileItem | null>(null);
  // const [reviewNotes, setReviewNotes] = useState("");
  // const [rejectionReason, setRejectionReason] = useState("");
  // const [workDescription, setWorkDescription] = useState("");
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [lastReadMessageTime, setLastReadMessageTime] = useState<string | null>(null);
  // const [unreadFileCount, setUnreadFileCount] = useState(0);
  // const [lastReadFileTime, setLastReadFileTime] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // New state for sidebar visibility
  const [showSidebar, setShowSidebar] = useState(true);

  // State for approval dialogs
  const [showRateApprovalDialog, setShowRateApprovalDialog] = useState(false);
  const [showMultiplierApprovalDialog, setShowMultiplierApprovalDialog] =
    useState(false);
  const [pendingRateChange, setPendingRateChange] = useState<number | null>(
    null
  );
  const [pendingMultiplierChange, setPendingMultiplierChange] = useState<
    number | null
  >(null);

  const pauseSession = async () => {
    if (!isDesigner) return;
    try {
      await supabase
        .channel(`session_control_${sessionId}`)
        .send({ type: "broadcast", event: "session_pause", payload: {} });
      onPauseSession();
    } catch {}
  };

  const resumeSession = async () => {
    if (!isDesigner) return;
    try {
      await supabase
        .channel(`session_control_${sessionId}`)
        .send({ type: "broadcast", event: "session_resume", payload: {} });
      onResumeSession();
    } catch {}
  };

  // Approval handlers
  const handleRateChangeRequest = (newRate: number) => {
    setPendingRateChange(newRate);
    setShowRateApprovalDialog(true);
  };

  const handleMultiplierChangeRequest = (newMultiplier: number) => {
    setPendingMultiplierChange(newMultiplier);
    setShowMultiplierApprovalDialog(true);
  };

  const handleRateApproval = (approved: boolean) => {
    if (approved && pendingRateChange !== null) {
      onRateChange?.(pendingRateChange);
      toast({
        title: "Rate Updated",
        description: `Session rate updated to ₹${pendingRateChange}/min`,
      });
    }
    setShowRateApprovalDialog(false);
    setPendingRateChange(null);
  };

  const handleMultiplierApproval = (approved: boolean) => {
    if (approved && pendingMultiplierChange !== null) {
      onMultiplierChange?.(pendingMultiplierChange);
      toast({
        title: "Format Multiplier Updated",
        description: `Format multiplier updated to ${pendingMultiplierChange}x`,
      });
    }
    setShowMultiplierApprovalDialog(false);
    setPendingMultiplierChange(null);
  };

  // Load initial data and set up real-time subscriptions
  useEffect(() => {
    loadMessages();
    // loadFiles();
    // loadWorkReviews();
    // loadInvoices();

    // Set up real-time subscriptions
    const messagesChannel = supabase.channel(`session_messages_${sessionId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: userId },
      },
    });

    messagesChannel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: messagesTable,
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log(
            "🔥 Real-time subscription triggered for message:",
            payload
          );
          const newMessage = payload.new as {
            id: string;
            content: string;
            sender_id: string;
            sender_type?: string;
            sender_name?: string;
            created_at: string;
            file_url?: string;
            file_name?: string;
            file_size?: number;
            is_watermarked?: boolean;
          };
          console.log("Real-time message received:", newMessage);

          // Transform the message to match our interface
          const transformedMessage: ChatMessage = {
            id: newMessage.id,
            content: newMessage.content,
            sender_type:
              (newMessage.sender_type as "designer" | "customer") ||
              (newMessage.sender_id === userId
                ? isDesigner
                  ? "designer"
                  : "customer"
                : isDesigner
                ? "customer"
                : "designer"),
            sender_id: newMessage.sender_id,
            sender_name:
              newMessage.sender_name && newMessage.sender_name.trim() !== ""
                ? newMessage.sender_name
                : newMessage.sender_id === userId
                ? isDesigner
                  ? designerName || "Designer"
                  : customerName || "Customer"
                : isDesigner
                ? customerName || "Customer"
                : designerName || "Designer",
            created_at: newMessage.created_at,
            file_url: newMessage.file_url,
            file_name: newMessage.file_name,
            file_size: newMessage.file_size,
            is_watermarked: newMessage.is_watermarked,
          };

          // Check if message is not already in the list to avoid duplicates
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === transformedMessage.id);
            if (!exists) {
              console.log(
                "Adding new message to list. Total messages before:",
                prev.length
              );
              console.log("New message details:", transformedMessage);
              const newMessages = [...prev, transformedMessage];
              
              // Update unread count if message is from other party
              if (transformedMessage.sender_id !== userId) {
                setUnreadMessageCount((count) => count + 1);
                // Play notification sound for new messages from other party
                playNotificationSound();
              }
              
              console.log("Total messages after adding:", newMessages.length);
              return newMessages;
            }
            console.log("Message already exists, skipping");
            return prev;
          });
        }
      )
      .on("broadcast", { event: "new_message" }, (payload) => {
        console.log("📨 Broadcast message received:", payload);
        const message = payload.payload as ChatMessage;
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === message.id);
          if (!exists) {
            // Update unread count if message is from other party
            if (message.sender_id !== userId) {
              setUnreadMessageCount((count) => count + 1);
              // Play notification sound for new messages from other party
              playNotificationSound();
            }
            return [...prev, message];
          }
          return prev;
        });
      })
      .on("broadcast", { event: "session_pause" }, (payload) => {
        onPauseSession();
      })
      .on("broadcast", { event: "session_resume" }, (payload) => {
        onResumeSession();
      })
      .on("broadcast", { event: "pricing_change" }, (payload) => {
        console.log("Pricing changed to:", payload.newRate);
        setNewRate(payload.newRate);
        onRateChange?.(payload.newRate);
      })
      .on("broadcast", { event: "multiplier_change" }, (payload) => {
        setNewMultiplier(payload.newMultiplier);
        onMultiplierChange?.(payload.newMultiplier);
        console.log("Multiplier changed to:", payload.newMultiplier);
      })
      .subscribe((status) => {
        console.log("Messages subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("✅ Messages subscription is active");
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Messages subscription failed");
        }
      });

    // Files subscription disabled since Files/Review/Invoice tabs are removed
    const filesSubscription = { unsubscribe: () => {} } as any;

    return () => {
      messagesChannel.unsubscribe();
      filesSubscription.unsubscribe();
    };
  }, [
    sessionId,
    onPauseSession,
    onResumeSession,
    onMultiplierChange,
    userId,
    isDesigner,
    designerName,
    customerName,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMessages = async () => {
    try {
      console.log("🔄 Loading messages for session:", sessionId, "from table:", messagesTable);
      const { data, error } = await (supabase as any)
        .from(messagesTable)
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
        return;
      }

      console.log("Loaded messages:", data);

      // Transform the data to match our ChatMessage interface
      const transformedMessages: ChatMessage[] = (data || []).map(
        (msg: {
          id: string;
          content: string;
          sender_id: string;
          sender_type?: string;
          sender_name?: string;
          created_at: string;
          file_url?: string;
          file_name?: string;
          file_size?: number;
          is_watermarked?: boolean;
        }) => ({
          id: msg.id,
          content: msg.content,
          sender_type:
            (msg.sender_type as "designer" | "customer") ||
            (msg.sender_id === userId
              ? isDesigner
                ? "designer"
                : "customer"
              : isDesigner
              ? "customer"
              : "designer"),
          sender_id: msg.sender_id,
          sender_name:
            msg.sender_name && msg.sender_name.trim() !== ""
              ? msg.sender_name
              : msg.sender_id === userId
              ? isDesigner
                ? designerName || "Designer"
                : customerName || "Customer"
              : isDesigner
              ? customerName || "Customer"
              : designerName || "Designer",
          created_at: msg.created_at,
          file_url: msg.file_url,
          file_name: msg.file_name,
          file_size: msg.file_size,
          is_watermarked: msg.is_watermarked,
        })
      );

      console.log("Transformed messages:", transformedMessages);
      console.log("Setting messages count:", transformedMessages.length);
      setMessages(transformedMessages);
      
      // Calculate unread messages (messages from other party after last read time)
      const otherPartyMessages = transformedMessages.filter(
        (msg) => msg.sender_id !== userId
      );
      
      if (lastReadMessageTime) {
        const unread = otherPartyMessages.filter(
          (msg) => new Date(msg.created_at) > new Date(lastReadMessageTime)
        );
        setUnreadMessageCount(unread.length);
      } else {
        // If no last read time, count all messages from other party
        setUnreadMessageCount(otherPartyMessages.length);
      }
      
      console.log("✅ Messages set in state");
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    }
  };

  // const loadFiles = async () => {};

  // const loadWorkReviews = async () => {};

  const loadInvoices = async () => {};

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    // Check for contact information (phone numbers and email addresses)
    // Pass sessionId and userId for pattern detection across messages
    const contactCheck = checkForContactInfo(newMessage.trim(), sessionId, userId);
    if (contactCheck.hasContactInfo) {
      toast({
        title: "Contact Information Detected",
        description: contactCheck.message,
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current user profile for sender name
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", userId)
        .single();

      const senderName = profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
          (isDesigner ? designerName || "Designer" : customerName || "Customer")
        : isDesigner
        ? designerName || "Designer"
        : customerName || "Customer";

      const messageText = newMessage.trim();
      setNewMessage("");

      const messageData = {
        session_id: sessionId,
        booking_id: isDemo ? null : (bookingId || null), // Demo sessions don't have bookings
        content: messageText,
        sender_type: isDesigner ? "designer" : "customer",
        sender_name: senderName,
        sender_id: userId, // Can be UUID or email for demo sessions
      };

      // Create optimistic message for immediate UI update
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`, // Temporary ID
        content: messageData.content,
        sender_type: messageData.sender_type as "designer" | "customer",
        sender_id: userId,
        sender_name: senderName,
        created_at: new Date().toISOString(),
      };

      // Add optimistic message immediately
      setMessages((prev) => [...prev, optimisticMessage]);

      const { data, error } = await (supabase as any)
        .from(messagesTable)
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      console.log("Message sent successfully:", data);

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessage.id
            ? {
                ...msg,
                id: data.id,
                created_at: data.created_at,
              }
            : msg
        )
      );

      // Broadcast message to other users via channel
      const channel = supabase.channel(`session_messages_${sessionId}`);
      await channel.send({
        type: "broadcast",
        event: "new_message",
        payload: {
          id: data.id,
          content: data.content,
          sender_type: data.sender_type,
          sender_id: data.sender_id,
          sender_name: data.sender_name,
          created_at: data.created_at,
        },
      });

      toast({
        title: "Message sent",
        description: "Your message has been sent",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Demo session file size limit: 2MB
    const MAX_DEMO_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
    
    if (isDemo && file.size > MAX_DEMO_FILE_SIZE) {
      toast({
        title: "File Too Large",
        description: "Demo sessions have a 2MB file size limit. Please choose a smaller file.",
        variant: "destructive",
      });
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

    try {
      setIsUploading(true);
      
      // Check if this is a designer uploading before final files
      // Final files are uploaded via DesignerFileUploadDialog and have status 'approved'
      // Files uploaded here should be watermarked if they're from designer
      let fileToUpload = file;
      let isWatermarked = false;
      
      if (isDesigner) {
        // Check if there are already final files (approved status) for this session
        const { data: existingFiles } = await supabase
          .from("session_files")
          .select("id, status")
          .eq("session_id", sessionId)
          .eq("uploaded_by_type", "designer")
          .eq("status", "approved");
        
        const hasFinalFiles = existingFiles && existingFiles.length > 0;
        
        // If no final files yet, watermark this file (it's before final)
        if (!hasFinalFiles) {
          try {
            fileToUpload = await processFileWithWatermark(file, "Meetmydesigners");
            isWatermarked = true;
          } catch (watermarkError) {
            console.warn("Failed to watermark file, uploading original:", watermarkError);
          }
        }
      }

      const fileExt = fileToUpload.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.${fileExt}`;
      const filePath = `session-files/${sessionId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("session-files")
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("session-files").getPublicUrl(filePath);

      // Determine file status based on who uploads:
      // - Customer files: approved (go directly to designer, no review needed)
      // - Designer files: pending (need customer approval)
      const fileStatus = isDesigner ? "pending" : "approved";

      const { data: fileData, error: insertError } = await (supabase as any)
        .from("session_files")
        .insert({
          session_id: sessionId,
          booking_id: bookingId,
          name: file.name, // Keep original name
          file_type: file.type || "application/octet-stream",
          file_size: fileToUpload.size,
          uploaded_by: isDesigner ? designerName : customerName,
          uploaded_by_type: isDesigner ? "designer" : "customer",
          uploaded_by_id: userId,
          file_url: publicUrl,
          status: fileStatus,
          work_description: isDesigner
            ? isWatermarked 
              ? "Designer work for review (Watermarked Preview)"
              : "Designer work for review"
            : "Customer reference material",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create a chat message with the file attachment
      try {
        // Get current user profile for sender name
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", userId)
          .single();

        const senderName = profile
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
            (isDesigner ? designerName || "Designer" : customerName || "Customer")
          : isDesigner
          ? designerName || "Designer"
          : customerName || "Customer";

        const fileMessageContent = isWatermarked 
          ? `📎 ${file.name} (Watermarked Preview)`
          : `📎 ${file.name}`;

        const messageData = {
          session_id: sessionId,
          booking_id: isDemo ? null : (bookingId || null), // Demo sessions don't have bookings
          content: fileMessageContent,
          sender_type: isDesigner ? "designer" : "customer",
          sender_name: senderName,
          sender_id: userId, // Can be UUID or email for demo sessions
          file_url: publicUrl,
          file_name: file.name,
          file_size: fileToUpload.size,
          is_watermarked: isWatermarked,
        };

        const { data: messageDataResult, error: messageError } = await (supabase as any)
          .from(messagesTable)
          .insert(messageData)
          .select()
          .single();

        if (messageError) {
          console.warn("Failed to create chat message for file:", messageError);
        } else {
          // Add the message to local state immediately
          const fileMessage: ChatMessage = {
            id: messageDataResult.id,
            content: fileMessageContent,
            sender_type: messageDataResult.sender_type as "designer" | "customer",
            sender_id: userId,
            sender_name: senderName,
            created_at: messageDataResult.created_at,
            file_url: publicUrl,
            file_name: file.name,
            file_size: fileToUpload.size,
            is_watermarked: isWatermarked,
          };

          setMessages((prev) => [...prev, fileMessage]);

          // Broadcast message to other users via channel
          const channel = supabase.channel(`session_messages_${sessionId}`);
          await channel.send({
            type: "broadcast",
            event: "new_message",
            payload: fileMessage,
          });
        }
      } catch (messageError) {
        console.warn("Error creating chat message for file:", messageError);
      }

      // Broadcast file upload and send notification
      if (isDesigner && fileStatus === "pending") {
        const channel = supabase.channel(`file_upload_${sessionId}`);
        await channel.send({
          type: "broadcast",
          event: "file_uploaded",
          payload: {
            fileName: file.name,
            fileUrl: publicUrl,
            isWatermarked: isWatermarked,
          },
        });

        // Send notification to customer
        try {
          // Get customer ID from session (works for both live and booking sessions)
          let customerId: string | null = null;
          
          // Try active_sessions first (for live sessions)
          const { data: sessionData } = await supabase
            .from("active_sessions")
            .select("customer_id")
            .eq("session_id", sessionId)
            .single();

          if (sessionData?.customer_id) {
            customerId = sessionData.customer_id;
          } else if (bookingId) {
            // Fallback: get from bookings (for scheduled sessions)
            const { data: bookingData } = await supabase
              .from("bookings")
              .select("customer_id")
              .eq("id", bookingId)
              .single();
            
            if (bookingData?.customer_id) {
              customerId = bookingData.customer_id;
            }
          }

          if (customerId) {
            await supabase.from("notifications").insert({
              user_id: customerId,
              type: "file_uploaded",
              title: isWatermarked 
                ? "New Preview File (Watermarked)"
                : "New File Uploaded",
              message: `${designerName} has uploaded ${file.name}${isWatermarked ? " (watermarked preview)" : ""}`,
              is_read: false,
              related_id: sessionId,
              data: {
                file_id: fileData.id,
                file_name: file.name,
                file_url: publicUrl,
                session_id: sessionId,
                booking_id: bookingId,
                is_watermarked: isWatermarked,
              },
            });

            // Play notification sound
            playNotificationSound();
          }
        } catch (notificationError) {
          console.warn("Failed to send notification:", notificationError);
        }
      }

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded${isWatermarked ? " (watermarked)" : ""}`,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadFile = async (file: FileItem) => {
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
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
                <td>₹{invoice.duration_minutes} minutes</td>
                <td>₹{invoice.rate_per_minute}/min</td>
                <td>₹{invoice.subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-line">Subtotal: ₹{invoice.subtotal.toFixed(2)}</div>
            <div class="total-line">GST (18%): ₹{invoice.gst_amount.toFixed(2)}</div>
            <div class="total-line grand-total">Total: ₹{invoice.total_amount.toFixed(2)}</div>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([invoiceHTML], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.id.slice(-8)}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Work review features removed
  // const submitWorkForReview = async (file: FileItem) => {};

  // const approveWork = async (file: FileItem) => {};

  // const rejectWork = async (file: FileItem) => {};

  // const getStatusColor = (status: string) => "";

  // const getStatusText = (status: string) => "";

  // const getWorkStatusColor = (status: string) => "";

  // const getWorkStatusText = (status: string) => "";

  const generateInvoice = async () => {
    try {
      const subtotal = Math.ceil(duration / 60) * rate * formatMultiplier;
      const gstAmount = subtotal * 0.18;
      const total = subtotal + gstAmount;

      // Get active invoice template from admin settings
      const { data: template, error: templateError } = await supabase
        .from("invoice_templates")
        .select("*")
        .eq("is_active", true)
        .single();

      if (templateError) {
        console.error("Template error:", templateError);
        toast({
          title: "Error",
          description: "Failed to load invoice template",
          variant: "destructive",
        });
        return;
      }

      // Get the actual designer ID from the session
      const { data: sessionData, error: sessionError } = await supabase
        .from("active_sessions")
        .select("designer_id")
        .eq("session_id", sessionId)
        .single();

      if (sessionError) {
        console.error("Session error:", sessionError);
        toast({
          title: "Error",
          description: "Failed to get session data",
          variant: "destructive",
        });
        return;
      }

      // Generate proper invoice using the existing invoice system
      const { data: invoiceData, error: invoiceError } = await supabase.rpc(
        "generate_session_invoices",
        {
          p_session_id: sessionId,
          p_customer_id: userId,
          p_designer_id: sessionData.designer_id,
          p_amount: subtotal,
          p_booking_id: bookingId || null,
          p_template_id: template.id,
          p_session_duration: Math.ceil(duration / 60),
          p_place_of_supply: "Inter-state",
        }
      );

      if (invoiceError) {
        console.error("Invoice generation error:", invoiceError);
        toast({
          title: "Error",
          description: "Failed to generate invoice",
          variant: "destructive",
        });
        return;
      }

      console.log("Invoice generated:", invoiceData);

      // Send invoice as a message in chat
      const messageData = {
        conversation_id: sessionId,
        sender_id: userId,
        content: `📄 Invoice generated for ${Math.ceil(
          duration / 60
        )} minutes of work. Total: ₹${total.toFixed(2)}`,
        message_type: "invoice",
      };

      const { data: message, error: messageError } = await supabase
        .from("conversation_messages")
        .insert(messageData)
        .select()
        .single();

      if (messageError) throw messageError;

      // Link invoice to message
      const { error: linkError } = await supabase
        .from("session_invoice_messages")
        .insert({
          session_id: sessionId,
          invoice_id: invoiceData[0].customer_invoice_id,
          message_id: message.id,
        });

      if (linkError) throw linkError;

      // Generate invoice using the proper template system
      const { data: customerInvoice, error: customerInvoiceError } =
        await supabase
          .from("invoices")
          .select("*")
          .eq("id", invoiceData[0].customer_invoice_id)
          .single();

      if (customerInvoiceError) {
        console.error("Customer invoice error:", customerInvoiceError);
        throw customerInvoiceError;
      }

      // Generate HTML invoice using the template
      const invoiceHTML = generateInvoiceHTML(customerInvoice, template);

      // Create and download the invoice
      const blob = new Blob([invoiceHTML], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${customerInvoice.invoice_number}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Invoice generated",
        description: "Invoice has been generated using admin template",
      });
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      });
    }
  };

  // Helper function to generate invoice HTML using admin template
  const generateInvoiceHTML = (invoice: any, template: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${invoice.invoice_number}</title>
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
            <p>${template.company_name}</p>
            <p>Invoice #${invoice.invoice_number}</p>
          </div>
          
          <div class="content">
            <div class="invoice-details">
              <div>
                <h3>Company Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Company:</span>
                  <span class="detail-value">${template.company_name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">GST:</span>
                  <span class="detail-value">${
                    template.gst_number || "N/A"
                  }</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Address:</span>
                  <span class="detail-value">${
                    template.company_address || "N/A"
                  }</span>
                </div>
              </div>
              
              <div>
                <h3>Session Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Session ID:</span>
                  <span class="detail-value">${invoice.session_id}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date(
                    invoice.created_at
                  ).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">${Math.floor(duration / 60)}:${(
      duration % 60
    )
      .toString()
      .padStart(2, "0")}</span>
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
                  <td>Design Session (${Math.ceil(
                    duration / 60
                  )} minutes × ₹${rate.toFixed(
      2
    )}/min × ${formatMultiplier}x)</td>
                  <td class="amount">₹${invoice.subtotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="total-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>₹${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>GST (18%):</span>
                <span>₹${invoice.tax_amount.toFixed(2)}</span>
              </div>
              <div class="total-row final-total">
                <span>Total Amount:</span>
                <span>₹${invoice.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div class="payment-info">
              <h4>💳 Payment Information</h4>
              <p><strong>Payment Status:</strong> ${invoice.status}</p>
              <p><strong>Due Date:</strong> ${new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ).toLocaleDateString()}</p>
              <p><strong>Payment Method:</strong> Bank Transfer / UPI / Card</p>
              <p><strong>Contact:</strong> ${
                template.company_email || "support@creahubflow.com"
              }</p>
            </div>
          </div>
          
          <div class="footer">
            <p>${
              template.footer_text ||
              "Thank you for choosing our design services!"
            }</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Track active tab to mark messages/files as read when tabs are viewed
  const [activeTab, setActiveTab] = useState(defaultTab);
  useEffect(() => {
    // When chat tab becomes active, mark messages as read
    if (activeTab === "chat" && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      setLastReadMessageTime(lastMessage.created_at);
      setUnreadMessageCount(0);
    }
  }, [activeTab, messages]);

  // Sync local state with props when they change
  useEffect(() => {
    setNewRate(rate);
  }, [rate]);

  useEffect(() => {
    setNewMultiplier(formatMultiplier);
  }, [formatMultiplier]);

  return (
    <>
      {/* Sidebar Toggle Button */}
      {/* {!mobileMode && (
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="fixed top-1/2 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-200"
          title={showSidebar ? "Hide Sidebar" : "Show Sidebar"}
        >
          {showSidebar ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          )}
        </button>
      )} */}

      {/* Sidebar */}
      {showSidebar && (
        <div
          className={
            mobileMode
              ? "w-full bg-white flex flex-col h-full"
              : "w-[380px] bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden"
          }
        >
          <Tabs
            defaultValue={defaultTab}
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col h-full min-h-0"
          >
            {!mobileMode && (
              <div className="shrink-0">
                <TabsList className="grid w-full grid-cols-2 h-10" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                  <TabsTrigger
                    value="billing"
                    className="text-xs sm:text-sm px-1 sm:px-3"
                  >
                    Billing
                  </TabsTrigger>
                  <TabsTrigger
                    value="chat"
                    className="text-xs sm:text-sm px-1 sm:px-3 relative"
                  >
                    Chat
                    {unreadMessageCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
            )}

            <TabsContent
              value="billing"
              className="flex-1 p-2 sm:p-4 space-y-3 sm:space-y-4 min-h-0"
            >
              <Card className="h-full min-h-[20rem] flex flex-col min-h-">
                <CardHeader className="pb-2 sm:pb-3 shrink-0">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    ₹ Session Billing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto min-h-0">
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 truncate">Designer:</span>
                      <span className="font-medium truncate ml-2">
                        {designerName}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 truncate">Customer:</span>
                      <span className="font-medium truncate ml-2">
                        {customerName}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {Math.floor(duration / 60)}:
                        {(duration % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Rate per minute:</span>
                      <span>₹{Math.round(rate).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Format Multiplier:</span>
                      <span>{formatMultiplier}x</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium text-xs sm:text-sm">
                      <span>Subtotal:</span>
                      <span>
                        ₹
                        {Math.round(
                          Math.ceil(duration / 60) *
                          rate *
                          formatMultiplier
                        ).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>GST (18%):</span>
                      <span>
                        ₹
                        {Math.round(
                          Math.ceil(duration / 60) *
                          rate *
                          formatMultiplier *
                          0.18
                        ).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-sm sm:text-lg">
                      <span>Total:</span>
                      <span>
                        ₹
                        {Math.round(
                          Math.ceil(duration / 60) *
                          rate *
                          formatMultiplier *
                          1.18
                        ).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Files tab removed */}

            <TabsContent
              value="chat"
              className="flex-1 p-2 sm:p-4 flex flex-col min-h-0"
            >
              <Card className="flex-1 flex flex-col h-full min-h-0">
                <CardHeader className="pb-2 sm:pb-3 shrink-0">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                    <span>Session Chat</span>
                    {unreadMessageCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {unreadMessageCount} new
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <ScrollArea className="flex-1 mb-2 sm:mb-3 min-h-0 max-h-[300px] sm:max-h-[400px]">
                    <div className="space-y-2 p-2">
                      {messages.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg
                              className="w-6 h-6 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500">
                            No messages yet
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Start the conversation below
                          </p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-3 rounded-lg text-xs sm:text-sm ${
                              message.sender_type ===
                              (isDesigner ? "designer" : "customer")
                                ? "bg-blue-100 ml-4 sm:ml-8 border-l-2 border-blue-300"
                                : "bg-gray-100 mr-4 sm:mr-8 border-l-2 border-gray-300"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-700 text-xs">
                                {message.sender_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  message.created_at
                                ).toLocaleTimeString()}
                              </span>
                            </div>
                            {message.file_url ? (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
                                  <File className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-800 truncate">
                                      {message.file_name || "File"}
                                    </p>
                                    {message.file_size && (
                                      <p className="text-xs text-gray-500">
                                        {formatFileSize(message.file_size)}
                                        {message.is_watermarked && (
                                          <span className="ml-1 text-orange-600">(Watermarked)</span>
                                        )}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => {
                                      const link = document.createElement("a");
                                      link.href = message.file_url!;
                                      link.download = message.file_name || "file";
                                      link.target = "_blank";
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                                {message.content && message.content.trim() !== `📎 ${message.file_name || ""}` && (
                                  <p className="break-words text-gray-800 text-xs">
                                    {message.content}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="break-words text-gray-800">
                                {message.content}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="flex space-x-2 shrink-0 items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 hover:bg-gray-100"
                      title="Attach file"
                    >
                      {isUploading ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <Paperclip className="h-4 w-4 text-gray-600" />
                      )}
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1 text-xs sm:text-sm"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Send</span>
                      <span className="sm:hidden">→</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Review tab removed */}

            {/* Invoice tab removed */}
          </Tabs>

          {/* Work Review Dialog removed */}
        </div>
      )}

      {/* Rate Change Approval Dialog */}
      {showRateApprovalDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Rate Change Request</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                The designer is requesting to change the session rate:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    New Rate:
                  </span>
                  <span className="font-bold text-lg">
                    ₹{pendingRateChange}/min
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>⚠️ This will affect the total session cost.</p>
                <p>Do you approve this change?</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handleRateApproval(false)}
                className="px-4 py-2"
              >
                Decline
              </Button>
              <Button
                onClick={() => handleRateApproval(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
              >
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Format Multiplier Approval Dialog */}
      {showMultiplierApprovalDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Format Multiplier Change Request
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                The designer is requesting to change the format multiplier:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    New Multiplier:
                  </span>
                  <span className="font-bold text-lg">
                    {pendingMultiplierChange}x
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>⚠️ This will affect the pricing for files in this format.</p>
                <p>Do you approve this change?</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handleMultiplierApproval(false)}
                className="px-4 py-2"
              >
                Decline
              </Button>
              <Button
                onClick={() => handleMultiplierApproval(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
              >
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
