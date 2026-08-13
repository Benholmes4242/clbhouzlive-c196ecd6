-- Public gate context readers: expose only the minimal, already-public
-- identity fields (name, username, handicap index when the member has not
-- hidden it) plus non-identifying aggregate counts, for the logged-out web
-- landing gate.

CREATE OR REPLACE FUNCTION public.gate_profile_context(p_username text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_p record;
  v_rounds int := 0;
  v_courses int := 0;
  v_index numeric;
BEGIN
  SELECT id, username, display_name, first_name, is_public,
         COALESCE(show_handicap, true) AS show_handicap,
         COALESCE(hide_handicap_chip, false) AS hide_chip,
         COALESCE(manual_handicap_index, eg_handicap_index) AS idx
    INTO v_p
    FROM user_profiles
   WHERE lower(username) = lower(p_username)
   LIMIT 1;

  IF v_p.id IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT count(*), count(DISTINCT course_id)
    INTO v_rounds, v_courses
    FROM gam_round_stats
   WHERE user_id = v_p.id;

  IF v_p.show_handicap AND NOT v_p.hide_chip THEN
    v_index := v_p.idx;
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'username', v_p.username,
    'display_name', v_p.display_name,
    'first_name', COALESCE(v_p.first_name, split_part(COALESCE(v_p.display_name, ''), ' ', 1)),
    'handicap_index', v_index,
    'rounds', v_rounds,
    'courses', v_courses
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.gate_invite_context(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_ctx jsonb;
  v_circle jsonb;
BEGIN
  SELECT user_id INTO v_user FROM generic_invite_codes WHERE code = p_code LIMIT 1;

  IF v_user IS NULL THEN
    SELECT inviter_user_id INTO v_user FROM whs_invites WHERE invite_code = p_code LIMIT 1;
  END IF;

  IF v_user IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT gate_profile_context(username) INTO v_ctx FROM user_profiles WHERE id = v_user;

  SELECT COALESCE(jsonb_agg(row_to_json(c)::jsonb ORDER BY c.rounds DESC), '[]'::jsonb)
    INTO v_circle
  FROM (
    SELECT p.display_name AS name,
           CASE WHEN COALESCE(p.show_handicap, true) AND NOT COALESCE(p.hide_handicap_chip, false)
                THEN COALESCE(p.manual_handicap_index, p.eg_handicap_index) END AS handicap_index,
           (SELECT count(*) FROM gam_round_stats g WHERE g.user_id = p.id) AS rounds
      FROM user_follows f
      JOIN user_profiles p ON p.id = f.following_id
     WHERE f.follower_id = v_user
       AND p.display_name IS NOT NULL
     ORDER BY (SELECT count(*) FROM gam_round_stats g WHERE g.user_id = p.id) DESC
     LIMIT 3
  ) c;

  RETURN COALESCE(v_ctx, jsonb_build_object('found', false)) || jsonb_build_object('circle', v_circle);
END;
$$;

REVOKE ALL ON FUNCTION public.gate_profile_context(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.gate_invite_context(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gate_profile_context(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.gate_invite_context(text) TO anon, authenticated, service_role;