
-- 1) Extend designers with verification_status to support real verification flow
ALTER TABLE public.designers
ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'approved';

-- Allow admins to update any designer (owner updates already exist)
CREATE POLICY "Admins can update any designer"
ON public.designers
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 2) Bookings: allow admins to view/update all rows (for dashboard, session control, moderation)
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any booking"
ON public.bookings
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- 3) Designer availability: let admins manage schedules and availability settings
-- designer_availability_settings
CREATE POLICY "Admins can view all availability settings"
ON public.designer_availability_settings
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any availability settings"
ON public.designer_availability_settings
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert availability settings"
ON public.designer_availability_settings
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete availability settings"
ON public.designer_availability_settings
FOR DELETE
USING (public.is_admin(auth.uid()));

-- designer_weekly_schedule
CREATE POLICY "Admins can view all weekly schedules"
ON public.designer_weekly_schedule
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any weekly schedule"
ON public.designer_weekly_schedule
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert weekly schedules"
ON public.designer_weekly_schedule
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete weekly schedules"
ON public.designer_weekly_schedule
FOR DELETE
USING (public.is_admin(auth.uid()));

-- designer_special_days
CREATE POLICY "Admins can view all special days"
ON public.designer_special_days
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any special day"
ON public.designer_special_days
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert special days"
ON public.designer_special_days
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete special days"
ON public.designer_special_days
FOR DELETE
USING (public.is_admin(auth.uid()));

-- 4) Platform settings (singleton) for AdminDashboard settings tab
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_mode boolean NOT NULL DEFAULT false,
  new_registrations boolean NOT NULL DEFAULT true,
  commission_rate numeric(5,2) NOT NULL DEFAULT 15,
  featured_designers_limit integer NOT NULL DEFAULT 6,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Ensure single-row singleton semantics
ALTER TABLE public.platform_settings
ADD COLUMN IF NOT EXISTS singleton boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'platform_settings_singleton'
  ) THEN
    ALTER TABLE public.platform_settings
    ADD CONSTRAINT platform_settings_singleton UNIQUE (singleton);
  END IF;
END$$;

-- RLS for admins only
CREATE POLICY "Admins can view platform settings"
ON public.platform_settings
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER set_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a singleton row (id auto, defaults set); if it exists, do nothing
INSERT INTO public.platform_settings DEFAULT VALUES
ON CONFLICT (singleton) DO NOTHING;

-- 5) Announcements for admin communications
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',       -- e.g. info | warning | success
  target text NOT NULL DEFAULT 'all',      -- e.g. all | designers | clients
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can view active announcements (adjust later if you want tighter control)
CREATE POLICY "Public can view active announcements"
ON public.announcements
FOR SELECT
USING (is_active = true);

-- Only admins can manage announcements
CREATE POLICY "Admins can manage announcements"
ON public.announcements
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER set_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
