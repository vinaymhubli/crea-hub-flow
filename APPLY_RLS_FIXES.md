# Apply Database RLS Fixes

## Critical Security Issue Found

The current RLS policies on the `designers` table allow **anyone** (including unauthenticated users) to view ALL designers, including those with `verification_status = 'draft'` or `'pending'`.

## Fix Required

Apply the new migration file to update RLS policies:

### File to Apply
`supabase/migrations/20251107_fix_designers_rls_verification.sql`

### What It Does

1. **Updates `designers` table RLS policy**
   - ❌ Old: `"Designers are viewable by everyone"` with `USING (true)`
   - ✅ New: `"Public can view approved designers only"` with verification filtering
   
2. **Updates `services` table RLS policy**
   - Only shows services from approved designers
   - Service owners can still see their own
   - Admins can see all

3. **Adds performance indexes**
   - Index on `verification_status`
   - Composite index on `user_id, verification_status`

### How to Apply

#### Option 1: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/tndeiiosfbtyzmcwllbx
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20251107_fix_designers_rls_verification.sql`
4. Paste and click **Run**

#### Option 2: Via Supabase CLI

```bash
# Make sure you're in the project directory
cd /Users/animesh/Documents/BoostMySites/crea-hub-flow

# Run the migration
supabase db push
```

#### Option 3: Manual SQL Execution

```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/20251107_fix_designers_rls_verification.sql
```

---

## Verification After Apply

### Test 1: Public Access (Unauthenticated)
```sql
-- Should only return approved designers
SELECT id, user_id, specialty, verification_status 
FROM public.designers;
```
**Expected**: Only designers with `verification_status = 'approved'`

### Test 2: Designer Access (Authenticated as Designer)
```sql
-- Should return own designer record + all approved designers
SELECT id, user_id, specialty, verification_status 
FROM public.designers;
```
**Expected**: Own record (any status) + all approved designers

### Test 3: Admin Access
```sql
-- Should return ALL designers
SELECT id, user_id, specialty, verification_status 
FROM public.designers;
```
**Expected**: All designers regardless of status

---

## Impact Analysis

### Frontend Changes Already Applied ✅
All frontend queries already filter by `verification_status = 'approved'`:
- ✅ DesignerGrid.tsx
- ✅ FeaturedDesigners.tsx
- ✅ FeaturedDesignersWithVideo.tsx
- ✅ FeaturedDesignersDisplay.tsx
- ✅ DesignerDetails.tsx
- ✅ CustomerRecentDesigners.tsx
- ✅ Designers.tsx (count query)
- ✅ ServiceDetail.tsx
- ✅ Services.tsx
- ✅ get_featured_designers() RPC function

### Database Changes Required ⚠️
- ⚠️ `designers` table RLS policy needs update
- ⚠️ `services` table RLS policy needs update

### Why Both Levels?
1. **Frontend filtering** - Fast, responsive UX
2. **Database RLS** - Security layer, prevents API bypass

Even though frontend filters are in place, **RLS policies are the final security layer** and must be correct.

---

## Rollback Plan

If issues occur, you can rollback with:

```sql
-- Restore old policy (NOT RECOMMENDED - security risk)
DROP POLICY IF EXISTS "Public can view approved designers only" ON public.designers;

CREATE POLICY "Designers are viewable by everyone" 
ON public.designers 
FOR SELECT 
USING (true);
```

**Note**: Only use rollback if critical issues occur. The old policy is a security vulnerability.

---

## Additional Recommendations

### 1. Add Audit Logging
```sql
-- Track when designers change verification status
CREATE TABLE public.designer_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES public.designers(id),
  old_status TEXT,
  new_status TEXT,
  changed_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

### 2. Add Notification on Status Change
```sql
-- Trigger to notify designer when status changes
CREATE OR REPLACE FUNCTION notify_designer_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status != OLD.verification_status THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'verification_status_changed',
      'Profile Verification Status Updated',
      'Your designer profile status has been changed to: ' || NEW.verification_status,
      jsonb_build_object('old_status', OLD.verification_status, 'new_status', NEW.verification_status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER designer_status_change_notification
AFTER UPDATE OF verification_status ON public.designers
FOR EACH ROW
EXECUTE FUNCTION notify_designer_status_change();
```

### 3. Add Rejection Reason Field
```sql
-- Add field to store why profile was rejected
ALTER TABLE public.designers 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Admin can provide feedback when rejecting
```

---

## Priority: HIGH 🔴

This RLS fix should be applied **immediately** to close the security gap where unauthenticated users can see draft/pending designer profiles.

---

*Created: November 7, 2024*
*Status: Ready to Apply*

