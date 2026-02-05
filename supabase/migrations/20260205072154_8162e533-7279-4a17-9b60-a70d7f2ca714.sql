-- Fix queue_message_notification trigger to include recipient_actor_id
-- The INSERT INTO notifications was missing recipient_actor_id which is NOT NULL

CREATE OR REPLACE FUNCTION public.queue_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name TEXT;
  v_sender_username TEXT;
  v_sender_avatar TEXT;
  v_conversation_name TEXT;
  v_conversation_type TEXT;
  v_recipient RECORD;
  v_notification_title TEXT;
  v_notification_body TEXT;
BEGIN
  -- Get sender info
  SELECT 
    COALESCE(display_name, username, 'Someone'),
    username,
    profile_photo_url
  INTO v_sender_name, v_sender_username, v_sender_avatar
  FROM public.public_profiles
  WHERE id = NEW.sender_id;
  
  -- Get conversation info
  SELECT type, name INTO v_conversation_type, v_conversation_name
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  -- Build notification title
  v_notification_title := CASE 
    WHEN v_conversation_type = 'direct' THEN 'New message from ' || v_sender_name
    ELSE 'New message in ' || COALESCE(v_conversation_name, 'Group Chat')
  END;
  
  -- Build notification body
  v_notification_body := CASE 
    WHEN NEW.message_type = 'image' THEN v_sender_name || ' sent a photo'
    WHEN NEW.message_type = 'video' THEN v_sender_name || ' sent a video'
    WHEN NEW.message_type = 'course_share' THEN v_sender_name || ' shared a golf course'
    WHEN NEW.message_type = 'moment_share' THEN v_sender_name || ' shared a moment'
    WHEN NEW.message_type = 'tee_time' THEN v_sender_name || ' shared a tee time'
    ELSE LEFT(NEW.content, 100)
  END;
  
  -- Loop through all participants except sender who aren't muted
  FOR v_recipient IN 
    SELECT cp.user_id 
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id
    AND cp.is_muted = false
  LOOP
    -- Queue for push notification
    INSERT INTO public.notification_queue (
      recipient_id, type, title, body, data
    ) VALUES (
      v_recipient.user_id,
      'new_message',
      v_notification_title,
      v_notification_body,
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id,
        'type', 'new_message'
      )
    );
    
    -- Insert in-app notification with recipient_actor_id (THIS WAS MISSING!)
    INSERT INTO public.notifications (
      user_id, type, title, message, data, read, is_read, 
      actor_id, recipient_actor_id, entity_type, created_at, updated_at
    ) VALUES (
      v_recipient.user_id, 'message', v_notification_title, v_notification_body,
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'message_id', NEW.id,
        'message_type', NEW.message_type,
        'sender_name', v_sender_name,
        'sender_username', v_sender_username,
        'sender_avatar', v_sender_avatar,
        'action_url', '/messages/' || NEW.conversation_id
      ),
      false, false, NEW.sender_id, v_recipient.user_id, 'message', NOW(), NOW()
    )
    ON CONFLICT ON CONSTRAINT idx_notifications_dedup DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;