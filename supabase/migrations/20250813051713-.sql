-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'designer')) DEFAULT 'customer',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create designers table for designer-specific information
CREATE TABLE public.designers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  bio TEXT,
  skills TEXT[],
  location TEXT,
  rating DECIMAL(3,2) DEFAULT 0.00,
  reviews_count INTEGER DEFAULT 0,
  completion_rate INTEGER DEFAULT 100,
  response_time TEXT DEFAULT '1 hour',
  is_online BOOLEAN DEFAULT false,
  portfolio_images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.designers ENABLE ROW LEVEL SECURITY;

-- Create policies for designers
CREATE POLICY "Designers are viewable by everyone" 
ON public.designers 
FOR SELECT 
USING (true);

CREATE POLICY "Designers can update their own profile" 
ON public.designers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Designers can insert their own profile" 
ON public.designers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  designer_id UUID NOT NULL REFERENCES public.designers(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_hours INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings
CREATE POLICY "Customers can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Designers can view their bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.designers WHERE id = designer_id));

CREATE POLICY "Customers can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their bookings" 
ON public.bookings 
FOR UPDATE 
USING (auth.uid() = customer_id);

CREATE POLICY "Designers can update their bookings" 
ON public.bookings 
FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM public.designers WHERE id = designer_id));

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view messages from their bookings" 
ON public.messages 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT customer_id FROM public.bookings WHERE id = booking_id
    UNION
    SELECT (SELECT user_id FROM public.designers WHERE id = designer_id) FROM public.bookings WHERE id = booking_id
  )
);

CREATE POLICY "Users can send messages to their bookings" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  auth.uid() IN (
    SELECT customer_id FROM public.bookings WHERE id = booking_id
    UNION
    SELECT (SELECT user_id FROM public.designers WHERE id = designer_id) FROM public.bookings WHERE id = booking_id
  )
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking_confirmation', 'booking_update', 'message', 'payment', 'promotion', 'reminder')),
  is_read BOOLEAN DEFAULT false,
  related_id UUID, -- Can reference booking_id or other related entities
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'payment', 'refund', 'withdrawal')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'completed',
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet transactions
CREATE POLICY "Users can view their own transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'customer')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_designers_updated_at
  BEFORE UPDATE ON public.designers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for designer profiles with user info
CREATE VIEW public.designer_profiles AS
SELECT 
  d.*,
  p.full_name,
  p.email,
  p.avatar_url
FROM public.designers d
JOIN public.profiles p ON d.user_id = p.id;

-- Create function to get user wallet balance
CREATE OR REPLACE FUNCTION public.get_wallet_balance(user_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(
    CASE 
      WHEN transaction_type IN ('deposit', 'refund') THEN amount
      WHEN transaction_type IN ('payment', 'withdrawal') THEN -amount
      ELSE 0
    END
  ), 0.00)
  FROM public.wallet_transactions
  WHERE user_id = user_uuid AND status = 'completed';
$$;