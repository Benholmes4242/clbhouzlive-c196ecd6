
CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id uuid,
  p_content text,
  p_message_type text,
  p_media_url text,
  p_media_metadata jsonb,
  p_reply_to_id uuid,
  p_sender_actor_type text,
  p_sender_actor_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  new_message_id uuid;
  is_participant boolean;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_sender_actor_type NOT IN ('personal','business') THEN
    RAISE EXCEPTION 'Invalid sender actor type %', p_sender_actor_type;
  END IF;

  -- Impersonation guard: caller must own the actor they are sending as
  IF p_sender_actor_type = 'personal' THEN
    IF p_sender_actor_id IS DISTINCT FROM current_user_id THEN
      RAISE EXCEPTION 'Cannot send as another personal user';
    END IF;
  ELSE
    IF NOT public.user_manages_business(current_user_id, p_sender_actor_id) THEN
      RAISE EXCEPTION 'Caller does not manage this business';
    END IF;
  END IF;

  -- Verify the active actor is a participant in the conversation
  SELECT EXISTS(
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.actor_type = p_sender_actor_type
      AND (
        (p_sender_actor_type = 'personal' AND cp.user_id = current_user_id)
        OR (p_sender_actor_type = 'business' AND cp.actor_id = p_sender_actor_id)
      )
  ) INTO is_participant;

  IF NOT is_participant THEN
    RAISE EXCEPTION 'Actor is not a participant in this conversation';
  END IF;

  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    sender_actor_type,
    sender_actor_id,
    content,
    message_type,
    media_url,
    media_metadata,
    reply_to_id
  )
  VALUES (
    p_conversation_id,
    current_user_id,
    p_sender_actor_type,
    p_sender_actor_id,
    p_content,
    p_message_type,
    p_media_url,
    p_media_metadata,
    p_reply_to_id
  )
  RETURNING id INTO new_message_id;

  UPDATE public.conversations
  SET
    last_message_at = NOW(),
    last_message_preview = LEFT(p_content, 100),
    updated_at = NOW()
  WHERE id = p_conversation_id;

  RETURN new_message_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_message(uuid, text, text, text, jsonb, uuid, text, uuid) TO authenticated;
