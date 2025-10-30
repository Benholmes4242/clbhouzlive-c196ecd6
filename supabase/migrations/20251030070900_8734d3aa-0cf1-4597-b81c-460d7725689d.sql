-- Create/open chat for a game (idempotent)
CREATE OR REPLACE FUNCTION public.game_thread_open_for_game(p_game_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_auth_uid();
  v_is_host boolean;
  v_is_accepted boolean;
  v_thread_id uuid;
  v_created boolean := false;
  v_game_expires_at timestamptz;
BEGIN
  SELECT (g.host_user_id = v_uid) AS is_host, g.expires_at
    INTO v_is_host, v_game_expires_at
  FROM public.games g
  WHERE g.id = p_game_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'game not found';
  END IF;

  IF NOT v_is_host THEN
    SELECT TRUE
      INTO v_is_accepted
    FROM public.game_participants gp
    WHERE gp.game_id = p_game_id
      AND gp.user_id = v_uid
      AND gp.state = 'accepted';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'not authorized to open chat';
    END IF;
  END IF;

  INSERT INTO public.game_threads (game_id, expires_at)
  VALUES (p_game_id, v_game_expires_at)
  ON CONFLICT (game_id) DO NOTHING;

  SELECT id INTO v_thread_id
  FROM public.game_threads WHERE game_id = p_game_id;

  GET DIAGNOSTICS v_created = ROW_COUNT;

  INSERT INTO public.game_thread_participants (thread_id, user_id, role)
  SELECT v_thread_id, g.host_user_id, 'host'
  FROM public.games g
  WHERE g.id = p_game_id
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  INSERT INTO public.game_thread_participants (thread_id, user_id, role)
  SELECT v_thread_id, gp.user_id, 'player'
  FROM public.game_participants gp
  WHERE gp.game_id = p_game_id
    AND gp.state = 'accepted'
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1 FROM public.game_thread_messages m
    WHERE m.thread_id = v_thread_id
  ) THEN
    INSERT INTO public.game_thread_messages (thread_id, sender_id, text, is_system)
    VALUES (v_thread_id, v_uid, 'Chat opened for this game. You can message here until the round ends.', TRUE);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'thread_id', v_thread_id,
    'created', v_created
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.game_thread_open_for_game(uuid) TO authenticated;

