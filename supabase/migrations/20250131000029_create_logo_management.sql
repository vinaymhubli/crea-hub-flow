-- Create logo_management table
CREATE TABLE IF NOT EXISTS public.logo_management (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_type VARCHAR(50) NOT NULL UNIQUE,
  logo_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.logo_management ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage logos" ON public.logo_management
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR is_admin = true)
    )
  );

CREATE POLICY "Anyone can read active logos" ON public.logo_management
  FOR SELECT USING (is_active = true);

-- Grant permissions
GRANT ALL ON public.logo_management TO authenticated;
GRANT SELECT ON public.logo_management TO anon;

-- Insert default logos
INSERT INTO public.logo_management (logo_type, logo_url, alt_text) VALUES
  ('header_logo', 'https://res.cloudinary.com/dknafpppp/image/upload/v1757697849/logo_final_2_x8c1wu.png', 'meetmydesigners'),
  ('footer_logo', 'https://res.cloudinary.com/dknafpppp/image/upload/v1757697849/logo_final_2_x8c1wu.png', 'meetmydesigners')
ON CONFLICT (logo_type) DO NOTHING;

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_logo_management_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_logo_management_updated_at
  BEFORE UPDATE ON public.logo_management
  FOR EACH ROW
  EXECUTE FUNCTION update_logo_management_updated_at();
