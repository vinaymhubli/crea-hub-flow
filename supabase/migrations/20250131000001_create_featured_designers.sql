-- Create featured designers management system

-- Create featured_designers table
CREATE TABLE IF NOT EXISTS public.featured_designers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  designer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "position" INTEGER NOT NULL CHECK ("position" >= 1 AND "position" <= 10),
  is_active BOOLEAN DEFAULT true,
  featured_since TIMESTAMP WITH TIME ZONE DEFAULT now(),
  featured_until TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure only one designer per position
  UNIQUE("position"),
  -- Ensure designer can only be featured once
  UNIQUE(designer_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_featured_designers_position ON public.featured_designers("position");
CREATE INDEX IF NOT EXISTS idx_featured_designers_designer_id ON public.featured_designers(designer_id);
CREATE INDEX IF NOT EXISTS idx_featured_designers_active ON public.featured_designers(is_active);

-- Create function to get featured designers
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
  ORDER BY fd."position" ASC;
$$;

-- Create function to add designer to featured list
CREATE OR REPLACE FUNCTION public.add_featured_designer(
  p_designer_id UUID,
  p_position INTEGER,
  p_admin_notes TEXT DEFAULT NULL,
  p_featured_until TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_featured_id UUID;
BEGIN
  -- Check if position is valid (1-10)
  IF p_position < 1 OR p_position > 10 THEN
    RAISE EXCEPTION 'Position must be between 1 and 10';
  END IF;
  
  -- Check if designer exists and is a designer
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_designer_id AND user_type = 'designer'
  ) THEN
    RAISE EXCEPTION 'Designer not found or not a designer';
  END IF;
  
  -- Check if position is already taken
  IF EXISTS (
    SELECT 1 FROM public.featured_designers 
    WHERE "position" = p_position AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Position % is already taken', p_position;
  END IF;
  
  -- Check if designer is already featured
  IF EXISTS (
    SELECT 1 FROM public.featured_designers 
    WHERE designer_id = p_designer_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Designer is already featured';
  END IF;
  
  -- Insert featured designer
  INSERT INTO public.featured_designers (
    designer_id, "position", admin_notes, featured_until, created_by
  ) VALUES (
    p_designer_id, p_position, p_admin_notes, p_featured_until, auth.uid()
  ) RETURNING id INTO v_featured_id;
  
  RETURN v_featured_id;
END;
$$;

-- Create function to remove designer from featured list
CREATE OR REPLACE FUNCTION public.remove_featured_designer(p_designer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.featured_designers 
  SET is_active = false, updated_at = now()
  WHERE designer_id = p_designer_id AND is_active = true;
  
  RETURN FOUND;
END;
$$;

-- Create function to reorder featured designers
CREATE OR REPLACE FUNCTION public.reorder_featured_designers(
  p_designer_id UUID,
  p_new_position INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_position INTEGER;
BEGIN
  -- Get current position
  SELECT "position" INTO v_old_position
  FROM public.featured_designers
  WHERE designer_id = p_designer_id AND is_active = true;
  
  IF v_old_position IS NULL THEN
    RAISE EXCEPTION 'Designer not found in featured list';
  END IF;
  
  -- Check if new position is valid
  IF p_new_position < 1 OR p_new_position > 10 THEN
    RAISE EXCEPTION 'Position must be between 1 and 10';
  END IF;
  
  -- If same position, do nothing
  IF v_old_position = p_new_position THEN
    RETURN true;
  END IF;
  
  -- Temporarily move the designer to position 0
  UPDATE public.featured_designers 
  SET "position" = 0
  WHERE designer_id = p_designer_id;
  
  -- Shift other designers
  IF p_new_position > v_old_position THEN
    -- Moving down: shift designers up
    UPDATE public.featured_designers 
    SET "position" = "position" - 1
    WHERE "position" > v_old_position 
      AND "position" <= p_new_position 
      AND is_active = true;
  ELSE
    -- Moving up: shift designers down
    UPDATE public.featured_designers 
    SET "position" = "position" + 1
    WHERE "position" >= p_new_position 
      AND "position" < v_old_position 
      AND is_active = true;
  END IF;
  
  -- Set new position
  UPDATE public.featured_designers 
  SET "position" = p_new_position, updated_at = now()
  WHERE designer_id = p_designer_id;
  
  RETURN true;
END;
$$;

-- Create function to get available positions
CREATE OR REPLACE FUNCTION public.get_available_featured_positions()
RETURNS TABLE ("position" INTEGER)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT generate_series(1, 10) as "position"
  EXCEPT
  SELECT "position" FROM public.featured_designers WHERE is_active = true;
$$;

-- Create function to get featured designers for admin
CREATE OR REPLACE FUNCTION public.get_featured_designers_admin()
RETURNS TABLE (
  id UUID,
  designer_id UUID,
  "position" INTEGER,
  is_active BOOLEAN,
  featured_since TIMESTAMP WITH TIME ZONE,
  featured_until TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  designer_name TEXT,
  designer_email TEXT,
  designer_avatar TEXT,
  designer_rating DECIMAL(3,2),
  designer_specialties TEXT[],
  designer_experience INTEGER,
  designer_verified BOOLEAN,
  designer_joined_at TIMESTAMP WITH TIME ZONE
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
    fd.featured_until,
    fd.admin_notes,
    fd.created_by,
    fd.created_at,
    fd.updated_at,
    CONCAT(p.first_name, ' ', p.last_name) as designer_name,
    u.email as designer_email,
    p.avatar_url as designer_avatar,
    COALESCE(d.rating, 0.0) as designer_rating,
    d.skills as designer_specialties,
    COALESCE(d.completion_rate, 0) as designer_experience,
    COALESCE(d.is_online, false) as designer_verified,
    u.created_at as designer_joined_at
  FROM public.featured_designers fd
  JOIN auth.users u ON fd.designer_id = u.id
  JOIN public.profiles p ON fd.designer_id = p.user_id
  LEFT JOIN public.designers d ON fd.designer_id = d.user_id
  ORDER BY fd."position" ASC;
$$;

-- Enable RLS
ALTER TABLE public.featured_designers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage featured designers" ON public.featured_designers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Anyone can view active featured designers" ON public.featured_designers
  FOR SELECT USING (is_active = true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_featured_designers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_featured_designers_updated_at
  BEFORE UPDATE ON public.featured_designers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_featured_designers_updated_at();
