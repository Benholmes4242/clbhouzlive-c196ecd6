-- Fix the trigger function to use 'friend_accept' instead of 'friend_accepted'
-- The notifications table check constraint expects 'friend_accept' not 'friend_accepted'

CREATE OR REPLACE FUNCTION public.create_friend_accepted_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create notification if status changed from pending to accepted
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Notify the original requester (user_id) that their request was accepted
    -- Using SECURITY DEFINER with explicit INSERT bypasses RLS
    INSERT INTO public.notifications (
      user_id, 
      type, 
      actor_id, 
      title, 
      message, 
      data, 
      entity_type, 
      entity_id,
      is_read
    )
    VALUES (
      NEW.user_id,
      'friend_accept',  -- Fixed: was 'friend_accepted', should be 'friend_accept'
      NEW.friend_id,
      'Friend request accepted',
      'accepted your friend request',
      jsonb_build_object('friend_id', NEW.friend_id, 'friendship_id', NEW.id),
      'friendship',
      NEW.id,
      false
    );
  END IF;
  RETURN NEW;
END;
$function$;