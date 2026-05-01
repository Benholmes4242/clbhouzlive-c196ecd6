-- Fix 42P10 errors in friend request triggers.
-- ON CONFLICT ON CONSTRAINT requires a named UNIQUE/EXCLUSION CONSTRAINT,
-- but idx_notifications_dedup is a UNIQUE INDEX (not a constraint).
-- Switching to the column-list form, which accepts unique indexes.

CREATE OR REPLACE FUNCTION public.create_friend_accepted_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    INSERT INTO notifications (
      user_id, type, actor_id, recipient_actor_id,
      title, message, data, entity_type, entity_id, is_read
    )
    VALUES (
      NEW.user_id,
      'friend_accepted',
      NEW.friend_id,
      NEW.user_id,
      'Friend request accepted',
      'accepted your friend request',
      jsonb_build_object('friend_id', NEW.friend_id, 'friendship_id', NEW.id),
      'friendship',
      NEW.id,
      false
    )
    ON CONFLICT (user_id, type, actor_id, entity_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_friend_request_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (
      user_id, type, actor_id, recipient_actor_id,
      title, message, data, entity_type, entity_id, is_read
    )
    VALUES (
      NEW.friend_id,
      'friend_request',
      NEW.user_id,
      NEW.friend_id,
      'Friend request',
      'sent you a friend request',
      jsonb_build_object('requester_id', NEW.user_id, 'request_id', NEW.id),
      'friend_request',
      NEW.id,
      false
    )
    ON CONFLICT (user_id, type, actor_id, entity_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;