-- Create toggle_conversation_mute function
CREATE OR REPLACE FUNCTION public.toggle_conversation_mute(
  p_conversation_id UUID,
  p_mute BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversation_participants
  SET is_muted = p_mute
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
END;
$$;

-- Create leave_group_conversation function
CREATE OR REPLACE FUNCTION public.leave_group_conversation(
  p_conversation_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_type TEXT;
BEGIN
  -- Check if it's a group conversation
  SELECT type INTO v_conversation_type
  FROM conversations
  WHERE id = p_conversation_id;
  
  IF v_conversation_type != 'group' THEN
    RAISE EXCEPTION 'Cannot leave a non-group conversation';
  END IF;
  
  -- Remove the user from the conversation
  DELETE FROM conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
    
  -- Insert a system message about leaving
  INSERT INTO messages (conversation_id, sender_id, content, message_type, media_metadata)
  VALUES (
    p_conversation_id,
    auth.uid(),
    'left the group',
    'system',
    jsonb_build_object('action', 'member_left', 'user_id', auth.uid())
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.toggle_conversation_mute(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_group_conversation(UUID) TO authenticated;