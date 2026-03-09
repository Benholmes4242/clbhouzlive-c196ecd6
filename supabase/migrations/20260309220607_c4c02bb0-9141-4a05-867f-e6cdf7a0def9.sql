CREATE OR REPLACE FUNCTION get_conversation_last_senders(p_conversation_ids uuid[])
RETURNS TABLE (
  conversation_id uuid,
  sender_id uuid,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT ON (conversation_id)
    conversation_id,
    sender_id,
    created_at
  FROM messages
  WHERE conversation_id = ANY(p_conversation_ids)
    AND deleted_at IS NULL
  ORDER BY conversation_id, created_at DESC;
$$;