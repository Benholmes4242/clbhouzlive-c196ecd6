-- 1) Add business-level notification preferences (muted_types) to business_accounts
ALTER TABLE public.business_accounts
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.business_accounts.notification_preferences IS
  'Business-level notification preferences. Shape: { muted_types: text[] } — types muted apply to the business inbox + push for all managers.';

-- 2) Update the enqueue trigger to honour business-level mutes
CREATE OR REPLACE FUNCTION public.auto_queue_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  biz_muted text[];
BEGIN
  IF NEW.recipient_actor_type = 'business' THEN
    -- Honour business-level mute (D3 minimal): if this business has muted
    -- NEW.type at the business level, do not enqueue any push for any manager.
    SELECT COALESCE(
             (notification_preferences->'muted_types')::jsonb,
             '[]'::jsonb
           )
      INTO biz_muted
      FROM public.business_accounts
     WHERE id = NEW.recipient_actor_id;

    -- biz_muted is jsonb cast — convert to text[] safely
    IF biz_muted IS NOT NULL AND EXISTS (
      SELECT 1
        FROM jsonb_array_elements_text(
               COALESCE(
                 (SELECT (notification_preferences->'muted_types')
                    FROM public.business_accounts
                   WHERE id = NEW.recipient_actor_id),
                 '[]'::jsonb
               )
             ) AS t(val)
       WHERE t.val = NEW.type
    ) THEN
      RETURN NEW;
    END IF;

    -- Fan out to every manager's active devices
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