-- Fix designer_slots validation and allow deactivation without overlap errors

-- Overlap check: skip when deactivating or inserting inactive rows
CREATE OR REPLACE FUNCTION public.check_slot_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.designer_slots ds2 
    WHERE ds2.designer_id = NEW.designer_id 
      AND ds2.day_of_week = NEW.day_of_week 
      AND ds2.is_active = true
      AND ds2.id != COALESCE(NEW.id, gen_random_uuid())
      AND ds2.start_time < NEW.end_time 
      AND ds2.end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Time slots cannot overlap for the same designer on the same day';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Limit check: skip when deactivating or inserting inactive rows
CREATE OR REPLACE FUNCTION public.check_slot_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false THEN
    RETURN NEW;
  END IF;

  IF (
    SELECT COUNT(*) FROM public.designer_slots 
    WHERE designer_id = NEW.designer_id 
      AND day_of_week = NEW.day_of_week 
      AND is_active = true 
      AND id != COALESCE(NEW.id, gen_random_uuid())
  ) >= 6 THEN
    RAISE EXCEPTION 'Maximum 6 slots per day allowed for designer';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Validate times: enforce start < end, minimum 30 minutes when active
CREATE OR REPLACE FUNCTION public.validate_slot_times()
RETURNS TRIGGER AS $$
DECLARE
  duration_minutes integer;
BEGIN
  IF NEW.is_active = true THEN
    IF NEW.start_time >= NEW.end_time THEN
      RAISE EXCEPTION 'Start time must be before end time';
    END IF;

    duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    IF duration_minutes < 30 THEN
      RAISE EXCEPTION 'Minimum slot duration is 30 minutes';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers already exist and will use the updated functions
