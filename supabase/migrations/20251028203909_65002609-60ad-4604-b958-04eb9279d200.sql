-- Create user_pings table for direct user-to-user ping notifications
CREATE TABLE IF NOT EXISTS public.user_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT no_self_ping CHECK (sender_id != recipient_id)
);

-- Enable RLS
ALTER TABLE public.user_pings ENABLE ROW LEVEL SECURITY;

-- Users can see pings they sent or received
CREATE POLICY "Users can view their own pings"
  ON public.user_pings
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send pings
CREATE POLICY "Users can send pings"
  ON public.user_pings
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Create index for efficient queries
CREATE INDEX idx_user_pings_recipient ON public.user_pings(recipient_id, created_at DESC);
CREATE INDEX idx_user_pings_sender ON public.user_pings(sender_id, created_at DESC);

-- Function to send a ping with notification
CREATE OR REPLACE FUNCTION public.send_user_ping(p_recipient_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID;
  v_sender_name TEXT;
  v_recent_ping_count INTEGER;
BEGIN
  -- Get current user
  v_sender_id := auth.uid();
  
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF v_sender_id = p_recipient_id THEN
    RAISE EXCEPTION 'Cannot ping yourself';
  END IF;
  
  -- Rate limiting: Check if user has sent more than 5 pings in last 5 minutes
  SELECT COUNT(*) INTO v_recent_ping_count
  FROM public.user_pings
  WHERE sender_id = v_sender_id
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  IF v_recent_ping_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before sending more pings.';
  END IF;
  
  -- Get sender's display name
  SELECT COALESCE(display_name, username, 'Someone')
  INTO v_sender_name
  FROM public.user_profiles
  WHERE id = v_sender_id;
  
  -- Insert ping record
  INSERT INTO public.user_pings (sender_id, recipient_id)
  VALUES (v_sender_id, p_recipient_id);
  
  -- Send push notification
  PERFORM public.send_push_notification(
    p_recipient_id,
    'ping',
    'New ping 👋',
    v_sender_name || ' is looking to play',
    jsonb_build_object(
      'sender_id', v_sender_id,
      'sender_name', v_sender_name,
      'type', 'ping'
    )
  );
END;
$$;