-- Create pricing plans management system
-- This migration creates tables for managing pricing plans through admin panel

-- Create pricing_plans table
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL, -- Can be "Free", "₹29", "Custom", etc.
  period TEXT, -- "/month", "/year", etc.
  description TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of features
  button_text TEXT NOT NULL DEFAULT 'Get Started',
  button_url TEXT DEFAULT '/auth', -- Where the button should link
  is_popular BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  plan_type TEXT NOT NULL DEFAULT 'customer' CHECK (plan_type IN ('customer', 'designer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create designer_pricing table for designer-specific pricing
CREATE TABLE IF NOT EXISTS public.designer_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  platform_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  features JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of features
  button_text TEXT NOT NULL DEFAULT 'Join as Designer',
  button_url TEXT DEFAULT '/auth',
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_plans_published ON public.pricing_plans(is_published);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_type ON public.pricing_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_sort ON public.pricing_plans(sort_order);
CREATE INDEX IF NOT EXISTS idx_designer_pricing_published ON public.designer_pricing(is_published);

-- Insert default pricing plans
INSERT INTO public.pricing_plans (name, price, period, description, features, button_text, is_popular, plan_type, sort_order) VALUES
('Starter', 'Free', NULL, 'Perfect for trying out our platform', 
 '["Browse designer profiles", "View portfolios and reviews", "Send 3 consultation requests per month", "Basic messaging", "Community access"]'::jsonb,
 'Get Started', false, 'customer', 1),
('Professional', '₹29', '/month', 'Best for regular design projects',
 '["Everything in Starter", "Unlimited consultation requests", "Priority designer matching", "Advanced messaging features", "Project management tools", "24/7 support", "Custom project templates"]'::jsonb,
 'Start Free Trial', true, 'customer', 2),
('Enterprise', 'Custom', NULL, 'For teams and large organizations',
 '["Everything in Professional", "Dedicated account manager", "Custom integrations", "Advanced analytics", "Team collaboration tools", "Custom contracts", "SLA guarantee", "White-label options"]'::jsonb,
 'Contact Sales', false, 'customer', 3);

-- Insert default designer pricing
INSERT INTO public.designer_pricing (title, description, platform_fee_percentage, features, button_text) VALUES
('Designer Plan', 'Everything you need to succeed as a designer', 5.00,
 '["0% platform fee for first 30 days", "5% platform fee after trial", "Weekly payments", "Designer verification badge", "Portfolio showcase", "Client matching algorithm"]'::jsonb,
 'Join as Designer');

-- Enable RLS
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_pricing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view published pricing plans" ON public.pricing_plans
  FOR SELECT USING (is_published = true);

CREATE POLICY "Anyone can view published designer pricing" ON public.designer_pricing
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage pricing plans" ON public.pricing_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage designer pricing" ON public.designer_pricing
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
