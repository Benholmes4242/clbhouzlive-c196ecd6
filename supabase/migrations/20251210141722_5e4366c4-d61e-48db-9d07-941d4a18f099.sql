
-- Drop the old version with p_entity_id as TEXT
DROP FUNCTION IF EXISTS test_lab_insert_notification(uuid, uuid, text, text, text, text, text, boolean, jsonb, timestamptz);

-- Ensure we have only the correct UUID version
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
