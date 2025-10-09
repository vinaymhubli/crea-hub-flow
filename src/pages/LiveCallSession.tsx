import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AgoraCall from "@/components/AgoraCall";
import { ScreenShareModal } from "@/components/ScreenShareModal";
import SessionSidePanel from "@/components/SessionSidePanel";
import SessionApprovalDialog from "@/components/SessionApprovalDialog";
import SessionPaymentDialog from "@/components/SessionPaymentDialog";
import PaymentCompletionNotification from "@/components/PaymentCompletionNotification";
import FileUploadWaitingDialog from "@/components/FileUploadWaitingDialog";
import FileDownloadNotification from "@/components/FileDownloadNotification";
import SessionRatingDialog from "@/components/SessionRatingDialog";
import DesignerFileUploadDialog from "@/components/DesignerFileUploadDialog";
import { toast } from "sonner";

export default function LiveCallSession() {
  const { sessionId: sessionIdWithPrefix = "" } = useParams();
  const sessionId = sessionIdWithPrefix.startsWith("live_")
    ? sessionIdWithPrefix.slice(5)
    : sessionIdWithPrefix;
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const isDesigner = profile?.user_type === "designer";

  const [showScreenShare, setShowScreenShare] = useState(false);
  const [designerName, setDesignerName] = useState<string>("Designer");
  const [customerName, setCustomerName] = useState<string>("Customer");
  const [bothJoined, setBothJoined] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(0); // Start with 0, will be loaded from database
  const [formatMultiplier, setFormatMultiplier] = useState(1);
  const [screenShareNotification, setScreenShareNotification] = useState<
    string | null
  >(null);
  const [customerBalance, setCustomerBalance] = useState(0);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);
  const agoraCallRef = useRef<any>(null);
  const [bookingData, setBookingData] = useState<{
    id: string;
    customer_id: string;
    customer: {
      first_name: string;
      last_name: string;
      id?: string;
      user_id?: string;
    };
    designer: {
      hourly_rate: number;
      user: { first_name: string; last_name: string };
    };
  } | null>(null);

  // Enhanced session flow state
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPaymentCompletionNotification, setShowPaymentCompletionNotification] = useState(false);
  const [showFileUploadWaiting, setShowFileUploadWaiting] = useState(false);
  const [showFileDownloadNotification, setShowFileDownloadNotification] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showDesignerFileUpload, setShowDesignerFileUpload] = useState(false);
  const [sessionApprovalRequest, setSessionApprovalRequest] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<{url: string, name: string} | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  
  // Rate and multiplier approval dialogs
  const [showRateApprovalDialog, setShowRateApprovalDialog] = useState(false);
  const [showMultiplierApprovalDialog, setShowMultiplierApprovalDialog] = useState(false);
  const [pendingRateChange, setPendingRateChange] = useState<number | null>(null);
  const [pendingMultiplierChange, setPendingMultiplierChange] = useState<number | null>(null);
  const [pendingFileFormat, setPendingFileFormat] = useState<string>('');
  
  // Persist timer across refreshes
  const timerStorageKey = useMemo(() => `live_timer_${sessionId}`, [sessionId]);

  // Broadcast helper
  const channel = useMemo(
    () => supabase.channel(`session_control_${sessionId}`),
    [sessionId]
  );

  // Load session data on component mount
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        const sessionIdWithPrefix = sessionId.includes("live_") ? sessionId : `live_${sessionId}`;
        const { data: activeSessionData, error: sessionError } = await supabase
          .from('active_sessions')
          .select('*')
          .eq('session_id', sessionIdWithPrefix)
          .single();

        if (sessionError) {
          console.error('Error loading session data:', sessionError);
        } else {
          console.log('📊 Loaded session data:', activeSessionData);
          setSessionData(activeSessionData);
          // Initialize duration from started_at to keep timer consistent across refresh
          if ((activeSessionData as any)?.started_at) {
            const startedMs = new Date((activeSessionData as any).started_at).getTime();
            const elapsed = Math.max(0, Math.floor((Date.now() - startedMs) / 1000));
            setDuration(elapsed);
          }
        }
      } catch (error) {
        console.error('Error in loadSessionData:', error);
      }
    };

    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  useEffect(() => {
    const sub = channel
      .on("broadcast", { event: "session_start" }, (payload) => {
        setIsPaused(false);
      })
      .on("broadcast", { event: "session_pause" }, () => setIsPaused(true))
      .on("broadcast", { event: "session_resume" }, () => setIsPaused(false))
      .on("broadcast", { event: "pricing_change" }, (p) =>
        setRate(p.payload.newRate)
      )
      .on("broadcast", { event: "multiplier_change" }, (p) =>
        setFormatMultiplier(p.payload.newMultiplier)
      )
      .on("broadcast", { event: "rate_change_request" }, (p) => {
        console.log("📡 Customer received rate change request:", p.payload);
        console.log("📡 Is designer:", isDesigner);
        if (!isDesigner) {
          console.log("📡 Setting rate approval dialog for customer");
          setPendingRateChange(p.payload.newRate);
          setShowRateApprovalDialog(true);
        }
      })
      .on("broadcast", { event: "multiplier_change_request" }, (p) => {
        console.log("📡 ===== MULTIPLIER CHANGE REQUEST RECEIVED =====");
        console.log("📡 Full payload object:", p);
        console.log("📡 Payload data:", p.payload);
        console.log("📡 isDesigner check:", isDesigner);
        console.log("📡 newMultiplier value:", p.payload?.newMultiplier);
        console.log("📡 fileFormat value:", p.payload?.fileFormat);
        console.log("📡 requestedBy value:", p.payload?.requestedBy);
        
        if (!isDesigner) {
          console.log("✅ Customer confirmed - showing dialog");
          console.log("📡 Setting pendingMultiplierChange to:", p.payload.newMultiplier);
          setPendingMultiplierChange(p.payload.newMultiplier);
          console.log("📡 Setting pendingFileFormat to:", p.payload.fileFormat);
          setPendingFileFormat(p.payload.fileFormat || '');
          console.log("📡 Setting showMultiplierApprovalDialog to: true");
          setShowMultiplierApprovalDialog(true);
          console.log("✅ State updated, dialog should appear");
          toast.info(`Designer ${p.payload.requestedBy} is requesting to change format multiplier for ${p.payload.fileFormat} to ${p.payload.newMultiplier}x. Please approve.`);
        } else {
          console.log("⚠️ Received on designer side, ignoring (isDesigner=true)");
        }
      })
      .on("broadcast", { event: "rate_change_response" }, (p) => {
        console.log("📡 Designer received rate change response:", p.payload);
        if (isDesigner) {
          if (p.payload.approved) {
            toast.success(`Rate change approved by ${p.payload.respondedBy}`);
          } else {
            toast.error(`Rate change declined by ${p.payload.respondedBy}`);
          }
        }
      })
      .on("broadcast", { event: "multiplier_change_response" }, (p) => {
        console.log("📡 Designer received multiplier change response:", p.payload);
        if (isDesigner) {
          if (p.payload.approved) {
            toast.success(`Format multiplier change approved by ${p.payload.respondedBy}`);
          } else {
            toast.error(`Format multiplier change declined by ${p.payload.respondedBy}`);
          }
        }
      })
      .on("broadcast", { event: "timer_sync" }, (p) => {
        if (!isDesigner) setDuration(p.payload.duration);
      })
      .on("broadcast", { event: "session_start" }, (payload) => {
        console.log("📡 Customer received session_start event");
        // Customer should start billing when session starts
        if (!isDesigner) {
          console.log("💰 Customer starting billing - rate:", rate);
        }
      })
      .on("broadcast", { event: "screen_share_started" }, (p) => {
        setScreenShareNotification(
          `${p.payload.userName} started screen sharing`
        );
        setTimeout(() => setScreenShareNotification(null), 3000);
        // Pause timer while someone is presenting
        setIsPaused(true);
      })
      .on("broadcast", { event: "screen_share_stopped" }, (p) => {
        setScreenShareNotification(
          `${p.payload.userName} stopped screen sharing`
        );
        setTimeout(() => setScreenShareNotification(null), 3000);
        // Ensure UI reflects that no one is presenting and resume timer on both sides
        setIsPaused(false);
        // Designer drives timer sync when unpaused
        if (isDesigner) {
          channel.send({ type: "broadcast", event: "session_resume", payload: {} });
        }
      })
       .on("broadcast", { event: "session_end" }, async (p) => {
         console.log("📡 Customer received session_end event:", p.payload);
         // Customer should stop media and redirect when designer ends session
         if (!isDesigner) {
           console.log("🛑 Customer stopping media due to session end by designer");
           // Stop all media first
           if (agoraCallRef.current) {
             try {
               await agoraCallRef.current.leave();
               console.log("✅ Customer media tracks stopped");
             } catch (error) {
               console.error("❌ Error stopping customer media tracks:", error);
             }
           }
           console.log("🔄 Customer redirecting due to session end by designer");
           navigate("/customer-dashboard");
         }
       })
       .on("broadcast", { event: "request_current_values" }, (p) => {
         console.log("📡 Designer received request for current values:", p.payload);
         // Designer should respond with current rate and multiplier
         if (isDesigner) {
           // Send current rate
           if (rate > 0) {
             channel.send({
               type: "broadcast",
               event: "pricing_change",
               payload: {
                 newRate: rate,
                 changedBy: designerName,
               },
             });
             console.log("💰 Designer responding with current rate:", rate);
           }
           
           // Send current format multiplier
           if (formatMultiplier > 0) {
             channel.send({
               type: "broadcast",
               event: "multiplier_change",
               payload: {
                 newMultiplier: formatMultiplier,
                 changedBy: designerName,
               },
             });
             console.log("📊 Designer responding with current format multiplier:", formatMultiplier);
           }
          // Also sync current timer immediately so refreshed clients align instantly
          channel.send({
            type: "broadcast",
            event: "timer_sync",
            payload: { duration },
          });
          console.log("⏱️ Designer responded with current duration:", duration);
         }
       })
       .on("broadcast", { event: "session_approval_request" }, (p) => {
         console.log("📡 Customer received session approval request:", p.payload);
         if (!isDesigner) {
           setShowApprovalDialog(true);
         }
       })
       .on("broadcast", { event: "payment_completed" }, (p) => {
         console.log("📡 Designer received payment completion notification:", p.payload);
         console.log("📡 Is designer:", isDesigner);
         if (isDesigner) {
           console.log("📡 Setting showPaymentCompletionNotification to true");
           setShowPaymentCompletionNotification(true);
         }
       })
       .on("broadcast", { event: "file_uploaded" }, (p) => {
         console.log("📡 Customer received file upload notification:", p.payload);
         if (!isDesigner) {
           setUploadedFile({ url: p.payload.fileUrl, name: p.payload.fileName });
         }
       })
       .on("broadcast", { event: "file_downloaded" }, (p) => {
         console.log("📡 Designer received file download notification:", p.payload);
         if (isDesigner) {
           setShowFileDownloadNotification(true);
         }
       })
       .on("broadcast", { event: "rating_completed" }, (p) => {
         console.log("📡 Designer received rating completion notification:", p.payload);
         if (isDesigner) {
           // Session is now fully complete
           toast.success("Session completed successfully!");
           setTimeout(() => {
             navigate("/designer-dashboard");
           }, 2000);
         }
       })
       .on("broadcast", { event: "session_complete_show_review" }, (p) => {
         console.log("📡 Customer received session complete notification:", p.payload);
         if (!isDesigner) {
           // Store review data in localStorage to show on dashboard redirect
           localStorage.setItem('pendingReview', JSON.stringify({
             designerName: p.payload.designerName,
             designerId: p.payload.designerId,
             sessionId: p.payload.sessionId,
             timestamp: new Date().toISOString()
           }));
           
           // Redirect customer to dashboard immediately
           console.log("📡 Redirecting customer to dashboard with review data");
           setTimeout(() => {
             navigate("/customer-dashboard");
           }, 1000);
         }
       })
       .on("broadcast", { event: "session_ended" }, (p) => {
         console.log("📡 Session ended notification received:", p.payload);
         if (!isDesigner) {
           // Don't show rating dialog here anymore - will show on dashboard
           console.log("📡 Session ended, customer will see review on dashboard");
         }
       })
       .on("broadcast", { event: "screen_share_started" }, (p) => {
         console.log("📡 ===== RECEIVED SCREEN_SHARE_STARTED BROADCAST =====");
         console.log("📡 Payload:", p.payload);
         console.log("📡 userName:", p.payload?.userName);
         console.log("📡 Current isDesigner:", isDesigner);
         console.log("📡 Setting remoteScreenSharing to TRUE");
         setRemoteScreenSharing(true);
         console.log("✅ remoteScreenSharing state updated to TRUE");
       })
       .on("broadcast", { event: "screen_share_stopped" }, (p) => {
         console.log("📡 ===== RECEIVED SCREEN_SHARE_STOPPED BROADCAST =====");
         console.log("📡 Payload:", p.payload);
         console.log("📡 userName:", p.payload?.userName);
         console.log("📡 Current isDesigner:", isDesigner);
         console.log("📡 Screen share stopped broadcast received - AgoraCall will handle state update");
         // Don't set remoteScreenSharing here - let AgoraCall detect and call handleRemoteScreenShareStopped
       })
       .on("broadcast", { event: "screen_share_request" }, (p) => {
         console.log("📡 Screen share request notification:", p.payload);
         toast.info(p.payload.message);
       })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channel, isDesigner]);

  // Timer - sync duration across both sides
  useEffect(() => {
    if (!bothJoined || isPaused) return;
    const t = setInterval(() => {
      setDuration((d) => {
        const newDuration = d + 1;
        // Sync every second for exact ticking parity
        if (isDesigner) {
          channel.send({
            type: "broadcast",
            event: "timer_sync",
            payload: { duration: newDuration },
          });
        }
        // Persist locally so refresh restores immediately
        try {
          localStorage.setItem(timerStorageKey, String(newDuration));
        } catch {}
        return newDuration;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [bothJoined, isPaused, isDesigner, channel, timerStorageKey]);

  // On mount, attempt to restore from localStorage first for instant continuity
  useEffect(() => {
    const saved = localStorage.getItem(timerStorageKey);
    if (saved && !Number.isNaN(Number(saved))) {
      setDuration(Number(saved));
    }
  }, [timerStorageKey]);

  // Stable profile values to prevent infinite re-renders
  const profileFirstName = profile?.first_name;
  const profileLastName = profile?.last_name;

  useEffect(() => {
    // Always use explicit lookups matching your DB mapping rules
    const loadNames = async () => {
      try {
        console.log("🔍 Loading names for sessionId:", sessionId);
        
        // Ensure sessionId has proper prefix for database lookup
        const sessionIdWithPrefix = sessionId.includes("live_") ? sessionId : `live_${sessionId}`;
        console.log("🔍 Using sessionId with prefix:", sessionIdWithPrefix);

        // 1) Get ids from active_sessions
        const { data: basicSessionData, error: sessErr } = await supabase
          .from("active_sessions")
          .select("customer_id, designer_id")
          .eq("session_id", sessionIdWithPrefix)
          .single();
        if (sessErr || !basicSessionData) {
          console.error("❌ Could not load active_sessions row:", sessErr);
          console.log("❌ Session data:", basicSessionData);
          return;
        }

        console.log("✅ Found session data:", basicSessionData);

        // 2) Customer name: profiles.user_id = active_sessions.customer_id
        if ((basicSessionData as any)?.customer_id) {
          console.log("🔍 Loading customer profile for ID:", (basicSessionData as any).customer_id);
          const { data: customerProfile, error: customerError } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("user_id", (basicSessionData as any).customer_id)
            .single();
          
          if (customerError) {
            console.error("❌ Error loading customer profile:", customerError);
          } else if (customerProfile) {
            const customerFullName = `${customerProfile.first_name || ""} ${customerProfile.last_name || ""}`.trim();
            if (customerFullName) {
              setCustomerName(customerFullName);
              console.log("✅ Customer name set to:", customerFullName);
            } else {
              console.log("⚠️ Customer profile found but name is empty");
            }
          } else {
            console.log("⚠️ No customer profile found");
          }
        }

        // 3) Designer name: designers.id = active_sessions.designer_id → designers.user_id → profiles.user_id
        if ((basicSessionData as any)?.designer_id) {
          console.log("🔍 Loading designer profile for designer ID:", (basicSessionData as any).designer_id);
          const { data: designerRow, error: designerRowError } = await supabase
            .from("designers")
            .select("user_id")
            .eq("id", (basicSessionData as any).designer_id)
            .single();
          
          if (designerRowError) {
            console.error("❌ Error loading designer row:", designerRowError);
          } else if (designerRow?.user_id) {
            console.log("🔍 Loading designer profile for user ID:", designerRow.user_id);
            const { data: designerProfile, error: designerProfileError } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("user_id", designerRow.user_id)
              .single();
            
            if (designerProfileError) {
              console.error("❌ Error loading designer profile:", designerProfileError);
            } else if (designerProfile) {
              const designerFullName = `${designerProfile.first_name || ""} ${designerProfile.last_name || ""}`.trim();
              if (designerFullName) {
                setDesignerName(designerFullName);
                console.log("✅ Designer name set to:", designerFullName);
              } else {
                console.log("⚠️ Designer profile found but name is empty");
              }
            } else {
              console.log("⚠️ No designer profile found");
            }
          } else {
            console.log("⚠️ No designer row found or missing user_id");
          }
        }
      } catch (error) {
        console.error("❌ Error in loadNames:", error);
      }
    };

    if (sessionId) loadNames();
  }, [sessionId]);

  // Load booking data - EXACT copy from ScreenShare
  const loadBookingData = async () => {
    try {
      // Get booking_id from active_sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from("active_sessions" as any)
        .select("booking_id")
        .eq("session_id", sessionId)
        .single();

      if (sessionError || !(sessionData as any)?.booking_id) {
        console.log("No booking_id found, loading current user data");
        loadCurrentUserData();
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          customer:profiles!customer_id(first_name, last_name),
          designer:designers!designer_id(
            hourly_rate,
            user:profiles!user_id(first_name, last_name)
          )
        `
        )
        .eq("id", (sessionData as any).booking_id)
        .single();

      if (error) throw error;

      setBookingData(data);
      if (data.designer?.hourly_rate) {
        setRate(data.designer.hourly_rate); // Rate is already per minute
        console.log(
          "💰 Loaded rate from booking:",
          data.designer.hourly_rate,
          "per minute"
        );
      } else {
        // Set default rate if no rate found in booking
        setRate(5.0);
        console.log("💰 Using default rate from booking: 5.0 per minute");
      }
      setCustomerBalance(0);
    } catch (error) {
      console.error("Error loading booking data:", error);
      loadCurrentUserData();
    }
  };

  const loadCurrentUserData = async () => {
    try {
      if (isDesigner && user?.id) {
        const { data: designerData, error: designerError } = await supabase
          .from("designers")
          .select("hourly_rate")
          .eq("user_id", user.id)
          .single();

        if (!designerError && designerData?.hourly_rate) {
          setRate(designerData.hourly_rate);
          console.log(
            "💰 Loaded designer rate from user data:",
            designerData.hourly_rate,
            "per minute"
          );
        } else {
          // Set default rate for designer if no rate found
          setRate(5.0);
          console.log("💰 Using default rate for designer: 5.0 per minute");
        }
      } else if (!isDesigner) {
        // Customer should wait for rate from designer, but set a default
        setRate(5.0);
        console.log("💰 Customer using default rate: 5.0 per minute");
      }
      setCustomerBalance(0);
    } catch (error) {
      console.error("Error loading current user data:", error);
      // Set default rate on error
      setRate(5.0);
    }
  };

  // Load booking data on mount
  useEffect(() => {
    if (sessionId) {
      loadBookingData();
    }
  }, [sessionId, isDesigner, user?.id]);

  // Broadcast initial values when rate is loaded and both users are joined
  useEffect(() => {
    if (bothJoined && isDesigner && rate > 0) {
      console.log("💰 Rate loaded, broadcasting initial values:", rate);
      
      // Add a small delay to ensure the rate is fully set
      const timeoutId = setTimeout(() => {
        // Broadcast current rate
        channel.send({
          type: "broadcast",
          event: "pricing_change",
          payload: {
            newRate: rate,
            changedBy: designerName,
          },
        });
        
        // Broadcast current format multiplier
        if (formatMultiplier > 0) {
          channel.send({
            type: "broadcast",
            event: "multiplier_change",
            payload: {
              newMultiplier: formatMultiplier,
              changedBy: designerName,
            },
          });
          console.log("📊 Broadcasting initial format multiplier:", formatMultiplier);
        }
      }, 500); // 500ms delay to ensure rate is loaded
      
      return () => clearTimeout(timeoutId);
    }
  }, [bothJoined, isDesigner, rate, formatMultiplier, channel, designerName]);

  const handleEndByDesigner = async () => {
    console.log("🛑 STOP & SEND REQUEST APPROVAL - Starting enhanced session flow...");

    // Calculate total amount
    const durationMinutes = Math.ceil(duration / 60);
    const ratePerMinute = rate || 5.0;
    const subtotal = durationMinutes * ratePerMinute * formatMultiplier;
    const gstAmount = subtotal * 0.18;
    const totalAmount = subtotal + gstAmount;

    try {
      // Get customer_id from active_sessions table
      const sessionIdWithPrefix = sessionId.includes("live_") ? sessionId : `live_${sessionId}`;
      const { data: sessionData, error: sessionError } = await supabase
        .from('active_sessions')
        .select('customer_id')
        .eq('session_id', sessionIdWithPrefix)
        .single();

      if (sessionError || !sessionData?.customer_id) {
        console.error('Error getting customer_id from active_sessions:', sessionError);
        console.error('SessionId used:', sessionIdWithPrefix);
        console.error('SessionData:', sessionData);
        toast.error('Failed to get session data');
        return;
      }

      console.log('Found customer_id:', sessionData.customer_id);

      // Create session approval request
      const { data: approvalRequest, error: approvalError } = await (supabase as any)
        .from('session_approval_requests')
        .insert({
          session_id: sessionIdWithPrefix,
          designer_id: user?.id,
          customer_id: sessionData.customer_id,
          status: 'pending',
          total_amount: totalAmount
        })
        .select()
        .single();

      if (approvalError) {
        console.error('Error creating approval request:', approvalError);
        console.error('Approval request data:', {
          session_id: sessionIdWithPrefix,
          designer_id: user?.id,
          customer_id: sessionData.customer_id,
          status: 'pending',
          total_amount: totalAmount
        });
        toast.error('Failed to create approval request');
        return;
      }

      setSessionApprovalRequest(approvalRequest);

      // Pause the session
      setIsPaused(true);
      channel.send({
        type: "broadcast",
        event: "session_pause",
        payload: {},
      });

      // Send approval request to customer
      channel.send({
        type: "broadcast",
        event: "session_approval_request",
        payload: {
          sessionId,
          designerName,
          totalAmount,
          duration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
          approvalRequestId: approvalRequest.id
        },
      });

      toast.success("Approval request sent to customer");
    } catch (error) {
      console.error('Error in approval request:', error);
      toast.error('Failed to send approval request');
    }
  };

  const handleLocalJoined = () => {
    console.log("🎯 Local user joined, setting bothJoined to true");
    setBothJoined(true);
    
    // If customer joins, request current values from designer
    if (!isDesigner) {
      channel.send({
        type: "broadcast",
        event: "request_current_values",
        payload: {
          requestedBy: customerName,
        },
      });
      console.log("📡 Customer requesting current rate and multiplier values");
    }
  };
  const handleRemoteJoined = () => {
    setBothJoined(true);
    // start session broadcast by designer only
    if (isDesigner) {
      channel.send({
        type: "broadcast",
        event: "session_start",
        payload: { started_at: new Date().toISOString() },
      });
    }
  };
  const handleRemoteLeft = () => {
    setBothJoined(false);
  };

  // Stable callback functions to prevent SessionSidePanel re-renders
  const handlePauseSession = useCallback(async () => {
    setIsPaused(true);
    if (isDesigner) {
      channel.send({ type: "broadcast", event: "session_pause", payload: {} });
    }
  }, [isDesigner, channel]);

  const handleResumeSession = useCallback(async () => {
    setIsPaused(false);
    if (isDesigner) {
      channel.send({ type: "broadcast", event: "session_resume", payload: {} });
    }
  }, [isDesigner, channel]);

  const handleScreenShareStarted = useCallback(() => {
    console.log("🖥️ ===== SCREEN SHARE STARTED HANDLER CALLED =====");
    const userName = isDesigner ? designerName : customerName;
    console.log("🖥️ Broadcasting screen_share_started by:", userName);
    console.log("🖥️ isDesigner:", isDesigner);
    
    channel.send({
      type: "broadcast",
      event: "screen_share_started",
      payload: { userName },
    });
    console.log("✅ screen_share_started broadcast sent");
  }, [channel, isDesigner, designerName, customerName]);

  const handleScreenShareStopped = useCallback(() => {
    console.log("🖥️ ===== SCREEN SHARE STOPPED HANDLER CALLED =====");
    const userName = isDesigner ? designerName : customerName;
    console.log("🖥️ Broadcasting screen_share_stopped by:", userName);
    console.log("🖥️ isDesigner:", isDesigner);
    
    channel.send({
      type: "broadcast",
      event: "screen_share_stopped",
      payload: { userName },
    });
    console.log("✅ screen_share_stopped broadcast sent");
    // Also resume timer locally after sharing stops
    setIsPaused(false);
  }, [channel, isDesigner, designerName, customerName]);

  const handleRemoteScreenShareStopped = useCallback(() => {
    console.log("🖥️ ===== REMOTE SCREEN SHARE STOPPED HANDLER CALLED =====");
    // For remote screen share stop, we don't broadcast - the remote user already broadcasted
    // We just need to update local UI state
    console.log("🖥️ Remote user stopped screen sharing, updating local UI");
    setRemoteScreenSharing(false);
    setIsPaused(false); // Resume timer when remote screen sharing stops
    console.log("⏱️ Timer resumed after remote screen sharing stopped");
  }, []);

  const handleScreenShareRequest = useCallback(() => {
    const userName = isDesigner ? designerName : customerName;
    const otherUserName = isDesigner ? customerName : designerName;
    
    // Show notification to the other user
    channel.send({
      type: "broadcast",
      event: "screen_share_request",
      payload: { 
        userName,
        otherUserName,
        message: `${userName} wants to share their screen. Please stop your screen sharing first.`
      },
    });
    
    // Show local notification
    toast.info(`Please ask ${otherUserName} to stop screen sharing first`);
  }, [channel, isDesigner, designerName, customerName]);

  const handleRateChange = useCallback(
    (newRate: number) => {
      console.log("💰 Rate change requested:", newRate);
      
      if (isDesigner) {
        // Designer is requesting rate change - broadcast to customer for approval
        console.log("🎯 Designer sending rate change request:", { newRate, designerName });
        channel.send({
          type: "broadcast",
          event: "rate_change_request",
          payload: {
            newRate: newRate,
            requestedBy: designerName,
          },
        });
        toast.info("Rate change request sent to customer for approval");
      } else {
        // Customer is changing rate - apply directly
        setRate(newRate);
        channel.send({
          type: "broadcast",
          event: "pricing_change",
          payload: {
            newRate: newRate,
            changedBy: customerName,
          },
        });
        toast.success(`Session rate updated to ₹${newRate}/min`);
      }
    },
    [channel, isDesigner, designerName, customerName]
  );

  const handleMultiplierChange = useCallback(
    (newMultiplier: number, fileFormat?: string) => {
      console.log("📊 ===== MULTIPLIER CHANGE HANDLER CALLED =====");
      console.log("📊 Multiplier change requested:", newMultiplier);
      console.log("📊 File format:", fileFormat);
      console.log("📊 isDesigner:", isDesigner);
      console.log("📊 designerName:", designerName);
      console.log("📊 customerName:", customerName);
      console.log("📊 channel exists:", !!channel);
      
      if (isDesigner) {
        // Designer is requesting multiplier change - broadcast to customer for approval
        console.log("🎯 Designer sending multiplier change request:", { newMultiplier, fileFormat, designerName });
        
        try {
          channel.send({
            type: "broadcast",
            event: "multiplier_change_request",
            payload: {
              newMultiplier: newMultiplier,
              fileFormat: fileFormat || '',
              requestedBy: designerName,
            },
          });
          console.log("✅ Broadcast sent successfully");
          toast.info("Format multiplier change request sent to customer for approval");
          console.log("✅ Toast shown");
        } catch (error) {
          console.error("❌ Error sending broadcast:", error);
          toast.error("Failed to send multiplier change request");
        }
      } else {
        // Customer is changing multiplier - apply directly
        console.log("👤 Customer applying multiplier change directly");
        setFormatMultiplier(newMultiplier);
        channel.send({
          type: "broadcast",
          event: "multiplier_change",
          payload: {
            newMultiplier: newMultiplier,
            fileFormat: fileFormat || '',
            changedBy: customerName,
          },
        });
        toast.success(`Format multiplier updated to ${newMultiplier}x`);
      }
    },
    [channel, isDesigner, designerName, customerName]
  );

  // Rate and multiplier approval handlers
  const handleRateApproval = (approved: boolean) => {
    if (approved && pendingRateChange !== null) {
      setRate(pendingRateChange);
      channel.send({
        type: "broadcast",
        event: "pricing_change",
        payload: {
          newRate: pendingRateChange,
          changedBy: customerName,
        },
      });
      toast.success(`Session rate updated to ₹${pendingRateChange}/min`);
    } else {
      toast.info("Rate change request declined");
    }
    
    // Broadcast approval result to designer
    channel.send({
      type: "broadcast",
      event: "rate_change_response",
      payload: {
        approved: approved,
        newRate: pendingRateChange,
        respondedBy: customerName,
      },
    });
    
    setShowRateApprovalDialog(false);
    setPendingRateChange(null);
  };

  const handleMultiplierApproval = (approved: boolean) => {
    if (approved && pendingMultiplierChange !== null) {
      setFormatMultiplier(pendingMultiplierChange);
      channel.send({
        type: "broadcast",
        event: "multiplier_change",
        payload: {
          newMultiplier: pendingMultiplierChange,
          changedBy: customerName,
        },
      });
      toast.success(`Format multiplier updated to ${pendingMultiplierChange}x`);
    } else {
      toast.info("Format multiplier change request declined");
    }
    
    // Broadcast approval result to designer
    channel.send({
      type: "broadcast",
      event: "multiplier_change_response",
      payload: {
        approved: approved,
        newMultiplier: pendingMultiplierChange,
        respondedBy: customerName,
      },
    });
    
    setShowMultiplierApprovalDialog(false);
    setPendingMultiplierChange(null);
  };

  // Enhanced session flow handlers
  const handleApprovalAccept = () => {
    setShowApprovalDialog(false);
    setShowPaymentDialog(true);
  };

  const handleApprovalContinue = () => {
    setShowApprovalDialog(false);
    setIsPaused(false);
    channel.send({
      type: "broadcast",
      event: "session_resume",
      payload: {},
    });
    toast.success("Session resumed");
  };

  const handlePaymentSuccess = () => {
    console.log('🎉 Payment success handler called');
    setShowPaymentDialog(false);
    
    // Update approval request status
    if (sessionApprovalRequest) {
      console.log('📝 Updating approval request status to payment_completed');
      (supabase as any)
        .from('session_approval_requests')
        .update({ 
          status: 'payment_completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionApprovalRequest.id);
    }

    // Notify designer
    console.log('📡 Sending payment_completed broadcast to designer');
    channel.send({
      type: "broadcast",
      event: "payment_completed",
      payload: {
        customerName,
        amount: sessionApprovalRequest?.total_amount || 0
      },
    });

    // Show waiting dialog for customer
    console.log('⏳ Setting showFileUploadWaiting to true for customer');
    console.log('⏳ Current showFileUploadWaiting state:', showFileUploadWaiting);
    setShowFileUploadWaiting(true);
    console.log('⏳ showFileUploadWaiting should now be true');
  };

  const handlePaymentCompletionOk = () => {
    console.log('🎯 Designer clicked OK to upload file');
    setShowPaymentCompletionNotification(false);
    // Show the file upload dialog for designer
    setShowDesignerFileUpload(true);
  };

  const handleFileReady = (fileUrl: string, fileName: string) => {
    setShowFileUploadWaiting(false);
    setUploadedFile({ url: fileUrl, name: fileName });
    
    // Update approval request status
    if (sessionApprovalRequest) {
      (supabase as any)
        .from('session_approval_requests')
        .update({ 
          status: 'file_uploaded',
          file_uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionApprovalRequest.id);
    }
  };

  const handleDesignerFileUploaded = (fileUrl: string, fileName: string) => {
    console.log('🎨 Designer uploaded file:', fileName);
    setShowDesignerFileUpload(false);
    // The file upload dialog will handle broadcasting to customer
  };

  const handleEndSession = async () => {
    console.log('🛑 Ending session after file upload');
    
    try {
      // Update session status to ended
      const sessionIdWithPrefix = sessionId.includes("live_") ? sessionId : `live_${sessionId}`;
      
      // Update active_sessions table
      const { error: sessionError } = await supabase
        .from('active_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('session_id', sessionIdWithPrefix);

      if (sessionError) {
        console.error('Error updating session status:', sessionError);
      }

      // Update session approval request status
      if (sessionApprovalRequest) {
        const { error: approvalError } = await (supabase as any)
          .from('session_approval_requests')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionApprovalRequest.id);

        if (approvalError) {
          console.error('Error updating approval request:', approvalError);
        }
      }

      // CRITICAL: Update bookings table to mark session as completed
      // This is what the session history and recent designers queries use
      if (bookingData) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingData.id);

        if (bookingError) {
          console.error('Error updating booking status:', bookingError);
        } else {
          console.log('✅ Booking marked as completed for session history');
        }
      }

      // Process session payment based on session duration and rate
      if (duration > 0 && rate > 0) {
        console.log('💰 Processing session payment...');
        console.log(`Duration: ${duration} seconds, Rate: ₹${rate}/min`);
        
        // Calculate payment amount: (duration in minutes) * rate per minute * format multiplier
        const sessionMinutes = Math.ceil(duration / 60);
        const sessionAmount = sessionMinutes * rate * formatMultiplier;
        
        console.log(`Session payment calculation: ${sessionMinutes} min × ₹${rate}/min × ${formatMultiplier} = ₹${sessionAmount}`);
        
        // Get session data for customer and designer IDs
        const { data: activeSession, error: activeSessionError } = await supabase
          .from('active_sessions')
          .select('customer_id, designer_id')
          .eq('session_id', sessionIdWithPrefix)
          .single();

        if (activeSessionError || !activeSession) {
          console.error('Error getting session data:', activeSessionError);
          toast.error("Session ended but payment processing failed");
        } else {
          try {
            const { data: paymentResult, error: paymentError } = await supabase.functions.invoke('process-session-payment', {
              body: {
                sessionId: sessionIdWithPrefix,
                customerId: activeSession.customer_id,
                designerId: activeSession.designer_id,
                amount: sessionAmount,
                sessionType: 'live_session',
                duration: duration, // Pass actual session duration in seconds
                bookingId: bookingData?.id || null
              }
            });

            if (paymentError) {
              console.error('Payment processing error:', paymentError);
              toast.error("Session ended but payment processing failed");
            } else {
              console.log('✅ Payment processed successfully:', paymentResult);
              toast.success("Session ended and payment processed!");
            }
          } catch (paymentErr) {
            console.error('Error calling payment function:', paymentErr);
            toast.error("Session ended but payment processing failed");
          }
        }
      } else {
        console.log('No payment processing needed - duration or rate is 0');
        toast.success("Session ended successfully!");
      }

      // Broadcast session ended to both users
      channel.send({
        type: "broadcast",
        event: "session_ended",
        payload: {
          message: "Session has been completed successfully"
        }
      });

      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        if (isDesigner) {
          navigate("/designer-dashboard");
        } else {
          navigate("/customer-dashboard");
        }
      }, 2000);

    } catch (error) {
      console.error('Error ending session:', error);
      toast.error("Failed to end session properly");
    }
  };

  const handleFileDownload = () => {
    if (uploadedFile) {
      // Create download link for background download
      const link = document.createElement('a');
      link.href = uploadedFile.url;
      link.download = uploadedFile.name;
      link.target = '_blank'; // Ensure download happens in background
      link.style.display = 'none'; // Hide the link element
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Notify designer
      channel.send({
        type: "broadcast",
        event: "file_downloaded",
        payload: {
          customerName,
          fileName: uploadedFile.name,
          downloadTime: new Date().toLocaleString()
        },
      });

      // Update approval request status
      if (sessionApprovalRequest) {
        (supabase as any)
          .from('session_approval_requests')
          .update({ 
            status: 'file_downloaded',
            file_downloaded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionApprovalRequest.id);
      }

      // Don't show rating dialog here anymore - will show after designer ends session
    }
  };

  const handleFileDownloadNotificationClose = () => {
    setShowFileDownloadNotification(false);
  };

  const handleSessionComplete = async () => {
    console.log('🎉 Designer clicked "Great! Session Complete"');
    setShowFileDownloadNotification(false);
    
    // Broadcast to customer to show review dialog on their redirect
    channel.send({
      type: "broadcast",
      event: "session_complete_show_review",
      payload: {
        designerName,
        designerId: sessionApprovalRequest?.designer_id,
        sessionId: sessionId
      }
    });
    
    // Update session status to ended
    await handleEndSession();
  };

  const handleRatingComplete = () => {
    setShowRatingDialog(false);
    
    // Update approval request status
    if (sessionApprovalRequest) {
      (supabase as any)
        .from('session_approval_requests')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionApprovalRequest.id);
    }

    // Notify designer
    channel.send({
      type: "broadcast",
      event: "rating_completed",
      payload: {
        customerName
      },
    });

    // End session for customer
    toast.success("Thank you for your feedback! Session completed.");
    setTimeout(() => {
      navigate("/customer-dashboard");
    }, 2000);
  };

  // Critical debugging: Track component lifecycle and auth state
  const userId = user?.id;
  const userType = profile?.user_type;
  useEffect(() => {
    console.log("🔥 LiveCallSession MOUNTED:", {
      sessionId,
      userId,
      isDesigner,
      loading,
      hasUser: !!user,
      userType,
    });
  }, [sessionId, userId, isDesigner, loading, user, userType]);

  // Wait for auth to load before rendering
  if (loading) {
    console.log("⏳ LiveCallSession: Auth still loading...");
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-lg">Loading session...</div>
      </div>
    );
  }

  if (!user || !sessionId) {
    console.error("❌ LiveCallSession: Missing user or sessionId", {
      user: !!user,
      sessionId,
      loading,
    });
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">
          Error: Missing user or session ID
        </div>
      </div>
    );
  }

  // Component is ready to render with stable props

  return (
    <div className="w-full h-screen flex">
      {/* Screen Share Notification */}
      {screenShareNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          {screenShareNotification}
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top status bar with timer - pause button commented out */}
        <div className="w-full flex items-center justify-end gap-3 px-3 py-2 border-b bg-white/80 backdrop-blur">
          <div className="text-sm font-medium tabular-nums">
            {Math.floor(duration / 60)}:
            {(duration % 60).toString().padStart(2, "0")}
          </div>
          {/* Pause button commented out - using bottom controls only */}
          {/* {isDesigner &&
            (isPaused ? (
              <button
                onClick={() => {
                  setIsPaused(false);
                  channel.send({
                    type: "broadcast",
                    event: "session_resume",
                    payload: {},
                  });
                }}
                className="px-3 py-1 text-xs rounded bg-emerald-600 text-white"
              >
                Resume
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsPaused(true);
                  channel.send({
                    type: "broadcast",
                    event: "session_pause",
                    payload: {},
                  });
                }}
                className="px-3 py-1 text-xs rounded bg-amber-600 text-white"
              >
                Pause
              </button>
            ))} */}
        </div>
        <AgoraCall
          ref={agoraCallRef}
          sessionId={sessionId}
          userId={user.id}
          isDesigner={!!isDesigner}
          onEndByDesigner={handleEndByDesigner}
          onLocalJoined={handleLocalJoined}
          onRemoteUserJoined={handleRemoteJoined}
          onRemoteUserLeft={handleRemoteLeft}
          onScreenShareStarted={handleScreenShareStarted}
          onScreenShareStopped={handleScreenShareStopped}
          onRemoteScreenShareStopped={handleRemoteScreenShareStopped}
          remoteScreenSharing={remoteScreenSharing}
          onScreenShareRequest={handleScreenShareRequest}
          isPaused={isPaused}
          onPauseSession={handlePauseSession}
          onResumeSession={handleResumeSession}
          onRateChange={handleRateChange}
          onMultiplierChange={handleMultiplierChange}
          currentRate={rate}
        />
        {/* Remove old screen share modal - using native Agora sharing */}
      </div>
      <SessionSidePanel
        sessionId={sessionId}
        designerName={designerName}
        customerName={customerName}
        isDesigner={!!isDesigner}
        duration={duration}
        rate={rate}
        balance={customerBalance}
        onPauseSession={handlePauseSession}
        onResumeSession={handleResumeSession}
        isPaused={isPaused}
        userId={user.id}
        onRateChange={handleRateChange}
        onMultiplierChange={handleMultiplierChange}
        formatMultiplier={formatMultiplier}
      />

      {/* Enhanced Session Flow Dialogs */}
      <SessionApprovalDialog
        isOpen={showApprovalDialog}
        onAccept={handleApprovalAccept}
        onContinue={handleApprovalContinue}
        designerName={designerName}
        sessionDuration={`${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`}
        totalAmount={sessionApprovalRequest?.total_amount || (Math.ceil(duration / 60) * rate * formatMultiplier * 1.18)}
      />

      <SessionPaymentDialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onPaymentSuccess={handlePaymentSuccess}
        totalAmount={sessionApprovalRequest?.total_amount || (Math.ceil(duration / 60) * rate * formatMultiplier * 1.18)}
        sessionId={sessionId}
        designerName={designerName}
        designerId={sessionApprovalRequest?.designer_id}
        actualDuration={duration}
      />

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
                  <span className="text-sm font-medium text-gray-600">New Rate:</span>
                  <span className="font-bold text-lg">₹{pendingRateChange}/min</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>⚠️ This will affect the total session cost.</p>
                <p>Do you approve this change?</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => handleRateApproval(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Decline
              </button>
              <button
                onClick={() => handleRateApproval(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Format Multiplier Approval Dialog */}
      {showMultiplierApprovalDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Format Multiplier Change Request</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                The designer is requesting to change the format multiplier:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                {pendingFileFormat && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">File Format:</span>
                    <span className="font-mono text-base font-semibold text-blue-600">{pendingFileFormat}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">New Multiplier:</span>
                  <span className="font-bold text-lg text-green-600">{pendingMultiplierChange}x</span>
                </div>
              </div>
              <div className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-medium text-amber-800">⚠️ Pricing Impact</p>
                <p className="mt-1">This will affect the pricing for <span className="font-mono font-semibold">{pendingFileFormat}</span> files.</p>
                <p className="mt-1">Current rate × {pendingMultiplierChange}x = Higher final cost</p>
              </div>
              <div className="text-sm text-gray-700">
                <p>Do you approve this change?</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => handleMultiplierApproval(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Decline
              </button>
              <button
                onClick={() => handleMultiplierApproval(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      <PaymentCompletionNotification
        isOpen={showPaymentCompletionNotification}
        onOk={handlePaymentCompletionOk}
        customerName={customerName}
        amount={sessionApprovalRequest?.total_amount || (Math.ceil(duration / 60) * rate * formatMultiplier * 1.18)}
      />

      <FileUploadWaitingDialog
        isOpen={showFileUploadWaiting}
        designerName={designerName}
        onFileReady={handleFileReady}
        sessionId={sessionId}
      />

      <FileDownloadNotification
        isOpen={showFileDownloadNotification}
        onClose={handleFileDownloadNotificationClose}
        onSessionComplete={handleSessionComplete}
        customerName={customerName}
        fileName={uploadedFile?.name || ''}
        downloadTime={new Date().toLocaleString()}
      />

      <SessionRatingDialog
        isOpen={showRatingDialog}
        onClose={() => setShowRatingDialog(false)}
        onRatingComplete={handleRatingComplete}
        designerName={designerName}
        sessionId={sessionId}
        customerId={user?.id || ''}
      />

      <DesignerFileUploadDialog
        isOpen={showDesignerFileUpload}
        onClose={() => setShowDesignerFileUpload(false)}
        onFileUploaded={handleDesignerFileUploaded}
        onEndSession={handleEndSession}
        sessionId={sessionId}
        designerName={designerName}
        customerName={customerName}
        designerId={sessionApprovalRequest?.designer_id}
        bookingId={sessionData?.booking_id}
      />

      {/* File Download Button for Customer */}
      {!isDesigner && uploadedFile && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={handleFileDownload}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download Final File</span>
          </button>
        </div>
      )}
    </div>
  );
}

