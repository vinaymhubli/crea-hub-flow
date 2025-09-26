-- Simple fix for reordering featured designers
-- Drop the constraint completely and recreate it properly

-- Drop the existing constraint
ALTER TABLE public.featured_designers 
DROP CONSTRAINT IF EXISTS featured_designers_position_check;

-- Add a new constraint that allows any positive integer (more flexible)
-- This allows temporary positions (1000+) during reordering
ALTER TABLE public.featured_designers 
ADD CONSTRAINT featured_designers_position_check 
CHECK ("position" > 0);

-- Function for simple arrow button swaps (1st ↔ 2nd, 2nd ↔ 3rd, etc.)
CREATE OR REPLACE FUNCTION public.swap_featured_designers(
  p_designer_id UUID,
  p_direction TEXT -- 'up' or 'down'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_position INTEGER;
  v_swap_position INTEGER;
  v_swap_designer_id UUID;
BEGIN
  -- Get current position
  SELECT "position" INTO v_current_position
  FROM public.featured_designers
  WHERE designer_id = p_designer_id AND is_active = true;
  
  IF v_current_position IS NULL THEN
    RAISE EXCEPTION 'Designer not found in featured list';
  END IF;
  
  -- Calculate swap position
  IF p_direction = 'up' THEN
    v_swap_position := v_current_position - 1;
    IF v_swap_position < 1 THEN
      RAISE EXCEPTION 'Cannot move up from position 1';
    END IF;
  ELSIF p_direction = 'down' THEN
    v_swap_position := v_current_position + 1;
    IF v_swap_position > 10 THEN
      RAISE EXCEPTION 'Cannot move down from position 10';
    END IF;
  ELSE
    RAISE EXCEPTION 'Direction must be up or down';
  END IF;
  
  -- Get designer at swap position
  SELECT designer_id INTO v_swap_designer_id
  FROM public.featured_designers
  WHERE "position" = v_swap_position AND is_active = true;
  
  IF v_swap_designer_id IS NULL THEN
    RAISE EXCEPTION 'No designer at position %', v_swap_position;
  END IF;
  
  -- Use temporary positions to avoid conflicts
  UPDATE public.featured_designers 
  SET "position" = 999, updated_at = now()
  WHERE designer_id = p_designer_id;
  
  UPDATE public.featured_designers 
  SET "position" = 998, updated_at = now()
  WHERE designer_id = v_swap_designer_id;
  
  -- Swap positions
  UPDATE public.featured_designers 
  SET "position" = v_swap_position, updated_at = now()
  WHERE designer_id = p_designer_id;
  
  UPDATE public.featured_designers 
  SET "position" = v_current_position, updated_at = now()
  WHERE designer_id = v_swap_designer_id;
  
  RETURN true;
END;
$$;

-- Function for setting specific position (insert and shift others)
CREATE OR REPLACE FUNCTION public.set_featured_designer_position(
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
  
  -- Move designer to temporary position first
  UPDATE public.featured_designers 
  SET "position" = 999, updated_at = now()
  WHERE designer_id = p_designer_id;
  
  -- Shift other designers
  IF p_new_position > v_old_position THEN
    -- Moving down: shift designers up
    UPDATE public.featured_designers 
    SET "position" = "position" - 1, updated_at = now()
    WHERE "position" > v_old_position 
      AND "position" <= p_new_position 
      AND is_active = true;
  ELSE
    -- Moving up: shift designers down
    UPDATE public.featured_designers 
    SET "position" = "position" + 1, updated_at = now()
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

-- Keep the old function for backward compatibility
CREATE OR REPLACE FUNCTION public.reorder_featured_designers(
  p_designer_id UUID,
  p_new_position INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use the new set position function
  RETURN public.set_featured_designer_position(p_designer_id, p_new_position);
END;
$$;

-- Function to remove designer from featured list
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
