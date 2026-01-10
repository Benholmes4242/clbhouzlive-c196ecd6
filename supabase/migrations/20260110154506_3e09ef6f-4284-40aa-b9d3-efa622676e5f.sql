-- Create RPC for efficient message counting (server-side aggregate)
CREATE OR REPLACE FUNCTION public.echo_message_counts(conversation_ids uuid[])
RETURNS TABLE(conversation_id uuid, message_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT ecm.conversation_id, COUNT(*)::bigint as message_count
  FROM echo_conversation_messages ecm
  WHERE ecm.conversation_id = ANY(conversation_ids)
  GROUP BY ecm.conversation_id
$$;