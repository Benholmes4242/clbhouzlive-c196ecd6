-- Helper: get current authenticated user id (fixed type casting)
CREATE OR REPLACE FUNCTION public.current_auth_uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT (nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub')::uuid
$$;

-- Accept/Decline a join request (host action, atomic)
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

  RETURN jsonb_build_object(
    'ok', true,
    'game_id', v_game_id,
    'decision', 'accepted'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.game_request_decide(uuid, text) TO authenticated;

-- Tagged player accepts their reserved seat
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

  RETURN jsonb_build_object('ok', true, 'action', 'tag_accept');
END;
$$;

GRANT EXECUTE ON FUNCTION public.game_tag_accept(uuid) TO authenticated;

-- Tagged player declines (frees seat)
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

  RETURN jsonb_build_object('ok', true, 'action', 'tag_decline');
END;
$$;

GRANT EXECUTE ON FUNCTION public.game_tag_decline(uuid) TO authenticated;

-- Host releases a tagged seat (frees seat)
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

  RETURN jsonb_build_object('ok', true, 'action', 'tag_release');
END;
$$;

GRANT EXECUTE ON FUNCTION public.game_tag_release(uuid, uuid) TO authenticated;