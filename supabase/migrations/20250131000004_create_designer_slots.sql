-- Create designer_slots table for multiple time slots per day
CREATE TABLE IF NOT EXISTS public.designer_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  designer_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_designer_slots_designer_day ON public.designer_slots(designer_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_designer_slots_active ON public.designer_slots(is_active);

-- Enable RLS
ALTER TABLE public.designer_slots ENABLE ROW LEVEL SECURITY;

-- RLS policies for designer_slots
CREATE POLICY "Designers can view their own slots" 
ON public.designer_slots 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

CREATE POLICY "Designers can insert their own slots" 
ON public.designer_slots 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

CREATE POLICY "Designers can update their own slots" 
ON public.designer_slots 
FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id))
WITH CHECK (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

CREATE POLICY "Designers can delete their own slots" 
ON public.designer_slots 
FOR DELETE 
USING (auth.uid() = (SELECT user_id FROM designers WHERE id = designer_id));

-- Allow admins to manage all slots
CREATE POLICY "Admins can view all slots" 
ON public.designer_slots 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert slots" 
ON public.designer_slots 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all slots" 
ON public.designer_slots 
FOR UPDATE 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all slots" 
ON public.designer_slots 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- Allow public to view active slots (for booking availability)
CREATE POLICY "Public can view active slots" 
ON public.designer_slots 
FOR SELECT 
USING (is_active = true);

-- Function to check for overlapping slots
CREATE OR REPLACE FUNCTION check_slot_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping slots for the same designer on the same day
  IF EXISTS (
    SELECT 1 FROM public.designer_slots ds2 
    WHERE ds2.designer_id = NEW.designer_id 
      AND ds2.day_of_week = NEW.day_of_week 
      AND ds2.is_active = true
      AND ds2.id != COALESCE(NEW.id, gen_random_uuid())
      AND (
        (ds2.start_time < NEW.end_time AND ds2.end_time > NEW.start_time)
      )
  ) THEN
    RAISE EXCEPTION 'Time slots cannot overlap for the same designer on the same day';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if adding a slot would exceed 6 slots per day
CREATE OR REPLACE FUNCTION check_slot_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Count existing active slots for this designer on this day
  IF (SELECT COUNT(*) FROM public.designer_slots 
      WHERE designer_id = NEW.designer_id 
        AND day_of_week = NEW.day_of_week 
        AND is_active = true 
        AND id != COALESCE(NEW.id, gen_random_uuid())) >= 6 THEN
    RAISE EXCEPTION 'Maximum 6 slots per day allowed for designer';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check for overlapping slots
CREATE TRIGGER check_slot_overlap
  BEFORE INSERT OR UPDATE ON public.designer_slots
  FOR EACH ROW
  EXECUTE FUNCTION check_slot_overlap();

-- Create trigger to enforce slot limit
CREATE TRIGGER enforce_slot_limit
  BEFORE INSERT OR UPDATE ON public.designer_slots
  FOR EACH ROW
  EXECUTE FUNCTION check_slot_limit();

-- Function to validate time slots (start_time < end_time)
CREATE OR REPLACE FUNCTION validate_slot_times()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_time >= NEW.end_time THEN
    RAISE EXCEPTION 'Start time must be before end time';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate slot times
CREATE TRIGGER validate_slot_times
  BEFORE INSERT OR UPDATE ON public.designer_slots
  FOR EACH ROW
  EXECUTE FUNCTION validate_slot_times();
