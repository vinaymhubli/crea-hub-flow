-- Fix the position constraint to allow temporary position during reordering
-- This allows the reorder_featured_designers function to work properly

-- Drop the existing constraint
ALTER TABLE public.featured_designers 
DROP CONSTRAINT IF EXISTS featured_designers_position_check;

-- Add a new constraint that allows position 0 temporarily
ALTER TABLE public.featured_designers 
ADD CONSTRAINT featured_designers_position_check 
CHECK ("position" >= 0 AND "position" <= 10);

-- Update the reorder function to be more robust
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
  v_temp_position INTEGER;
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
  
  -- Use a temporary position that's outside the normal range
  -- Find the highest position and add 100 to it
  SELECT COALESCE(MAX("position"), 0) + 100 INTO v_temp_position
  FROM public.featured_designers 
  WHERE is_active = true;
  
  -- Temporarily move the designer to the temp position
  UPDATE public.featured_designers 
  SET "position" = v_temp_position
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
