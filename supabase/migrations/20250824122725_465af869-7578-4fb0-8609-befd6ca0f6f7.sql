-- Create user_settings table for storing user preferences
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  currency TEXT NOT NULL DEFAULT 'USD',
  date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  time_format TEXT NOT NULL DEFAULT '12h',
  notifications_email BOOLEAN NOT NULL DEFAULT true,
  notifications_push BOOLEAN NOT NULL DEFAULT true,
  notifications_sms BOOLEAN NOT NULL DEFAULT false,
  notifications_marketing BOOLEAN NOT NULL DEFAULT false,
  privacy_profile_visible BOOLEAN NOT NULL DEFAULT true,
  privacy_contact_info_visible BOOLEAN NOT NULL DEFAULT false,
  privacy_activity_status BOOLEAN NOT NULL DEFAULT true,
  security_two_factor BOOLEAN NOT NULL DEFAULT false,
  security_login_alerts BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_settings
CREATE POLICY "Users can view their own settings" 
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
ON public.user_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();