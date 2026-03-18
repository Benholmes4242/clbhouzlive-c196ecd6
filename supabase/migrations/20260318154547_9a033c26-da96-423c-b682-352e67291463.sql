-- Fix send_push_notification: add recipient_actor_id and actor_id to the INSERT.
-- The notifications table requires recipient_actor_id NOT NULL (added 20260129).
-- Without this, every notification silently fails with a constraint violation.
-- actor_id is extracted from the data JSONB payload using the notification type.
-- All existing callers are unaffected — no signature change.

CREATE OR REPLACE FUNCTION public.send_push_notification(
  target_user_id uuid,
  notification_type text,
  title text,
  message text,
  data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_preferences JSONB;
  should_send BOOLEAN := false;
  v_actor_id UUID;
BEGIN
  -- Get user notification preferences
  SELECT notification_preferences INTO user_preferences
  FROM public.user_profiles
  WHERE id = target_user_id;

  -- Check if user wants this type of notification
  CASE notification_type
    WHEN 'follow' THEN
      should_send := COALESCE((user_preferences->>'new_follower')::boolean, true);
    WHEN 'like' THEN
      should_send := COALESCE((user_preferences->>'post_likes')::boolean, true);
    WHEN 'comment' THEN
      should_send := COALESCE((user_preferences->>'post_comments')::boolean, true);
    WHEN 'share' THEN
      should_send := COALESCE((user_preferences->>'post_shares')::boolean, true);
    WHEN 'tag' THEN
      should_send := COALESCE((user_preferences->>'tagged_in_post')::boolean, true);
    WHEN 'course_activity' THEN
      should_send := COALESCE((user_preferences->>'course_activity')::boolean, false);
    WHEN 'golf_news' THEN
      should_send := COALESCE((user_preferences->>'golf_news')::boolean, false);
    ELSE
      should_send := true;
  END CASE;

  IF NOT should_send THEN
    RETURN;
  END IF;

  -- Extract actor_id from the data payload.
  -- Each notification type embeds the actor under a known key.
  v_actor_id := CASE notification_type
    WHEN 'tag'     THEN (data->>'tagger_id')::uuid
    WHEN 'follow'  THEN (data->>'follower_id')::uuid
    WHEN 'like'    THEN (data->>'liker_id')::uuid
    WHEN 'comment' THEN (data->>'commenter_id')::uuid
    WHEN 'share'   THEN (data->>'sharer_id')::uuid
    ELSE NULL
  END;

  -- Insert the notification.
  -- recipient_actor_id = target_user_id (the personal actor of the recipient).
  -- actor_id = the person who performed the action (extracted above).
  -- ON CONFLICT DO NOTHING prevents duplicate notifications within the same minute.
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data,
    recipient_actor_type,
    recipient_actor_id,
    actor_id
  )
  VALUES (
    target_user_id,
    notification_type,
    title,
    message,
    data,
    'personal',
    target_user_id,
    v_actor_id
  )
  ON CONFLICT ON CONSTRAINT idx_notifications_dedup DO NOTHING;
END;
$$;