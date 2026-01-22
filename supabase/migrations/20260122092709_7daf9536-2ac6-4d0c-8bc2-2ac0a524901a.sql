-- Update create_group_conversation to accept avatar URL
CREATE OR REPLACE FUNCTION create_group_conversation(
  group_name TEXT,
  participant_ids UUID[],
  group_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
  v_participant_id UUID;
BEGIN
  -- Create conversation with avatar
  INSERT INTO conversations (type, name, avatar_url, created_by)
  VALUES ('group', group_name, group_avatar_url, auth.uid())
  RETURNING id INTO v_conversation_id;
  
  -- Add creator as admin
  INSERT INTO conversation_participants (conversation_id, user_id, role)
  VALUES (v_conversation_id, auth.uid(), 'admin');
  
  -- Add other participants as members
  FOREACH v_participant_id IN ARRAY participant_ids
  LOOP
    INSERT INTO conversation_participants (conversation_id, user_id, role)
    VALUES (v_conversation_id, v_participant_id, 'member');
  END LOOP;
  
  RETURN v_conversation_id;
END;
$$;