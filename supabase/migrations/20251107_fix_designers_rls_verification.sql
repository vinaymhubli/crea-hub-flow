-- ============================================================================
-- FIX: Designers RLS Policy to Filter by Verification Status
-- ============================================================================
-- ISSUE: Current policy allows public to see ALL designers including draft/pending
-- SOLUTION: Update policy to only show approved designers to public
-- ============================================================================

-- Drop the old overly permissive policy
DROP POLICY IF EXISTS "Designers are viewable by everyone" ON public.designers;

-- Create new policy with verification_status filtering
-- This ensures:
-- 1. Public/unauthenticated users only see approved designers
-- 2. Designers can always see their own profile (any status)
-- 3. Admins can see all designers (for verification dashboard)

CREATE POLICY "Public can view approved designers only"
ON public.designers
FOR SELECT
USING (
  verification_status = 'approved'  -- Public can only see approved
  OR auth.uid() = user_id          -- Designers can see their own (any status)
  OR public.is_current_user_admin() -- Admins can see all
);

-- ============================================================================
-- Optional: Add similar filtering for services table
-- ============================================================================
-- This ensures services are only visible if the designer is approved

-- Drop old policy if it exists
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;

-- Create new policy that checks designer verification status
CREATE POLICY "Public can view services from approved designers"
ON public.services
FOR SELECT
USING (
  -- Service is visible if:
  is_active = true AND (
    -- Designer is approved
    EXISTS (
      SELECT 1 FROM public.designers d
      WHERE d.id = services.designer_id
      AND d.verification_status = 'approved'
    )
    -- OR service owner can see their own
    OR auth.uid() IN (
      SELECT user_id FROM public.designers WHERE id = services.designer_id
    )
    -- OR admin can see all
    OR public.is_current_user_admin()
  )
);

-- ============================================================================
-- Add index for better query performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_designers_verification_status 
ON public.designers(verification_status);

CREATE INDEX IF NOT EXISTS idx_designers_user_id_verification 
ON public.designers(user_id, verification_status);

-- ============================================================================
-- Verification: Test the policies
-- ============================================================================
-- After applying this migration, run these queries to verify:
--
-- 1. As unauthenticated user (should only see approved):
--    SELECT * FROM designers;
--
-- 2. As designer (should see own + approved):
--    SELECT * FROM designers WHERE user_id = auth.uid() OR verification_status = 'approved';
--
-- 3. As admin (should see all):
--    SELECT * FROM designers;
--
-- ============================================================================

COMMENT ON POLICY "Public can view approved designers only" ON public.designers IS 
'Ensures public users only see approved designers. Designers can view their own profile regardless of status. Admins can view all.';

COMMENT ON POLICY "Public can view services from approved designers" ON public.services IS 
'Ensures services are only visible if the designer is approved. Service owners and admins can view all.';

