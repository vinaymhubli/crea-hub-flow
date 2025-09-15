-- Admin Management Features Migration
-- This migration adds support for:
-- 1. Admin view of all final files sent to customers
-- 2. Customer complaint system for designer files
-- 3. Enhanced transaction tracking for admin
-- 4. GST and platform fee management

-- Create customer_complaints table
CREATE TABLE IF NOT EXISTS public.customer_complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    designer_id UUID NOT NULL,
    file_id UUID REFERENCES public.session_files(id) ON DELETE CASCADE,
    complaint_type TEXT NOT NULL CHECK (complaint_type IN (
        'quality_issue', 'wrong_file', 'incomplete_work', 'late_delivery', 
        'communication_issue', 'other'
    )),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'under_review', 'resolved', 'rejected'
    )),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
        'low', 'medium', 'high', 'urgent'
    )),
    admin_notes TEXT,
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop and recreate platform_settings table to ensure correct structure
DROP TABLE IF EXISTS public.platform_settings CASCADE;

-- Create platform_settings table for GST and fees (without foreign key for now)
CREATE TABLE public.platform_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID
);

-- Add foreign key constraint if profiles table has the right structure
DO $$
BEGIN
    -- Check if profiles table has user_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.platform_settings 
        ADD CONSTRAINT fk_platform_settings_updated_by 
        FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id);
    END IF;
END $$;

-- Add missing columns to existing wallet_transactions table if they don't exist
ALTER TABLE public.wallet_transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Populate full_name column if it doesn't exist
UPDATE public.profiles 
SET full_name = CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) 
WHERE full_name IS NULL OR full_name = '';

