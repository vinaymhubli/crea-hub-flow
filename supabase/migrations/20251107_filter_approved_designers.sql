-- Update get_featured_designers function to only return approved designers
-- This ensures pending/draft designers are not visible on public pages

CREATE OR REPLACE FUNCTION public.get_featured_designers()
RETURNS TABLE (
  id UUID,
  designer_id UUID,
  "position" INTEGER,
  is_active BOOLEAN,
  featured_since TIMESTAMP WITH TIME ZONE,
  designer_name TEXT,
  designer_email TEXT,
  designer_avatar TEXT,
  designer_rating DECIMAL(3,2),
  designer_specialties TEXT[],
  designer_experience INTEGER,
  designer_verified BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    fd.id,
    fd.designer_id,
    fd."position",
    fd.is_active,
    fd.featured_since,
    CONCAT(p.first_name, ' ', p.last_name) as designer_name,
    u.email as designer_email,
    p.avatar_url as designer_avatar,
    COALESCE(d.rating, 0.0) as designer_rating,
    d.skills as designer_specialties,
    COALESCE(d.completion_rate, 0) as designer_experience,
    COALESCE(d.is_online, false) as designer_verified
  FROM public.featured_designers fd
  JOIN auth.users u ON fd.designer_id = u.id
  JOIN public.profiles p ON fd.designer_id = p.user_id
  LEFT JOIN public.designers d ON fd.designer_id = d.user_id
  WHERE fd.is_active = true
    AND (d.verification_status = 'approved' OR d.verification_status IS NULL)
  ORDER BY fd."position" ASC;
$$;

