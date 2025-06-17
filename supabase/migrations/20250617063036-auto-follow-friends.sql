
-- Update the friend accepted notification function to also create follow relationships
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
    
    -- Automatically create follow relationships for both users
    -- User follows friend
    INSERT INTO public.user_follows (follower_id, following_id)
    VALUES (NEW.user_id, NEW.friend_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;
    
    -- Friend follows user
    INSERT INTO public.user_follows (follower_id, following_id)
    VALUES (NEW.friend_id, NEW.user_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;
    
    -- Log for debugging
    RAISE NOTICE 'Created notification and follow relationships for friend request acceptance from % to %', NEW.friend_id, NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
