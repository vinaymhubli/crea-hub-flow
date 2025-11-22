-- Create a function to delete a user and all their related data
-- This function can only be called by the user themselves (authenticated)

CREATE OR REPLACE FUNCTION public.delete_user_account(user_id_to_delete UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify that the caller is the user they're trying to delete
  IF auth.uid() != user_id_to_delete THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;

  -- Delete related data in the correct order (respecting foreign keys)
  
  -- Delete notifications
  DELETE FROM public.notifications WHERE user_id = user_id_to_delete;
  
  -- Delete messages
  DELETE FROM public.messages WHERE sender_id = user_id_to_delete OR receiver_id = user_id_to_delete;
  
  -- Delete reviews (both given and received)
  DELETE FROM public.reviews WHERE reviewer_id = user_id_to_delete;
  DELETE FROM public.reviews WHERE designer_id IN (SELECT id FROM public.designers WHERE user_id = user_id_to_delete);
  
  -- Delete session work reviews
  DELETE FROM public.session_work_reviews WHERE session_id IN (
    SELECT id FROM public.bookings WHERE customer_id = user_id_to_delete
  );
  
  -- Delete bookings (both as customer and designer)
  DELETE FROM public.bookings WHERE customer_id = user_id_to_delete;
  DELETE FROM public.bookings WHERE designer_id IN (SELECT id FROM public.designers WHERE user_id = user_id_to_delete);
  
  -- Delete active sessions
  DELETE FROM public.active_sessions WHERE customer_id = user_id_to_delete;
  DELETE FROM public.active_sessions WHERE designer_id IN (SELECT id FROM public.designers WHERE user_id = user_id_to_delete);
  
  -- Delete session invoices
  DELETE FROM public.session_invoices WHERE session_id IN (
    SELECT id FROM public.bookings WHERE customer_id = user_id_to_delete OR designer_id IN (SELECT id FROM public.designers WHERE user_id = user_id_to_delete)
  );
  
  -- Delete designer services
  DELETE FROM public.designer_services WHERE designer_id IN (SELECT id FROM public.designers WHERE user_id = user_id_to_delete);
  
  -- Delete designer availability
  DELETE FROM public.designer_availability WHERE designer_id IN (SELECT id FROM public.designers WHERE user_id = user_id_to_delete);
  
  -- Delete wallet transactions
  DELETE FROM public.wallet_transactions WHERE user_id = user_id_to_delete;
  
  -- Delete designer profile
  DELETE FROM public.designers WHERE user_id = user_id_to_delete;
  
  -- Delete user settings
  DELETE FROM public.user_settings WHERE user_id = user_id_to_delete;
  
  -- Delete profile
  DELETE FROM public.profiles WHERE user_id = user_id_to_delete;
  
  -- Finally, delete the auth user (this will cascade to other auth-related tables)
  DELETE FROM auth.users WHERE id = user_id_to_delete;
  
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.delete_user_account(UUID) IS 'Allows a user to delete their own account and all related data';

