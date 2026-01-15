-- Update the create_follow_notification function to populate actor_id
CREATE OR REPLACE FUNCTION public.create_follow_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Skip notification if either user has blocked the other
  IF are_users_blocked(NEW.follower_id, NEW.following_id) THEN
    RETURN NEW;
  END IF;

  -- Skip notification if users are already friends
  -- (to avoid double notification when friend accept creates mutual follows)
  IF EXISTS (
    SELECT 1 FROM user_friends
    WHERE status = 'accepted'
      AND (
        (user_id = NEW.follower_id AND friend_id = NEW.following_id)
        OR (user_id = NEW.following_id AND friend_id = NEW.follower_id)
      )
  ) THEN
    RETURN NEW;
  END IF;

  -- Create notification with actor_id populated for proper user lookup
  INSERT INTO notifications (user_id, type, title, message, actor_id, data)
  VALUES (
    NEW.following_id,
    'follow',
    'New Follower',
    'Someone started following you',
    NEW.follower_id,  -- Populate actor_id for proper profile lookup
    jsonb_build_object('follower_id', NEW.follower_id)  -- Keep for backwards compatibility
  );

  RETURN NEW;
END;
$function$;