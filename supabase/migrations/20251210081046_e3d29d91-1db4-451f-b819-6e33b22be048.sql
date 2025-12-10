-- Fix batch insert to handle non-UUID entity_id strings gracefully
-- If entity_id cannot be cast to UUID (e.g., 'mock-post-1'), treat as NULL

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
  v_entity_id uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized to use Test Lab RPCs';
  END IF;

  FOR v_notif IN SELECT * FROM jsonb_array_elements(p_notifications)
  LOOP
    -- Try to cast entity_id to UUID, use NULL if invalid
    BEGIN
      v_entity_id := (v_notif->>'entity_id')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      v_entity_id := NULL;
    END;
    
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
      v_entity_id,
      COALESCE((v_notif->>'is_read')::boolean, false),
      COALESCE(v_notif->'data', '{}'::jsonb),
      COALESCE((v_notif->>'created_at')::timestamptz, now())
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;