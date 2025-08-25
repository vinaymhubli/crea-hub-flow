-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add new notification preference columns to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN booking_reminders boolean NOT NULL DEFAULT true,
ADD COLUMN message_notifications boolean NOT NULL DEFAULT true;

-- Enable realtime for notifications and wallet_transactions
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.wallet_transactions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE public.notifications;
ALTER publication supabase_realtime ADD TABLE public.wallet_transactions;