-- Add reupload tracking to session_files table
-- This migration adds support for tracking re-upload attempts in the complaint workflow

-- Add reupload tracking columns to session_files
ALTER TABLE public.session_files 
ADD COLUMN IF NOT EXISTS reupload_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_reupload BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_file_id UUID REFERENCES public.session_files(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS complaint_id UUID REFERENCES public.customer_complaints(id) ON DELETE SET NULL;

-- Add index for better performance on reupload queries
CREATE INDEX IF NOT EXISTS idx_session_files_reupload ON public.session_files(is_reupload, complaint_id);
CREATE INDEX IF NOT EXISTS idx_session_files_original_file ON public.session_files(original_file_id);

-- Update existing session_files to have reupload_number = 1 and is_reupload = false
UPDATE public.session_files 
SET reupload_number = 1, is_reupload = false 
WHERE reupload_number IS NULL;

-- Create a function to get the latest file for a complaint
CREATE OR REPLACE FUNCTION public.get_latest_complaint_file(p_complaint_id UUID)
RETURNS TABLE (
    file_id UUID,
    file_name TEXT,
    file_url TEXT,
    file_type TEXT,
    file_size BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    reupload_number INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sf.id,
        sf.name,
        sf.file_url,
        sf.file_type,
        sf.file_size,
        sf.created_at,
        sf.reupload_number
    FROM public.session_files sf
    WHERE sf.complaint_id = p_complaint_id
    ORDER BY sf.reupload_number DESC, sf.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get all files for a complaint (for history)
CREATE OR REPLACE FUNCTION public.get_complaint_file_history(p_complaint_id UUID)
RETURNS TABLE (
    file_id UUID,
    file_name TEXT,
    file_url TEXT,
    file_type TEXT,
    file_size BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    reupload_number INTEGER,
    is_latest BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sf.id,
        sf.name,
        sf.file_url,
        sf.file_type,
        sf.file_size,
        sf.created_at,
        sf.reupload_number,
        (sf.id = (SELECT latest_file_id FROM public.customer_complaints WHERE id = p_complaint_id)) as is_latest
    FROM public.session_files sf
    WHERE sf.complaint_id = p_complaint_id
    ORDER BY sf.reupload_number ASC, sf.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_latest_complaint_file TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_complaint_file_history TO authenticated;

