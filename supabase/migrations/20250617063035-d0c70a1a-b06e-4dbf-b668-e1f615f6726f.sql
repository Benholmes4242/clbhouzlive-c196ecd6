
-- First, let's check if the triggers exist and recreate them properly
DROP TRIGGER IF EXISTS friend_request_notification_trigger ON public.user_friends;
DROP TRIGGER IF EXISTS friend_accepted_notification_trigger ON public.user_friends;

-- Recreate the friend request notification function with better debugging
CREATE OR REPLACE FUNCTION public.create_friend_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification for new friend requests (status = 'pending')
  IF NEW.status = 'pending' THEN
    -- Get the requester's display name or username and create notification
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
    
    -- Log for debugging
    RAISE NOTICE 'Created notification for friend request from % to %', NEW.user_id, NEW.friend_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the friend accepted notification function
CREATE OR REPLACE FUNCTION public.create_friend_accepted_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification when status changes from 'pending' to 'accepted'
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Get the accepter's display name or username and create notification
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
    
    -- Log for debugging
    RAISE NOTICE 'Created notification for friend request acceptance from % to %', NEW.friend_id, NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the triggers
CREATE TRIGGER friend_request_notification_trigger
  AFTER INSERT ON public.user_friends
  FOR EACH ROW
  EXECUTE FUNCTION public.create_friend_request_notification();

CREATE TRIGGER friend_accepted_notification_trigger
  AFTER UPDATE ON public.user_friends
  FOR EACH ROW
  EXECUTE FUNCTION public.create_friend_accepted_notification();

-- Also manually create notifications for the existing friend requests that didn't get notifications
INSERT INTO public.notifications (user_id, type, title, message, data)
SELECT 
  uf.friend_id,
  'friend_request',
  'New Friend Request',
  COALESCE(up.display_name, up.username, 'Someone') || ' sent you a friend request',
  jsonb_build_object(
    'friend_request_id', uf.id,
    'requester_id', uf.user_id,
    'requester_name', COALESCE(up.display_name, up.username, 'Someone')
  )
FROM public.user_friends uf
LEFT JOIN public.user_profiles up ON up.id = uf.user_id
WHERE uf.status = 'pending' 
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications n 
    WHERE n.user_id = uf.friend_id 
      AND n.type = 'friend_request' 
      AND n.data->>'friend_request_id' = uf.id::text
  );
