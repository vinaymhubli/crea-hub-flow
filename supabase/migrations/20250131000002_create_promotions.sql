-- Create promotions and offers management system

-- Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('discount', 'offer', 'announcement', 'banner', 'popup')),
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_service')),
  discount_value DECIMAL(10,2),
  discount_code TEXT UNIQUE,
  min_order_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  target_audience TEXT CHECK (target_audience IN ('all', 'customers', 'designers', 'new_users', 'existing_users')),
  display_location TEXT[] DEFAULT ARRAY['homepage']::TEXT[],
  priority INTEGER DEFAULT 1,
  banner_image_url TEXT,
  banner_text_color TEXT DEFAULT '#000000',
  banner_background_color TEXT DEFAULT '#ffffff',
  cta_text TEXT DEFAULT 'Learn More',
  cta_url TEXT,
  admin_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create promotion_usage table to track usage
CREATE TABLE IF NOT EXISTS public.promotion_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  order_id UUID,
  discount_applied DECIMAL(10,2),
  UNIQUE(promotion_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON public.promotions(promotion_type);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_priority ON public.promotions(priority DESC);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion ON public.promotion_usage(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_user ON public.promotion_usage(user_id);

-- Create function to get active promotions
CREATE OR REPLACE FUNCTION public.get_active_promotions(
  p_location TEXT DEFAULT 'homepage',
  p_user_type TEXT DEFAULT 'all'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  promotion_type TEXT,
  discount_type TEXT,
  discount_value DECIMAL(10,2),
  discount_code TEXT,
  min_order_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  used_count INTEGER,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_audience TEXT,
  display_location TEXT[],
  priority INTEGER,
  banner_image_url TEXT,
  banner_text_color TEXT,
  banner_background_color TEXT,
  cta_text TEXT,
  cta_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.title,
    p.description,
    p.promotion_type,
    p.discount_type,
    p.discount_value,
    p.discount_code,
    p.min_order_amount,
    p.max_discount_amount,
    p.usage_limit,
    p.used_count,
    p.start_date,
    p.end_date,
    p.target_audience,
    p.display_location,
    p.priority,
    p.banner_image_url,
    p.banner_text_color,
    p.banner_background_color,
    p.cta_text,
    p.cta_url
  FROM public.promotions p
  WHERE p.is_active = true
    AND p.start_date <= now()
    AND (p.end_date IS NULL OR p.end_date >= now())
    AND (p_location = 'all' OR p_location = ANY(p.display_location))
    AND (p.target_audience = 'all' OR p.target_audience = p_user_type)
    AND (p.usage_limit IS NULL OR p.used_count < p.usage_limit)
  ORDER BY p.priority DESC, p.created_at DESC;
$$;

-- Create function to apply promotion discount
CREATE OR REPLACE FUNCTION public.apply_promotion_discount(
  p_promotion_id UUID,
  p_user_id UUID,
  p_order_amount DECIMAL(10,2)
)
RETURNS TABLE (
  success BOOLEAN,
  discount_amount DECIMAL(10,2),
  final_amount DECIMAL(10,2),
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promotion RECORD;
  v_discount_amount DECIMAL(10,2) := 0;
  v_final_amount DECIMAL(10,2);
  v_usage_count INTEGER;
BEGIN
  -- Get promotion details
  SELECT * INTO v_promotion
  FROM public.promotions
  WHERE id = p_promotion_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0.0, p_order_amount, 'Promotion not found or inactive'::TEXT;
    RETURN;
  END IF;
  
  -- Check if promotion is still valid
  IF v_promotion.start_date > now() OR (v_promotion.end_date IS NOT NULL AND v_promotion.end_date < now()) THEN
    RETURN QUERY SELECT false, 0.0, p_order_amount, 'Promotion has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check usage limit
  IF v_promotion.usage_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM public.promotion_usage
    WHERE promotion_id = p_promotion_id;
    
    IF v_usage_count >= v_promotion.usage_limit THEN
      RETURN QUERY SELECT false, 0.0, p_order_amount, 'Promotion usage limit reached'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Check minimum order amount
  IF v_promotion.min_order_amount IS NOT NULL AND p_order_amount < v_promotion.min_order_amount THEN
    RETURN QUERY SELECT false, 0.0, p_order_amount, 'Order amount below minimum required'::TEXT;
    RETURN;
  END IF;
  
  -- Calculate discount
  IF v_promotion.discount_type = 'percentage' THEN
    v_discount_amount := (p_order_amount * v_promotion.discount_value) / 100;
  ELSIF v_promotion.discount_type = 'fixed_amount' THEN
    v_discount_amount := v_promotion.discount_value;
  END IF;
  
  -- Apply maximum discount limit
  IF v_promotion.max_discount_amount IS NOT NULL AND v_discount_amount > v_promotion.max_discount_amount THEN
    v_discount_amount := v_promotion.max_discount_amount;
  END IF;
  
  -- Ensure discount doesn't exceed order amount
  v_discount_amount := LEAST(v_discount_amount, p_order_amount);
  v_final_amount := p_order_amount - v_discount_amount;
  
  -- Record usage
  INSERT INTO public.promotion_usage (promotion_id, user_id, discount_applied)
  VALUES (p_promotion_id, p_user_id, v_discount_amount)
  ON CONFLICT (promotion_id, user_id) DO NOTHING;
  
  -- Update usage count
  UPDATE public.promotions 
  SET used_count = used_count + 1
  WHERE id = p_promotion_id;
  
  RETURN QUERY SELECT true, v_discount_amount, v_final_amount, NULL::TEXT;
END;
$$;

-- Create function to get promotion statistics
CREATE OR REPLACE FUNCTION public.get_promotion_stats(p_promotion_id UUID)
RETURNS TABLE (
  total_usage INTEGER,
  unique_users INTEGER,
  total_discount_given DECIMAL(10,2),
  conversion_rate DECIMAL(5,2)
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    COALESCE(COUNT(*), 0) as total_usage,
    COALESCE(COUNT(DISTINCT user_id), 0) as unique_users,
    COALESCE(SUM(discount_applied), 0.0) as total_discount_given,
    CASE 
      WHEN (SELECT usage_limit FROM public.promotions WHERE id = p_promotion_id) IS NOT NULL THEN
        (COUNT(*)::DECIMAL / (SELECT usage_limit FROM public.promotions WHERE id = p_promotion_id)) * 100
      ELSE 0.0
    END as conversion_rate
  FROM public.promotion_usage
  WHERE promotion_id = p_promotion_id;
$$;

-- Create function to create promotion
CREATE OR REPLACE FUNCTION public.create_promotion(
  p_title TEXT,
  p_description TEXT,
  p_promotion_type TEXT,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_value DECIMAL(10,2) DEFAULT NULL,
  p_discount_code TEXT DEFAULT NULL,
  p_min_order_amount DECIMAL(10,2) DEFAULT NULL,
  p_max_discount_amount DECIMAL(10,2) DEFAULT NULL,
  p_usage_limit INTEGER DEFAULT NULL,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_target_audience TEXT DEFAULT 'all',
  p_display_location TEXT[] DEFAULT ARRAY['homepage']::TEXT[],
  p_priority INTEGER DEFAULT 1,
  p_banner_image_url TEXT DEFAULT NULL,
  p_banner_text_color TEXT DEFAULT '#000000',
  p_banner_background_color TEXT DEFAULT '#ffffff',
  p_cta_text TEXT DEFAULT 'Learn More',
  p_cta_url TEXT DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promotion_id UUID;
BEGIN
  INSERT INTO public.promotions (
    title, description, promotion_type, discount_type, discount_value,
    discount_code, min_order_amount, max_discount_amount, usage_limit,
    start_date, end_date, target_audience, display_location, priority,
    banner_image_url, banner_text_color, banner_background_color,
    cta_text, cta_url, admin_notes, created_by
  ) VALUES (
    p_title, p_description, p_promotion_type, p_discount_type, p_discount_value,
    p_discount_code, p_min_order_amount, p_max_discount_amount, p_usage_limit,
    p_start_date, p_end_date, p_target_audience, p_display_location, p_priority,
    p_banner_image_url, p_banner_text_color, p_banner_background_color,
    p_cta_text, p_cta_url, p_admin_notes, auth.uid()
  ) RETURNING id INTO v_promotion_id;
  
  RETURN v_promotion_id;
END;
$$;

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage promotions" ON public.promotions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Anyone can view active promotions" ON public.promotions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their promotion usage" ON public.promotion_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all promotion usage" ON public.promotion_usage
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_promotions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_promotions_updated_at();
