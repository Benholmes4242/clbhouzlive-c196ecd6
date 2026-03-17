-- ============================================================================
-- FIX 1: Restore mutual follows on friend request acceptance
-- When a friendship is accepted, both users should auto-follow each other.
-- The follow_notification_trigger on user_follows already skips notifications
-- when users are friends, so this won't cause duplicate notifications.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_friend_accepted_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status changes from pending to accepted
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Notify the original requester that their request was accepted
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
      'friend_accept',
      NEW.friend_id,
      'Friend request accepted',
      'accepted your friend request',
      jsonb_build_object('friend_id', NEW.friend_id, 'friendship_id', NEW.id),
      'friendship',
      NEW.id,
      false
    );

    -- Auto-create mutual follows (idempotent — ON CONFLICT DO NOTHING)
    INSERT INTO user_follows (follower_id, following_id)
    VALUES (NEW.user_id, NEW.friend_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;

    INSERT INTO user_follows (follower_id, following_id)
    VALUES (NEW.friend_id, NEW.user_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.create_friend_accepted_notification() TO authenticated;

-- ============================================================================
-- FIX 3: Fix auto_queue_push_notification column name bug
-- The trigger references upd.is_active but the actual column is "enabled".
-- Also fixes device_id to use provider_id (the OneSignal player ID).
-- This caused ALL push notification queueing to silently fail.
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_queue_push_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue push notification for the user
  -- Look up the user's push devices and queue notifications for each
  INSERT INTO push_notification_queue (user_id, device_id, title, body, data)
  SELECT 
    NEW.user_id,
    upd.provider_id,
    COALESCE(NEW.title, 'New Notification'),
    NEW.message,
    jsonb_build_object(
      'notification_id', NEW.id,
      'type', NEW.type,
      'entity_type', NEW.entity_type,
      'entity_id', NEW.entity_id
    )
  FROM user_push_devices upd
  WHERE upd.user_id = NEW.user_id
    AND upd.enabled = true;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail notification insert if push queueing fails
  RAISE WARNING 'Failed to queue push notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;