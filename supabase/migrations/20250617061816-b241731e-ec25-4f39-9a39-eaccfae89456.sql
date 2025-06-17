
-- Create a table for notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'message', 'other')),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own notifications (to mark as read)
CREATE POLICY "Users can update their notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- System can create notifications for users
CREATE POLICY "System can create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true);

-- Add a trigger to create notifications when friend requests are made
CREATE OR REPLACE FUNCTION public.create_friend_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification for new friend requests (status = 'pending')
  IF NEW.status = 'pending' THEN
    -- Get the requester's display name or username
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT 
      NEW.friend_id,
      'friend_request',
      'New Friend Request',
      COALESCE(up.display_name, up.username, 'Someone') || ' sent you a friend request',
      jsonb_build_object(
        'friend_request_id', NEW.id,
        'requester_id', NEW.user_id,
        'requester_name', COALESCE(up.display_name, up.username, 'Someone')
      )
    FROM public.user_profiles up
    WHERE up.id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for friend request notifications
CREATE TRIGGER friend_request_notification_trigger
  AFTER INSERT ON public.user_friends
  FOR EACH ROW
  EXECUTE FUNCTION public.create_friend_request_notification();

-- Add a trigger to create notifications when friend requests are accepted
CREATE OR REPLACE FUNCTION public.create_friend_accepted_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification when status changes from 'pending' to 'accepted'
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Get the accepter's display name or username
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT 
      NEW.user_id,
      'friend_accepted',
      'Friend Request Accepted',
      COALESCE(up.display_name, up.username, 'Someone') || ' accepted your friend request',
      jsonb_build_object(
        'friend_id', NEW.friend_id,
        'accepter_name', COALESCE(up.display_name, up.username, 'Someone')
      )
    FROM public.user_profiles up
    WHERE up.id = NEW.friend_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for friend accepted notifications
CREATE TRIGGER friend_accepted_notification_trigger
  AFTER UPDATE ON public.user_friends
  FOR EACH ROW
  EXECUTE FUNCTION public.create_friend_accepted_notification();
