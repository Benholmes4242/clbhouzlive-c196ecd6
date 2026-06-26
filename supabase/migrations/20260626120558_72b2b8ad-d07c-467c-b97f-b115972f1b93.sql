CREATE OR REPLACE FUNCTION public.auto_queue_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.recipient_actor_type = 'business' THEN
    -- Business recipient: fan out to every manager's active devices
    INSERT INTO push_notification_queue (user_id, device_id, title, body, data)
    SELECT
      bm.user_profile_id,
      upd.device_id,
      COALESCE(NEW.title, 'New Notification'),
      NEW.message,
      jsonb_build_object(
        'notification_id', NEW.id,
        'type', NEW.type,
        'link', NEW.link,
        'recipient_actor_type', NEW.recipient_actor_type,
        'recipient_actor_id', NEW.recipient_actor_id
      )
    FROM business_members bm
    JOIN user_push_devices upd
      ON upd.user_id = bm.user_profile_id
     AND upd.is_active = true
    WHERE bm.business_id = NEW.recipient_actor_id
      AND bm.role IN ('owner', 'admin', 'editor');
  ELSE
    -- Personal recipient: enqueue for the owning user's active devices
    INSERT INTO push_notification_queue (user_id, device_id, title, body, data)
    SELECT
      NEW.user_id,
      upd.device_id,
      COALESCE(NEW.title, 'New Notification'),
      NEW.message,
      jsonb_build_object(
        'notification_id', NEW.id,
        'type', NEW.type,
        'link', NEW.link,
        'recipient_actor_type', COALESCE(NEW.recipient_actor_type, 'personal'),
        'recipient_actor_id', COALESCE(NEW.recipient_actor_id, NEW.user_id)
      )
    FROM user_push_devices upd
    WHERE upd.user_id = NEW.user_id
      AND upd.is_active = true;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to queue push notification: %', SQLERRM;
  RETURN NEW;
END;
$$;