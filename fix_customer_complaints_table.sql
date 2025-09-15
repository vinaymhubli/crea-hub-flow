-- Fix Customer Complaints Table Issues

-- 1. Check if customer_complaints table exists
SELECT 
  'Table exists check' as check_type,
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'customer_complaints' 
  AND table_schema = 'public';

-- 2. If table doesn't exist, create it
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

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_complaints_session_id ON public.customer_complaints(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_customer_id ON public.customer_complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_designer_id ON public.customer_complaints(designer_id);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_status ON public.customer_complaints(status);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_priority ON public.customer_complaints(priority);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_created_at ON public.customer_complaints(created_at);

-- 4. Enable RLS
ALTER TABLE public.customer_complaints ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
DROP POLICY IF EXISTS "Customers can view their own complaints" ON public.customer_complaints;
CREATE POLICY "Customers can view their own complaints" ON public.customer_complaints
    FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Designers can view complaints about them" ON public.customer_complaints;
CREATE POLICY "Designers can view complaints about them" ON public.customer_complaints
    FOR SELECT USING (auth.uid() = designer_id);

DROP POLICY IF EXISTS "Admins can view all complaints" ON public.customer_complaints;
CREATE POLICY "Admins can view all complaints" ON public.customer_complaints
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

DROP POLICY IF EXISTS "Customers can create complaints" ON public.customer_complaints;
CREATE POLICY "Customers can create complaints" ON public.customer_complaints
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Admins can update complaints" ON public.customer_complaints;
CREATE POLICY "Admins can update complaints" ON public.customer_complaints
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- 6. Grant permissions
GRANT ALL ON public.customer_complaints TO authenticated;
GRANT ALL ON public.customer_complaints TO service_role;

-- 7. Test the table structure
SELECT 
  'Table structure check' as check_type,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'customer_complaints' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Test inserting a sample complaint (using a real file_id if available)
-- First, let's get a real file_id from session_files
SELECT 
  'Available file IDs for testing' as check_type,
  id as file_id,
  name as file_name,
  session_id
FROM public.session_files 
WHERE status = 'approved' 
LIMIT 3;

-- 9. Test insert with a real file_id (only if files exist)
-- This will be commented out to avoid errors if no files exist
/*
INSERT INTO public.customer_complaints (
  session_id,
  booking_id,
  customer_id,
  designer_id,
  file_id,
  complaint_type,
  title,
  description,
  status,
  priority
) VALUES (
  'test_session_123',
  NULL,
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  (SELECT id FROM public.session_files LIMIT 1),
  'other',
  'Test Complaint',
  'This is a test complaint',
  'pending',
  'medium'
);
*/

-- 10. Final verification
SELECT 
  'Final verification' as check_type,
  COUNT(*) as total_complaints
FROM public.customer_complaints;