-- Update the existing get_available_earnings function to work with our refund system
CREATE OR REPLACE FUNCTION public.get_available_earnings(user_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    COALESCE(
      (SELECT SUM(amount) FROM public.wallet_transactions 
       WHERE user_id = user_uuid 
         AND transaction_type = 'deposit' 
         AND status = 'completed'), 0.00
    ) - COALESCE(
      (SELECT SUM(amount) FROM public.wallet_transactions 
       WHERE user_id = user_uuid 
         AND transaction_type = 'withdrawal' 
         AND status = 'completed'), 0.00
    );
$$;

-- Create get_wallet_balance function
CREATE OR REPLACE FUNCTION public.get_wallet_balance(user_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.get_available_earnings(user_uuid);
$$;

-- Fix the is_admin function to use correct column reference
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    admin_status BOOLEAN;
BEGIN
    -- Try to get is_admin from id column first (since profiles.id = auth.users.id)
    SELECT is_admin INTO admin_status 
    FROM public.profiles 
    WHERE id = user_uuid;
    
    -- If not found, try user_id column
    IF admin_status IS NULL THEN
        SELECT is_admin INTO admin_status 
        FROM public.profiles 
        WHERE user_id = user_uuid;
    END IF;
    
    RETURN COALESCE(admin_status, FALSE);
END;
$function$;

-- Create admin_wallet table for platform earnings
CREATE TABLE IF NOT EXISTS public.admin_wallet (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'platform_fee', 'gst_collection', 'penalty_fee', 'refund_processing'
    )),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    reference_id UUID, -- References booking_id, session_id, etc.
    reference_type TEXT, -- 'booking', 'session', 'complaint', etc.
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_activity_log table for tracking all admin actions
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT, -- 'user', 'booking', 'complaint', 'file', etc.
    target_id UUID,
    description TEXT NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table for user notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'complaint_received', 'complaint_resolved', 'complaint_updated',
        'file_approved', 'file_rejected', 'payment_received',
        'session_reminder', 'admin_message', 'system_alert'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT, -- URL to navigate to when notification is clicked
    metadata JSONB, -- Additional data like complaint_id, file_id, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_complaints_session_id ON public.customer_complaints(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_customer_id ON public.customer_complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_designer_id ON public.customer_complaints(designer_id);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_status ON public.customer_complaints(status);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_priority ON public.customer_complaints(priority);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_created_at ON public.customer_complaints(created_at);

CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_active ON public.platform_settings(is_active);

CREATE INDEX IF NOT EXISTS idx_admin_wallet_transaction_type ON public.admin_wallet(transaction_type);
CREATE INDEX IF NOT EXISTS idx_admin_wallet_reference ON public.admin_wallet(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_admin_wallet_created_at ON public.admin_wallet(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON public.admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action_type ON public.admin_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_target ON public.admin_activity_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON public.admin_activity_log(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Enable RLS
ALTER TABLE public.customer_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_complaints
DROP POLICY IF EXISTS "Customers can view their own complaints" ON public.customer_complaints;
CREATE POLICY "Customers can view their own complaints" ON public.customer_complaints
FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Designers can view complaints about them" ON public.customer_complaints;
CREATE POLICY "Designers can view complaints about them" ON public.customer_complaints
FOR SELECT USING (auth.uid() = designer_id);

DROP POLICY IF EXISTS "Admins can view all complaints" ON public.customer_complaints;
CREATE POLICY "Admins can view all complaints" ON public.customer_complaints
FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Customers can create complaints" ON public.customer_complaints;
CREATE POLICY "Customers can create complaints" ON public.customer_complaints
FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Admins can update complaints" ON public.customer_complaints;
CREATE POLICY "Admins can update complaints" ON public.customer_complaints
FOR UPDATE USING (public.is_admin(auth.uid()));

-- RLS Policies for platform_settings
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings
FOR ALL USING (public.is_admin(auth.uid()));

-- Allow authenticated users to read platform settings (temporary for testing)
DROP POLICY IF EXISTS "Authenticated users can read platform settings" ON public.platform_settings;
CREATE POLICY "Authenticated users can read platform settings" ON public.platform_settings
FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for admin_wallet
DROP POLICY IF EXISTS "Admins can view admin wallet" ON public.admin_wallet;
CREATE POLICY "Admins can view admin wallet" ON public.admin_wallet
FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert admin wallet transactions" ON public.admin_wallet;
CREATE POLICY "System can insert admin wallet transactions" ON public.admin_wallet
FOR INSERT WITH CHECK (true); -- System inserts via functions

-- RLS Policies for admin_activity_log
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.admin_activity_log;
CREATE POLICY "Admins can view activity logs" ON public.admin_activity_log
FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert activity logs" ON public.admin_activity_log;
CREATE POLICY "System can insert activity logs" ON public.admin_activity_log
FOR INSERT WITH CHECK (true); -- System inserts via functions

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (true); -- System inserts via functions

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications
FOR SELECT USING (public.is_admin(auth.uid()));

-- Insert default platform settings with correct fee structure
INSERT INTO public.platform_settings (setting_key, setting_value, description) VALUES
('gst_rate', '{"value": 18, "type": "percentage"}', 'GST rate as percentage (only for wallet recharges)'),
('platform_fee_rate', '{"value": 10, "type": "percentage"}', 'Platform commission rate as percentage (only for session payments)'),
('minimum_withdrawal_amount', '{"value": 100, "type": "currency"}', 'Minimum amount for designer withdrawal'),
('maximum_withdrawal_amount', '{"value": 50000, "type": "currency"}', 'Maximum amount for designer withdrawal'),
('penalty_fee_amount', '{"value": 50, "type": "currency"}', 'Penalty fee for complaints'),
('auto_approve_threshold', '{"value": 1000, "type": "currency"}', 'Auto-approve withdrawals below this amount');

-- Create function to log admin activity
CREATE OR REPLACE FUNCTION public.log_admin_activity(
    p_admin_id UUID,
    p_action_type TEXT,
    p_description TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO public.admin_activity_log (
        admin_id, action_type, target_type, target_id, 
        description, metadata, ip_address, user_agent
    ) VALUES (
        p_admin_id, p_action_type, p_target_type, p_target_id,
        p_description, p_metadata, 
        inet_client_addr(), current_setting('request.headers', true)::json->>'user-agent'
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$;

-- Create function to add platform earnings
CREATE OR REPLACE FUNCTION public.add_platform_earning(
    p_transaction_type TEXT,
    p_amount DECIMAL(10,2),
    p_description TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    earning_id UUID;
BEGIN
    INSERT INTO public.admin_wallet (
        transaction_type, amount, description, reference_id, 
        reference_type, metadata
    ) VALUES (
        p_transaction_type, p_amount, p_description, p_reference_id,
        p_reference_type, p_metadata
    ) RETURNING id INTO earning_id;
    
    RETURN earning_id;
END;
$$;

-- Create function to get platform earnings summary
CREATE OR REPLACE FUNCTION public.get_platform_earnings_summary(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_platform_fees DECIMAL(10,2),
    total_gst_collected DECIMAL(10,2),
    total_penalty_fees DECIMAL(10,2),
    total_earnings DECIMAL(10,2),
    transaction_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'platform_fee' THEN amount ELSE 0 END), 0) as total_platform_fees,
        COALESCE(SUM(CASE WHEN transaction_type = 'gst_collection' THEN amount ELSE 0 END), 0) as total_gst_collected,
        COALESCE(SUM(CASE WHEN transaction_type = 'penalty_fee' THEN amount ELSE 0 END), 0) as total_penalty_fees,
        COALESCE(SUM(amount), 0) as total_earnings,
        COUNT(*) as transaction_count
    FROM public.admin_wallet
    WHERE (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$;

-- Create function to get all final files for admin
CREATE OR REPLACE FUNCTION public.get_admin_final_files(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    file_id UUID,
    session_id TEXT,
    booking_id UUID,
    file_name TEXT,
    file_url TEXT,
    file_size BIGINT,
    designer_id UUID,
    designer_name TEXT,
    customer_id UUID,
    customer_name TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    complaint_count BIGINT,
    has_complaints BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sf.id as file_id,
        sf.session_id,
        sf.booking_id,
        sf.name as file_name,
        sf.file_url,
        sf.file_size,
        sf.uploaded_by_id as designer_id,
        CONCAT(p.first_name, ' ', p.last_name) as designer_name,
        b.customer_id,
        CONCAT(cp.first_name, ' ', cp.last_name) as customer_name,
        sf.created_at as uploaded_at,
        COUNT(cc.id) as complaint_count,
        (COUNT(cc.id) > 0) as has_complaints
    FROM public.session_files sf
    JOIN public.profiles p ON sf.uploaded_by_id = p.user_id
    JOIN public.bookings b ON sf.booking_id = b.id
    JOIN public.profiles cp ON b.customer_id = cp.user_id
    LEFT JOIN public.customer_complaints cc ON sf.id = cc.file_id
    WHERE sf.uploaded_by_type = 'designer'
    GROUP BY sf.id, sf.session_id, sf.booking_id, sf.name, sf.file_url, 
             sf.file_size, sf.uploaded_by_id, p.first_name, p.last_name,
             b.customer_id, cp.first_name, cp.last_name, sf.created_at
    ORDER BY sf.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Create function to send notification
CREATE OR REPLACE FUNCTION public.send_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_action_url TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id, type, title, message, action_url, metadata
    ) VALUES (
        p_user_id, p_type, p_title, p_message, p_action_url, p_metadata
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- Create function to get user notifications
CREATE OR REPLACE FUNCTION public.get_user_notifications(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    message TEXT,
    is_read BOOLEAN,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.is_read,
        n.action_url,
        n.metadata,
        n.created_at,
        n.read_at
    FROM public.notifications n
    WHERE n.user_id = p_user_id
    ORDER BY n.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notifications 
    SET is_read = true, read_at = NOW()
    WHERE id = p_notification_id AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- Create function to process admin refund
CREATE OR REPLACE FUNCTION public.process_admin_refund(
    p_admin_id UUID,
    p_designer_id UUID,
    p_customer_id UUID,
    p_amount DECIMAL(10,2),
    p_reason TEXT,
    p_reference_type TEXT DEFAULT 'complaint',
    p_reference_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    refund_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    designer_balance DECIMAL(10,2);
    refund_transaction_id UUID;
    designer_transaction_id UUID;
    customer_transaction_id UUID;
    admin_earning_id UUID;
BEGIN
    -- Check if admin has permission
    IF NOT public.is_admin(p_admin_id) THEN
        RETURN QUERY SELECT false, 'Unauthorized: Admin access required', NULL::UUID;
        RETURN;
    END IF;

    -- Check if amount is positive
    IF p_amount <= 0 THEN
        RETURN QUERY SELECT false, 'Invalid amount: Must be greater than 0', NULL::UUID;
        RETURN;
    END IF;

    -- Get designer's available balance
    SELECT public.get_available_earnings(p_designer_id) INTO designer_balance;
    
    -- Check if designer has sufficient balance
    IF designer_balance < p_amount THEN
        RETURN QUERY SELECT false, 
            'Insufficient designer balance: Available ' || designer_balance || ', Required ' || p_amount, 
            NULL::UUID;
        RETURN;
    END IF;

    -- Generate transaction IDs
    refund_transaction_id := gen_random_uuid();
    designer_transaction_id := gen_random_uuid();
    customer_transaction_id := gen_random_uuid();
    admin_earning_id := gen_random_uuid();

    -- Deduct from designer wallet (withdrawal)
    INSERT INTO public.wallet_transactions (
        id, user_id, amount, transaction_type, status, description, metadata
    ) VALUES (
        designer_transaction_id,
        p_designer_id,
        p_amount,
        'withdrawal',
        'completed',
        'Refund processed by admin: ' || p_reason,
        jsonb_build_object(
            'refund_id', refund_transaction_id,
            'admin_id', p_admin_id,
            'customer_id', p_customer_id,
            'reason', p_reason,
            'reference_type', p_reference_type,
            'reference_id', p_reference_id,
            'transaction_type', 'admin_refund',
            'created_at', NOW()
        )
    );

    -- Add to customer wallet (deposit)
    INSERT INTO public.wallet_transactions (
        id, user_id, amount, transaction_type, status, description, metadata
    ) VALUES (
        customer_transaction_id,
        p_customer_id,
        p_amount,
        'deposit',
        'completed',
        'Refund received: ' || p_reason,
        jsonb_build_object(
            'refund_id', refund_transaction_id,
            'admin_id', p_admin_id,
            'designer_id', p_designer_id,
            'reason', p_reason,
            'reference_type', p_reference_type,
            'reference_id', p_reference_id,
            'transaction_type', 'admin_refund',
            'created_at', NOW()
        )
    );

    -- Add to admin wallet as platform fee (optional - for tracking)
    INSERT INTO public.admin_wallet (
        id, transaction_type, amount, description, reference_id, reference_type, metadata
    ) VALUES (
        admin_earning_id,
        'refund_processing',
        p_amount,
        'Refund processing fee: ' || p_reason,
        refund_transaction_id,
        'refund',
        jsonb_build_object(
            'designer_id', p_designer_id,
            'customer_id', p_customer_id,
            'admin_id', p_admin_id,
            'reason', p_reason,
            'reference_type', p_reference_type,
            'reference_id', p_reference_id
        )
    );

    -- Log admin activity
    PERFORM public.log_admin_activity(
        p_admin_id,
        'refund_processed',
        p_reference_type,
        p_reference_id,
        'Processed refund of ' || p_amount || ' from designer to customer: ' || p_reason,
        jsonb_build_object(
            'refund_id', refund_transaction_id,
            'designer_id', p_designer_id,
            'customer_id', p_customer_id,
            'amount', p_amount,
            'reason', p_reason
        )
    );

    RETURN QUERY SELECT true, 'Refund processed successfully', refund_transaction_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_admin_activity(UUID, TEXT, TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_platform_earning(TEXT, DECIMAL(10,2), TEXT, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_earnings_summary(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_final_files(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_notification(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notifications(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_admin_refund(UUID, UUID, UUID, DECIMAL(10,2), TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_earnings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_wallet_balance(UUID) TO authenticated;
