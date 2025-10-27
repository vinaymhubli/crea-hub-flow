-- Add missing notification types for real-time notification system
-- This migration adds the notification types needed for the real-time notification bell

-- Update the notifications table to include the new notification types
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'booking_confirmation', 'booking_update', 'message', 'payment', 'promotion', 'reminder',
    'complaint_received', 'complaint_resolved', 'complaint_updated',
    'file_approved', 'file_rejected', 'payment_received',
    'session_reminder', 'admin_message', 'system_alert',
    'invoice_generated', 'session_earnings', 'session_payment',
    'announcement', 'announcement_info', 'announcement_warning', 'announcement_success', 'announcement_error'
));

-- Add data column if it doesn't exist (for storing additional notification data)
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS data JSONB;

-- Add related_id column if it doesn't exist (for linking to related entities)
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS related_id UUID;

-- Create index for better performance on real-time queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON public.notifications(type);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
ON public.notifications(is_read);

-- Note: We don't need to update the existing functions for real-time notifications to work
-- The NotificationBell component uses direct table subscriptions, not these functions
