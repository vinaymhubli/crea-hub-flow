-- Complaint Workflow Update Migration
-- This migration updates the complaint system to support the new workflow:
-- 1. Customer complains -> Admin reviews -> Reject (customer notification) OR Approve (designer notification)
-- 2. Designer uploads new file -> Customer reviews -> Approve (designer notification) OR Reject (designer notification)

-- Add new statuses to the complaint workflow
ALTER TABLE public.customer_complaints 
DROP CONSTRAINT IF EXISTS customer_complaints_status_check;

ALTER TABLE public.customer_complaints 
ADD CONSTRAINT customer_complaints_status_check 
CHECK (status IN (
    'pending',           -- Initial complaint submitted
    'under_review',      -- Admin is reviewing
    'rejected',          -- Admin rejected the complaint
    'approved',          -- Admin approved, designer needs to re-upload
    'file_uploaded',     -- Designer uploaded new file, waiting for customer review
    'customer_approved', -- Customer approved the new file
    'customer_rejected', -- Customer rejected the new file
    'resolved'           -- Final resolution
));

-- Add new columns to track the re-upload workflow
ALTER TABLE public.customer_complaints 
ADD COLUMN IF NOT EXISTS new_file_id UUID REFERENCES public.session_files(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS new_file_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_review_notes TEXT,
ADD COLUMN IF NOT EXISTS customer_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reupload_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS latest_file_id UUID REFERENCES public.session_files(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_customer_complaints_status ON public.customer_complaints(status);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_designer_id ON public.customer_complaints(designer_id);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_customer_id ON public.customer_complaints(customer_id);

-- Update the updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to customer_complaints if not already applied
DROP TRIGGER IF EXISTS update_customer_complaints_updated_at ON public.customer_complaints;
CREATE TRIGGER update_customer_complaints_updated_at
    BEFORE UPDATE ON public.customer_complaints
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to handle complaint status transitions
CREATE OR REPLACE FUNCTION public.handle_complaint_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the status change
    INSERT INTO public.admin_activity_log (
        admin_id,
        action_type,
        target_type,
        target_id,
        description,
        metadata
    ) VALUES (
        NEW.resolved_by,
        'complaint_status_change',
        'complaint',
        NEW.id,
        'Complaint status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status,
        jsonb_build_object(
            'old_status', OLD.status,
            'new_status', NEW.status,
            'complaint_id', NEW.id
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS complaint_status_change_trigger ON public.customer_complaints;
CREATE TRIGGER complaint_status_change_trigger
    AFTER UPDATE OF status ON public.customer_complaints
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.handle_complaint_status_change();

-- Create a function to send notifications for complaint workflow
CREATE OR REPLACE FUNCTION public.send_complaint_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_action_url TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        data,
        created_at
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_action_url,
        p_metadata,
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle the complete complaint workflow
CREATE OR REPLACE FUNCTION public.process_complaint_workflow(
    p_complaint_id UUID,
    p_action TEXT,
    p_admin_id UUID DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL,
    p_designer_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_new_file_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_complaint RECORD;
    v_result JSONB;
BEGIN
    -- Get complaint details
    SELECT * INTO v_complaint FROM public.customer_complaints WHERE id = p_complaint_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Complaint not found');
    END IF;

    -- Handle different actions
    CASE p_action
        WHEN 'admin_reject' THEN
            -- Admin rejects complaint
            UPDATE public.customer_complaints 
            SET status = 'rejected', 
                admin_notes = p_notes,
                resolved_by = p_admin_id,
                updated_at = NOW()
            WHERE id = p_complaint_id;
            
            -- Notify customer
            PERFORM public.send_complaint_notification(
                v_complaint.customer_id,
                'complaint_rejected',
                'Complaint Rejected',
                'Your complaint has been reviewed and rejected by our admin team.',
                '/customer/complaints',
                jsonb_build_object('complaint_id', p_complaint_id)
            );
            
            v_result := jsonb_build_object('success', true, 'status', 'rejected');
            
        WHEN 'admin_approve' THEN
            -- Admin approves complaint, designer needs to re-upload
            UPDATE public.customer_complaints 
            SET status = 'approved', 
                admin_notes = p_notes,
                resolved_by = p_admin_id,
                updated_at = NOW()
            WHERE id = p_complaint_id;
            
            -- Notify designer
            PERFORM public.send_complaint_notification(
                v_complaint.designer_id,
                'file_reupload_required',
                'File Re-upload Required',
                'A customer complaint has been approved. Please upload a corrected version of the file.',
                '/designer/complaints',
                jsonb_build_object('complaint_id', p_complaint_id, 'file_id', v_complaint.file_id)
            );
            
            -- Notify customer
            PERFORM public.send_complaint_notification(
                v_complaint.customer_id,
                'complaint_approved',
                'Complaint Approved',
                'Your complaint has been approved. The designer will provide a corrected version.',
                '/customer/complaints',
                jsonb_build_object('complaint_id', p_complaint_id)
            );
            
            v_result := jsonb_build_object('success', true, 'status', 'approved');
            
        WHEN 'designer_upload' THEN
            -- Designer uploads new file (can be first upload or re-upload after rejection)
            UPDATE public.customer_complaints 
            SET status = 'file_uploaded',
                new_file_id = p_new_file_id,
                latest_file_id = p_new_file_id,
                new_file_uploaded_at = NOW(),
                reupload_count = reupload_count + 1,
                updated_at = NOW()
            WHERE id = p_complaint_id;
            
            -- Notify customer to review
            PERFORM public.send_complaint_notification(
                v_complaint.customer_id,
                'file_ready_for_review',
                'New File Ready for Review',
                'The designer has uploaded a corrected version. Please review and approve or reject it.',
                '/customer/complaints',
                jsonb_build_object('complaint_id', p_complaint_id, 'new_file_id', p_new_file_id)
            );
            
            v_result := jsonb_build_object('success', true, 'status', 'file_uploaded');
            
        WHEN 'customer_approve' THEN
            -- Customer approves the new file
            UPDATE public.customer_complaints 
            SET status = 'customer_approved',
                customer_review_notes = p_notes,
                customer_reviewed_at = NOW(),
                customer_reviewed_by = p_customer_id,
                updated_at = NOW()
            WHERE id = p_complaint_id;
            
            -- Notify designer
            PERFORM public.send_complaint_notification(
                v_complaint.designer_id,
                'file_approved',
                'File Approved',
                'The customer has approved your corrected file. The complaint is now resolved.',
                '/designer/complaints',
                jsonb_build_object('complaint_id', p_complaint_id)
            );
            
            v_result := jsonb_build_object('success', true, 'status', 'customer_approved');
            
        WHEN 'customer_reject' THEN
            -- Customer rejects the new file
            UPDATE public.customer_complaints 
            SET status = 'customer_rejected',
                customer_review_notes = p_notes,
                customer_reviewed_at = NOW(),
                customer_reviewed_by = p_customer_id,
                updated_at = NOW()
            WHERE id = p_complaint_id;
            
            -- Notify designer
            PERFORM public.send_complaint_notification(
                v_complaint.designer_id,
                'file_rejected',
                'File Rejected',
                'The customer has rejected your corrected file. Please upload another version.',
                '/designer/complaints',
                jsonb_build_object('complaint_id', p_complaint_id)
            );
            
            v_result := jsonb_build_object('success', true, 'status', 'customer_rejected');
            
        ELSE
            v_result := jsonb_build_object('success', false, 'error', 'Invalid action');
    END CASE;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.process_complaint_workflow TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_complaint_notification TO authenticated;
