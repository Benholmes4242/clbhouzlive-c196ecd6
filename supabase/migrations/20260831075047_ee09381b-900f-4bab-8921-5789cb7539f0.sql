ALTER TABLE public.course_requests
  ADD COLUMN IF NOT EXISTS home_club_for_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS course_requests_home_club_for_user_idx
  ON public.course_requests (home_club_for_user_id)
  WHERE home_club_for_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS course_requests_home_club_name_idx
  ON public.course_requests (lower(course_name))
  WHERE home_club_for_user_id IS NOT NULL;

-- Resolve a home-club request: create the connection for EVERY member who
-- asked for the same club name, not just the one request the admin opened.
CREATE OR REPLACE FUNCTION public.resolve_home_club_request(
  p_request_id uuid,
  p_club_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_club_name text;
  v_admin uuid := auth.uid();
  v_ids uuid[];
  v_users jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  SELECT course_name INTO v_name
  FROM public.course_requests
  WHERE id = p_request_id AND home_club_for_user_id IS NOT NULL;
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Not a home-club request';
  END IF;

  SELECT name INTO v_club_name FROM public.golf_clubs WHERE id = p_club_id;
  IF v_club_name IS NULL THEN
    RAISE EXCEPTION 'Unknown club';
  END IF;

  -- Every pending home-club request for the same typed name.
  SELECT array_agg(id) INTO v_ids
  FROM public.course_requests
  WHERE home_club_for_user_id IS NOT NULL
    AND status = 'pending'
    AND lower(btrim(course_name)) = lower(btrim(v_name));

  IF v_ids IS NULL THEN v_ids := ARRAY[p_request_id]; END IF;

  UPDATE public.user_profiles p
  SET primary_club_id = p_club_id,
      home_club = v_club_name,
      home_club_pending_name = NULL,
      home_club_pending_key = NULL,
      updated_at = now()
  FROM public.course_requests r
  WHERE r.id = ANY(v_ids)
    AND r.home_club_for_user_id = p.id;

  UPDATE public.course_requests
  SET status = 'added',
      resolved_by = v_admin,
      resolved_at = now(),
      admin_notes = COALESCE(p_admin_notes, admin_notes)
  WHERE id = ANY(v_ids);

  SELECT jsonb_agg(jsonb_build_object('user_id', p.id, 'username', p.username, 'display_name', p.display_name))
  INTO v_users
  FROM public.course_requests r
  JOIN public.user_profiles p ON p.id = r.home_club_for_user_id
  WHERE r.id = ANY(v_ids);

  RETURN jsonb_build_object(
    'club_id', p_club_id,
    'club_name', v_club_name,
    'requests_resolved', array_length(v_ids, 1),
    'members_connected', COALESCE(jsonb_array_length(v_users), 0),
    'members', COALESCE(v_users, '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_home_club_request(uuid, uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.resolve_home_club_request(uuid, uuid, text) TO authenticated;

-- Reject a home-club request: clear the pending placeholder so the member is
-- never stranded in a state that can no longer resolve.
CREATE OR REPLACE FUNCTION public.reject_home_club_request(
  p_request_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  SELECT home_club_for_user_id INTO v_user
  FROM public.course_requests
  WHERE id = p_request_id AND home_club_for_user_id IS NOT NULL;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not a home-club request';
  END IF;

  UPDATE public.user_profiles
  SET home_club_pending_name = NULL,
      home_club_pending_key = NULL,
      updated_at = now()
  WHERE id = v_user;

  UPDATE public.course_requests
  SET status = 'rejected',
      resolved_by = auth.uid(),
      resolved_at = now(),
      admin_notes = COALESCE(p_admin_notes, admin_notes)
  WHERE id = p_request_id;

  RETURN jsonb_build_object('user_id', v_user);
END;
$$;

REVOKE ALL ON FUNCTION public.reject_home_club_request(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.reject_home_club_request(uuid, text) TO authenticated;