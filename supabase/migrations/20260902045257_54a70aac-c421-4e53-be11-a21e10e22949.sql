CREATE OR REPLACE FUNCTION public.msg_send(p_conversation_id uuid, p_as_actor_type text, p_as_actor_id uuid, p_body text DEFAULT NULL::text, p_type text DEFAULT 'text'::text, p_attachments jsonb DEFAULT NULL::jsonb, p_reply_to_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT NULL::jsonb, p_client_id uuid DEFAULT NULL::uuid)
 RETURNS messages
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_msg messages; v_preview text;
BEGIN
  -- 'action' messages are server-authored only. msg_send is the sole client
  -- path into public.messages (the table has no INSERT policy), so refusing
  -- it here is the whole enforcement.
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
          p_type, p_body, p_attachments, p_reply_to_id, p_metadata, p_client_id)
  RETURNING * INTO v_msg;

  v_preview := left(coalesce(nullif(trim(p_body), ''),
                    CASE p_type WHEN 'image' THEN 'Photo' WHEN 'video' THEN 'Video'
                                WHEN 'voice' THEN 'Voice message' ELSE 'Attachment' END), 140);

  UPDATE conversations
     SET last_message_at = v_msg.created_at, last_message_preview = v_preview, updated_at = now()
   WHERE id = p_conversation_id;

  UPDATE conversation_members SET last_read_message_id = v_msg.id
   WHERE conversation_id = p_conversation_id
     AND actor_type = p_as_actor_type AND actor_id = p_as_actor_id;

  INSERT INTO push_notification_queue (user_id, title, body, data)
  SELECT DISTINCT bm_user.uid, 'New message', v_preview,
         jsonb_build_object('type','message','conversation_id',p_conversation_id)
  FROM conversation_members cm
  LEFT JOIN LATERAL (
    SELECT CASE WHEN cm.actor_type='personal' THEN cm.actor_id ELSE bmx.user_profile_id END AS uid
    FROM (SELECT 1) _
    LEFT JOIN business_members bmx ON cm.actor_type='business' AND bmx.business_id = cm.actor_id
  ) bm_user ON true
  WHERE cm.conversation_id = p_conversation_id
    AND cm.left_at IS NULL
    AND cm.muted_until IS NULL
    AND bm_user.uid IS NOT NULL
    AND bm_user.uid <> auth.uid();

  RETURN v_msg;
END $function$;