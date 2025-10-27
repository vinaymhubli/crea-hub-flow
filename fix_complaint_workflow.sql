-- Fix Complaint Workflow Function
-- This script ensures the complaint workflow function exists and works properly

-- First, check if the function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'process_complaint_workflow' 
    AND routine_schema = 'public';

-- Drop and recreate the function to ensure it's correct
DROP FUNCTION IF EXISTS public.process_complaint_workflow CASCADE;

-- Create the complaint workflow function
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
            
            v_result := jsonb_build_object('success', true, 'status', 'rejected');
            
        WHEN 'admin_approve' THEN
            -- Admin approves complaint - designer needs to re-upload
            UPDATE public.customer_complaints 
            SET status = 'approved', 
                admin_notes = p_notes,
                resolved_by = p_admin_id,
                updated_at = NOW()
            WHERE id = p_complaint_id;
            
            -- Send notification to designer
            INSERT INTO public.notifications (user_id, type, title, message, related_id, created_at)
            VALUES (
                v_complaint.designer_id,
                'complaint_received',
                'Complaint Approved - Action Required',
                'A customer complaint has been approved by admin. Please upload a corrected file.',
                p_complaint_id,
                NOW()
            );
            
            v_result := jsonb_build_object('success', true, 'status', 'approved');
            
        WHEN 'admin_update' THEN
            -- Admin marks under review
            UPDATE public.customer_complaints 
            SET status = 'under_review', 
                admin_notes = p_notes,
                updated_at = NOW()
            WHERE id = p_complaint_id;
            
            v_result := jsonb_build_object('success', true, 'status', 'under_review');
            
        WHEN 'designer_upload' THEN
            -- Designer uploads new file
            UPDATE public.customer_complaints 
            SET status = 'file_uploaded',
                new_file_id = p_new_file_id,
                new_file_uploaded_at = NOW(),
                reupload_count = COALESCE(reupload_count, 0) + 1,
                latest_file_id = p_new_file_id,
                updated_at = NOW()
            WHERE id = p_complaint_id;
            
            -- Send notification to customer
            INSERT INTO public.notifications (user_id, type, title, message, related_id, created_at)
            VALUES (
                v_complaint.customer_id,
                'message',
                'New File Ready for Review',
                'The designer has uploaded a corrected file for your complaint. Please review it.',
                p_complaint_id,
                NOW()
            );
            
            v_result := jsonb_build_object('success', true, 'status', 'file_uploaded');
            
        WHEN 'customer_approve' THEN
            -- Customer approves the new file
            UPDATE public.customer_complaints 
            SET status = 'customer_approved',
                customer_review_notes = p_notes,
                customer_reviewed_at = NOW(),
                customer_reviewed_by = p_customer_id,
                resolved_at = NOW(),
                updated_at = NOW()
            WHERE id = p_complaint_id;
            
            -- Send notification to designer
            INSERT INTO public.notifications (user_id, type, title, message, related_id, created_at)
            VALUES (
                v_complaint.designer_id,
                'message',
                'Complaint Resolved - File Approved',
                'The customer has approved your corrected file. The complaint is now resolved.',
                p_complaint_id,
                NOW()
            );
            
            v_result := jsonb_build_object('success', true, 'status', 'customer_approved');
            
        WHEN 'customer_reject' THEN
            -- Customer rejects the new file - back to approved for designer to re-upload
            UPDATE public.customer_complaints 
            SET status = 'customer_rejected',
                customer_review_notes = p_notes,
                customer_reviewed_at = NOW(),
                customer_reviewed_by = p_customer_id,
                updated_at = NOW()
            WHERE id = p_complaint_id;
            
            -- Send notification to designer
            INSERT INTO public.notifications (user_id, type, title, message, related_id, created_at)
            VALUES (
                v_complaint.designer_id,
                'message',
                'File Rejected - Please Upload Again',
                'The customer has rejected your corrected file. Please upload a new version.',
                p_complaint_id,
                NOW()
            );
            
            v_result := jsonb_build_object('success', true, 'status', 'customer_rejected');
            
        ELSE
            v_result := jsonb_build_object('success', false, 'error', 'Invalid action');
    END CASE;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.process_complaint_workflow TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_complaint_workflow TO anon;

-- Test the function
SELECT public.process_complaint_workflow(
    '00000000-0000-0000-0000-000000000000'::UUID,
    'test',
    NULL,
    NULL,
    NULL,
    'Test call',
    NULL
) as test_result;

-- Show function details
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'process_complaint_workflow' 
    AND routine_schema = 'public';
