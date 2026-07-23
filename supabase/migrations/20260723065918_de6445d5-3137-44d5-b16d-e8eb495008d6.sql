CREATE OR REPLACE FUNCTION public.auto_queue_push_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  inserted_count integer := 0;
  base_data jsonb;
BEGIN
  -- Trigger-supplied defaults on the LEFT; caller-supplied NEW.data on the RIGHT
  -- so keys in NEW.data (e.g. an explicit `route`) win over our defaults.
  base_data := jsonb_build_object(
    'notification_id', NEW.id,
    'type', NEW.type,
    'entity_type', NEW.entity_type,
    'entity_id', NEW.entity_id,
    'actor_user_id', NEW.actor_user_id
  ) || COALESCE(NEW.data, '{}'::jsonb);

  IF NEW.recipient_actor_type = 'business' THEN
    IF EXISTS (
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

    INSERT INTO push_notification_queue (user_id, device_id, title, body, data)
    SELECT
      bm.user_profile_id,
      upd.onesignal_external_id,
      COALESCE(NEW.title, 'New Notification'),
      COALESCE(NULLIF(TRIM(NEW.message), ''), NEW.title, 'New notification'),
      base_data || jsonb_build_object(
        'recipient_actor_type', NEW.recipient_actor_type,
        'recipient_actor_id', NEW.recipient_actor_id
      )
    FROM business_members bm
    JOIN user_push_devices upd
      ON upd.user_id = bm.user_profile_id
     AND upd.enabled = true
     AND upd.onesignal_external_id IS NOT NULL
    WHERE bm.business_id = NEW.recipient_actor_id
      AND bm.role IN ('owner', 'admin', 'editor');
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  ELSE
    INSERT INTO push_notification_queue (user_id, device_id, title, body, data)
    SELECT
      NEW.user_id,
      upd.onesignal_external_id,
      COALESCE(NEW.title, 'New Notification'),
      COALESCE(NULLIF(TRIM(NEW.message), ''), NEW.title, 'New notification'),
      base_data || jsonb_build_object(
        'recipient_actor_type', COALESCE(NEW.recipient_actor_type, 'personal'),
        'recipient_actor_id', COALESCE(NEW.recipient_actor_id, NEW.user_id)
      )
    FROM user_push_devices upd
    WHERE upd.user_id = NEW.user_id
      AND upd.enabled = true
      AND upd.onesignal_external_id IS NOT NULL;
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto_queue_push_notification failed notif_id=% type=% recipient_actor_type=% recipient_actor_id=% user_id=% sqlstate=% sqlerrm=%',
    NEW.id, NEW.type, NEW.recipient_actor_type, NEW.recipient_actor_id, NEW.user_id, SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$function$;