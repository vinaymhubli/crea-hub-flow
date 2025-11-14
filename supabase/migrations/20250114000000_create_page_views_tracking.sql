-- Create page_views table for tracking browser and device information
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  browser_name TEXT,
  browser_version TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  os_name TEXT,
  os_version TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON public.page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_device_type ON public.page_views(device_type);
CREATE INDEX IF NOT EXISTS idx_page_views_browser_name ON public.page_views(browser_name);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert page views (for tracking)
CREATE POLICY "Anyone can insert page views" 
ON public.page_views 
FOR INSERT 
WITH CHECK (true);

-- Policy: Only authenticated users can view their own page views
CREATE POLICY "Users can view their own page views" 
ON public.page_views 
FOR SELECT 
USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Policy: Admins can view all page views
CREATE POLICY "Admins can view all page views" 
ON public.page_views 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  )
);