-- Fast resync helper (host only)
CREATE OR REPLACE FUNCTION public.game_thread_sync(p_game_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_auth_uid();
  v_thread_id uuid;
BEGIN
  PERFORM 1
  FROM public.games g
  WHERE g.id = p_game_id
    AND g.host_user_id = v_uid
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  PERFORM 1 FROM public.game_threads gt WHERE gt.game_id = p_game_id;
  IF NOT FOUND THEN
    INSERT INTO public.game_threads (game_id, expires_at)
    SELECT g.id, g.expires_at FROM public.games g WHERE g.id = p_game_id;
  END IF;

  SELECT id INTO v_thread_id FROM public.game_threads WHERE game_id = p_game_id;

  INSERT INTO public.game_thread_participants (thread_id, user_id, role)
  SELECT v_thread_id, g.host_user_id, 'host'
  FROM public.games g
  WHERE g.id = p_game_id
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  INSERT INTO public.game_thread_participants (thread_id, user_id, role)
  SELECT v_thread_id, gp.user_id, 'player'
  FROM public.game_participants gp
  WHERE gp.game_id = p_game_id
    AND gp.state = 'accepted'
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'thread_id', v_thread_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.game_thread_sync(uuid) TO authenticated;

-- Generic system message helper
CREATE OR REPLACE FUNCTION public.game_thread_system_message(
  p_game_id uuid,
  p_text text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_auth_uid();
  v_thread_id uuid;
  v_allowed boolean;
  v_msg_id uuid;
BEGIN
  SELECT TRUE INTO v_allowed
  FROM public.games g
  WHERE g.id = p_game_id AND g.host_user_id = v_uid;

  IF NOT v_allowed THEN
    SELECT TRUE INTO v_allowed
    FROM public.game_participants gp
    WHERE gp.game_id = p_game_id
      AND gp.user_id = v_uid
      AND gp.state = 'accepted';
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'not authorized to post system message';
  END IF;

  PERFORM public.game_thread_open_for_game(p_game_id);

  SELECT id INTO v_thread_id
  FROM public.game_threads
  WHERE game_id = p_game_id;

  INSERT INTO public.game_thread_messages (thread_id, sender_id, text, is_system)
  VALUES (v_thread_id, v_uid, p_text, TRUE)
  RETURNING id INTO v_msg_id;

  RETURN v_msg_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.game_thread_system_message(uuid, text) TO authenticated;

-- Member event message logger
CREATE OR REPLACE FUNCTION public.game_thread_log_member_event(
  p_game_id uuid,
  p_user_id uuid,
  p_event text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_text text;
BEGIN
  SELECT COALESCE(up.display_name, up.username, left(p_user_id::text, 8))
    INTO v_name
  FROM public.user_profiles up
  WHERE up.id = p_user_id;

  IF p_event = 'request_accepted' THEN
    v_text := format('%s joined the game.', v_name);
  ELSIF p_event = 'tag_accepted' THEN
    v_text := format('%s accepted their reserved seat.', v_name);
  ELSIF p_event = 'tag_declined' THEN
    v_text := format('%s declined their reserved seat.', v_name);
  ELSIF p_event = 'tag_released' THEN
    v_text := format('%s''s reserved seat was released by the host.', v_name);
  ELSIF p_event = 'removed' THEN
    v_text := format('%s was removed from the game by the host.', v_name);
  ELSE
    v_text := format('%s updated their status.', v_name);
  END IF;

  RETURN public.game_thread_system_message(p_game_id, v_text);
END;
$$;

GRANT EXECUTE ON FUNCTION public.game_thread_log_member_event(uuid, uuid, text) TO authenticated;

-- Update game_request_decide to log system messages
CREATE OR REPLACE FUNCTION public.game_request_decide(
  p_request_id uuid,
  p_decision text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_auth_uid();
  v_game_id uuid;
  v_requester uuid;
  v_status text;
  v_slots_open int;
  v_part_exists boolean;
BEGIN
  IF p_decision NOT IN ('accept','decline') THEN
    RAISE EXCEPTION 'invalid decision';
  END IF;

  SELECT gr.game_id, gr.requester_user_id, gr.status
    INTO v_game_id, v_requester, v_status
  FROM public.game_join_requests gr
  WHERE gr.id = p_request_id
  FOR UPDATE;

  IF v_game_id IS NULL THEN
    RAISE EXCEPTION 'request not found';
  END IF;

  PERFORM 1
  FROM public.games g
  WHERE g.id = v_game_id
    AND g.host_user_id = v_uid
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'request already decided';
  END IF;

  IF p_decision = 'decline' THEN
    UPDATE public.game_join_requests
      SET status = 'declined', decided_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
      'ok', true,
      'game_id', v_game_id,
      'decision', 'declined'
    );
  END IF;

  SELECT slots_open INTO v_slots_open
  FROM public.games
  WHERE id = v_game_id
  FOR UPDATE;

  IF v_slots_open <= 0 THEN
    RAISE EXCEPTION 'no open seats';
  END IF;

  SELECT TRUE INTO v_part_exists
  FROM public.game_participants gp
  WHERE gp.game_id = v_game_id AND gp.user_id = v_requester
  FOR UPDATE;

  IF v_part_exists THEN
    UPDATE public.game_participants
      SET state = 'accepted',
          reserves_slot = TRUE,
          joined_at = COALESCE(joined_at, now()),
          updated_at = now()
    WHERE game_id = v_game_id AND user_id = v_requester;
  ELSE
    INSERT INTO public.game_participants (game_id, user_id, role, state, reserves_slot, joined_at)
    VALUES (v_game_id, v_requester, 'player', 'accepted', TRUE, now())
    ON CONFLICT (game_id, user_id) DO UPDATE
      SET state = EXCLUDED.state,
          reserves_slot = EXCLUDED.reserves_slot,
          joined_at = COALESCE(game_participants.joined_at, EXCLUDED.joined_at),
          updated_at = now();
  END IF;

  UPDATE public.games
    SET slots_open = slots_open - 1, updated_at = now()
  WHERE id = v_game_id;

  UPDATE public.game_join_requests
    SET status = 'accepted', decided_at = now()
  WHERE id = p_request_id;

  PERFORM public.game_thread_open_for_game(v_game_id);
  PERFORM public.game_thread_log_member_event(v_game_id, v_requester, 'request_accepted');

  RETURN jsonb_build_object(
    'ok', true,
    'game_id', v_game_id,
    'decision', 'accepted'
  );
END;
$$;

-- Update game_tag_accept to log system messages
CREATE OR REPLACE FUNCTION public.game_tag_accept(p_game_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_auth_uid();
  v_exists boolean;
BEGIN
  SELECT TRUE INTO v_exists
  FROM public.game_participants gp
  WHERE gp.game_id = p_game_id
    AND gp.user_id = v_uid
    AND gp.role = 'player'
    AND gp.state = 'invited'
    AND gp.reserves_slot = TRUE
  FOR UPDATE;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'no reserved invite found';
  END IF;

  UPDATE public.game_participants
    SET state = 'accepted',
        joined_at = COALESCE(joined_at, now()),
        updated_at = now()
  WHERE game_id = p_game_id
    AND user_id = v_uid;

  PERFORM public.game_thread_open_for_game(p_game_id);
  PERFORM public.game_thread_log_member_event(p_game_id, v_uid, 'tag_accepted');

  RETURN jsonb_build_object('ok', true, 'action', 'tag_accept');
END;
$$;

-- Update game_tag_decline to log system messages
CREATE OR REPLACE FUNCTION public.game_tag_decline(p_game_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_auth_uid();
  v_reserved boolean;
BEGIN
  PERFORM 1 FROM public.games g WHERE g.id = p_game_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'game not found';
  END IF;

  SELECT gp.reserves_slot INTO v_reserved
  FROM public.game_participants gp
  WHERE gp.game_id = p_game_id
    AND gp.user_id = v_uid
    AND gp.role = 'player'
    AND gp.state IN ('invited','accepted')
  FOR UPDATE;

  IF v_reserved IS NULL THEN
    RAISE EXCEPTION 'no invite found';
  END IF;

  UPDATE public.game_participants
    SET state = 'declined',
        reserves_slot = FALSE,
        updated_at = now()
  WHERE game_id = p_game_id AND user_id = v_uid;

  IF v_reserved THEN
    UPDATE public.games
      SET slots_open = slots_open + 1,
          updated_at = now()
    WHERE id = p_game_id;
  END IF;

  PERFORM public.game_thread_log_member_event(p_game_id, v_uid, 'tag_declined');

  RETURN jsonb_build_object('ok', true, 'action', 'tag_decline');
END;
$$;

-- Update game_tag_release to log system messages
CREATE OR REPLACE FUNCTION public.game_tag_release(
  p_game_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_auth_uid();
  v_reserved boolean;
BEGIN
  PERFORM 1
  FROM public.games g
  WHERE g.id = p_game_id
    AND g.host_user_id = v_uid
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT gp.reserves_slot INTO v_reserved
  FROM public.game_participants gp
  WHERE gp.game_id = p_game_id
    AND gp.user_id = p_user_id
    AND gp.role = 'player'
    AND gp.state IN ('invited','accepted')
  FOR UPDATE;

  IF v_reserved IS NULL THEN
    RAISE EXCEPTION 'participant not found';
  END IF;

  UPDATE public.game_participants
    SET state = 'removed',
        reserves_slot = FALSE,
        updated_at = now()
  WHERE game_id = p_game_id AND user_id = p_user_id;

  IF v_reserved THEN
    UPDATE public.games
      SET slots_open = slots_open + 1,
          updated_at = now()
    WHERE id = p_game_id;
  END IF;

  PERFORM public.game_thread_log_member_event(p_game_id, p_user_id, 'tag_released');

  RETURN jsonb_build_object('ok', true, 'action', 'tag_release');
END;
$$;