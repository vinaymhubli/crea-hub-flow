-- Create designer availability settings table
CREATE TABLE public.designer_availability_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  designer_id UUID NOT NULL,
  buffer_time_minutes INTEGER NOT NULL DEFAULT 15,
  auto_accept_bookings BOOLEAN NOT NULL DEFAULT false,
  working_hours_start TIME DEFAULT '09:00:00',
  working_hours_end TIME DEFAULT '17:00:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(designer_id)
);

-- Create weekly schedule table
CREATE TABLE public.designer_weekly_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  designer_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  is_available BOOLEAN NOT NULL DEFAULT true,
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '17:00:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(designer_id, day_of_week)
);

-- Create special days table for exceptions
CREATE TABLE public.designer_special_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  designer_id UUID NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT false,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(designer_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.designer_availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_weekly_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_special_days ENABLE ROW LEVEL SECURITY;

-- RLS policies for designer_availability_settings
CREATE POLICY "Designers can view their own availability settings" 
ON public.designer_availability_settings 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

CREATE POLICY "Designers can insert their own availability settings" 
ON public.designer_availability_settings 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

CREATE POLICY "Designers can update their own availability settings" 
ON public.designer_availability_settings 
FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

-- RLS policies for designer_weekly_schedule
CREATE POLICY "Designers can view their own weekly schedule" 
ON public.designer_weekly_schedule 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

CREATE POLICY "Designers can insert their own weekly schedule" 
ON public.designer_weekly_schedule 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

CREATE POLICY "Designers can update their own weekly schedule" 
ON public.designer_weekly_schedule 
FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

CREATE POLICY "Designers can delete their own weekly schedule" 
ON public.designer_weekly_schedule 
FOR DELETE 
USING (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

-- RLS policies for designer_special_days
CREATE POLICY "Designers can view their own special days" 
ON public.designer_special_days 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

CREATE POLICY "Designers can insert their own special days" 
ON public.designer_special_days 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

CREATE POLICY "Designers can update their own special days" 
ON public.designer_special_days 
FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

CREATE POLICY "Designers can delete their own special days" 
ON public.designer_special_days 
FOR DELETE 
USING (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

-- Add triggers for updated_at
CREATE TRIGGER update_designer_availability_settings_updated_at
BEFORE UPDATE ON public.designer_availability_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_designer_weekly_schedule_updated_at
BEFORE UPDATE ON public.designer_weekly_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_designer_special_days_updated_at
BEFORE UPDATE ON public.designer_special_days
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();