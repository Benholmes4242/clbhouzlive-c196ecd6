-- Create RPC for inviting users to trip (host-only, security definer)
CREATE OR REPLACE FUNCTION public.invite_users_to_trip(p_trip_id uuid, p_user_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is the trip creator
  IF NOT EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = p_trip_id
      AND t.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  -- Insert participants, skip duplicates
  INSERT INTO public.trip_participants (trip_id, user_id, role, rsvp_status, invited_by)
  SELECT p_trip_id, uid, 'member', 'invited', auth.uid()
  FROM unnest(p_user_ids) AS uid
  ON CONFLICT (trip_id, user_id) DO NOTHING;
END;
$$;

-- Revoke from public, grant to authenticated
REVOKE ALL ON FUNCTION public.invite_users_to_trip(uuid, uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.invite_users_to_trip(uuid, uuid[]) TO authenticated;