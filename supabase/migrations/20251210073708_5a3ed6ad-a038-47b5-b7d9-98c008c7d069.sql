-- Fix Test Lab notification functions: entity_id should be uuid, not text

-- 7. Test Lab: Insert notification (fixed entity_id type)
CREATE OR REPLACE FUNCTION test_lab_insert_notification(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_message text DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_is_read boolean DEFAULT false,
  p_data jsonb DEFAULT NULL,
  p_created_at timestamptz DEFAULT now()
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized to use Test Lab RPCs';
  END IF;

  INSERT INTO notifications (user_id, actor_id, type, title, message, entity_type, entity_id, is_read, data, created_at)
  VALUES (p_user_id, p_actor_id, p_type, p_title, p_message, p_entity_type, p_entity_id, p_is_read, p_data, p_created_at)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 8. Test Lab: Batch insert notifications (fixed entity_id type)
CREATE OR REPLACE FUNCTION test_lab_insert_notifications_batch(
  p_notifications jsonb
)
RETURNS int
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int := 0;
  v_notif jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized to use Test Lab RPCs';
  END IF;

  FOR v_notif IN SELECT * FROM jsonb_array_elements(p_notifications)
  LOOP
    INSERT INTO notifications (
      user_id, 
      actor_id, 
      type, 
      title, 
      message, 
      entity_type, 
      entity_id, 
      is_read, 
      data, 
      created_at
    ) VALUES (
      (v_notif->>'user_id')::uuid,
      (v_notif->>'actor_id')::uuid,
      v_notif->>'type',
      v_notif->>'title',
      v_notif->>'message',
      v_notif->>'entity_type',
      NULLIF(v_notif->>'entity_id', '')::uuid,
      COALESCE((v_notif->>'is_read')::boolean, false),
      COALESCE(v_notif->'data', '{}'::jsonb),
      COALESCE((v_notif->>'created_at')::timestamptz, now())
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;