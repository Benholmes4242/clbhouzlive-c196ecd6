ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_type_check
  CHECK (type = ANY (ARRAY['text','image','video','voice','system','location','course_share','tee_time_share','moment_share','action']));

-- 'action' is SERVER-ONLY. msg_send is the single client path into messages
-- (there is no INSERT policy on the table), so refusing it here is the whole
-- enforcement: no composer, no business account, no direct insert can produce
-- a message that renders a tappable route.
CREATE OR REPLACE FUNCTION public.msg_send(p_conversation_id uuid, p_as_actor_type text, p_as_actor_id uuid, p_body text DEFAULT NULL::text, p_type text DEFAULT 'text'::text, p_attachments jsonb DEFAULT NULL::jsonb, p_reply_to_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT NULL::jsonb, p_client_id uuid DEFAULT NULL::uuid)
 RETURNS messages
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_msg messages; v_preview text;
BEGIN
  IF p_type = 'action' THEN
    RAISE EXCEPTION 'action messages are server-authored only';
  END IF;
  IF p_metadata ? 'action' THEN
    RAISE EXCEPTION 'action metadata is server-authored only';
  END IF;
  IF NOT msg_can_act_as(p_as_actor_type, p_as_actor_id) THEN
    RAISE EXCEPTION 'not authorized to act as this actor';
  END IF;
  IF NOT msg_is_member(p_conversation_id) THEN
    RAISE EXCEPTION 'not a member of this conversation';
  END IF;
  IF (p_body IS NULL OR length(trim(p_body)) = 0)
     AND p_attachments IS NULL AND p_type = 'text' THEN
    RAISE EXCEPTION 'empty message';
  END IF;

  IF p_client_id IS NOT NULL THEN
    SELECT * INTO v_msg FROM messages
     WHERE conversation_id = p_conversation_id AND client_id = p_client_id;
    IF FOUND THEN RETURN v_msg; END IF;
  END IF;

  INSERT INTO messages (conversation_id, sender_actor_type, sender_actor_id,
                        sender_user_id, type, body, attachments, reply_to_id,
                        metadata, client_id)
  VALUES (p_conversation_id, p_as_actor_type, p_as_actor_id, auth.uid(),
          p_type, p_body, p_attachments, p_reply_to_id, p_client_id IS NOT NULL AND FALSE IS NULL AND NULL IS NOT NULL)
  RETURNING * INTO v_msg;

  RETURN v_msg;
END $function$;