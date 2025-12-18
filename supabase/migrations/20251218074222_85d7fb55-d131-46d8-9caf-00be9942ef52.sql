-- Enable RLS on user_home_clubs
ALTER TABLE public.user_home_clubs ENABLE ROW LEVEL SECURITY;

-- SELECT: users can read only their own "also plays at" clubs
DROP POLICY IF EXISTS "uhc_select_own" ON public.user_home_clubs;
CREATE POLICY "uhc_select_own"
ON public.user_home_clubs
FOR SELECT
TO authenticated
USING (user_profile_id = auth.uid());

-- INSERT: users can add clubs only for themselves
DROP POLICY IF EXISTS "uhc_insert_own" ON public.user_home_clubs;
CREATE POLICY "uhc_insert_own"
ON public.user_home_clubs
FOR INSERT
TO authenticated
WITH CHECK (user_profile_id = auth.uid());

-- UPDATE: users can update only their own rows
DROP POLICY IF EXISTS "uhc_update_own" ON public.user_home_clubs;
CREATE POLICY "uhc_update_own"
ON public.user_home_clubs
FOR UPDATE
TO authenticated
USING (user_profile_id = auth.uid())
WITH CHECK (user_profile_id = auth.uid());

-- DELETE: users can delete only their own rows
DROP POLICY IF EXISTS "uhc_delete_own" ON public.user_home_clubs;
CREATE POLICY "uhc_delete_own"
ON public.user_home_clubs
FOR DELETE
TO authenticated
USING (user_profile_id = auth.uid());

-- Add privacy flag for showing additional home clubs
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS show_additional_home_clubs boolean NOT NULL DEFAULT false;

-- RPC: set_home_clubs - atomic update of primary + additional clubs
CREATE OR REPLACE FUNCTION public.set_home_clubs(
  p_primary_business_id uuid,
  p_additional_business_ids uuid[] DEFAULT '{}'::uuid[],
  p_clear_pending boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1) Set primary home club
  UPDATE public.user_profiles
  SET
    home_club_business_id = p_primary_business_id,
    home_club_pending_name = CASE WHEN p_clear_pending THEN NULL ELSE home_club_pending_name END,
    home_club_pending_key  = CASE WHEN p_clear_pending THEN NULL ELSE home_club_pending_key END
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- 2) Normalize additional list: remove nulls, remove primary if included, de-duplicate
  WITH cleaned AS (
    SELECT array(
      SELECT DISTINCT x
      FROM unnest(coalesce(p_additional_business_ids, '{}'::uuid[])) AS x
      WHERE x IS NOT NULL
        AND x <> p_primary_business_id
    ) AS arr
  )
  -- 3) Delete any additional clubs not in the cleaned list
  DELETE FROM public.user_home_clubs uhc
  USING cleaned c
  WHERE uhc.user_profile_id = v_user_id
    AND (c.arr IS NULL OR uhc.business_id <> ALL(c.arr));

  -- 4) Insert missing additional clubs from cleaned list
  INSERT INTO public.user_home_clubs (user_profile_id, business_id)
  SELECT v_user_id, x
  FROM (
    SELECT array(
      SELECT DISTINCT x
      FROM unnest(coalesce(p_additional_business_ids, '{}'::uuid[])) AS x
      WHERE x IS NOT NULL
        AND x <> p_primary_business_id
    ) AS arr
  ) cleaned
  CROSS JOIN unnest(coalesce(cleaned.arr, '{}'::uuid[])) AS x
  ON CONFLICT (user_profile_id, business_id) DO NOTHING;
END;
$$;

-- RPC: get_home_clubs - returns current user's primary and additional clubs
CREATE OR REPLACE FUNCTION public.get_home_clubs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_primary_id uuid;
  v_primary_name text;
  v_additional jsonb := '[]'::jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Primary club id
  SELECT up.home_club_business_id
  INTO v_primary_id
  FROM public.user_profiles up
  WHERE up.id = v_user_id;

  -- Primary club name
  IF v_primary_id IS NOT NULL THEN
    SELECT ba.club_name
    INTO v_primary_name
    FROM public.business_accounts ba
    WHERE ba.id = v_primary_id;
  END IF;

  -- Additional clubs (id + name), excluding primary if present
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', ba.id,
        'name', ba.club_name
      )
      ORDER BY ba.club_name
    ),
    '[]'::jsonb
  )
  INTO v_additional
  FROM public.user_home_clubs uhc
  JOIN public.business_accounts ba
    ON ba.id = uhc.business_id
  WHERE uhc.user_profile_id = v_user_id
    AND (v_primary_id IS NULL OR ba.id <> v_primary_id);

  RETURN jsonb_build_object(
    'primary', CASE
      WHEN v_primary_id IS NULL THEN NULL
      ELSE jsonb_build_object('id', v_primary_id, 'name', v_primary_name)
    END,
    'additional', v_additional
  );
END;
$$;

-- RPC: get_home_clubs_for_user - returns clubs for a specific user with privacy rules
CREATE OR REPLACE FUNCTION public.get_home_clubs_for_user(
  p_user_profile_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_viewer_id uuid := auth.uid();
  v_primary_id uuid;
  v_primary_name text;
  v_allow_additional boolean := false;
  v_additional jsonb := '[]'::jsonb;
BEGIN
  -- Primary club id + privacy flag
  SELECT up.home_club_business_id,
         up.show_additional_home_clubs
  INTO v_primary_id,
       v_allow_additional
  FROM public.user_profiles up
  WHERE up.id = p_user_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Primary club name
  IF v_primary_id IS NOT NULL THEN
    SELECT ba.club_name
    INTO v_primary_name
    FROM public.business_accounts ba
    WHERE ba.id = v_primary_id;
  END IF;

  -- Show additional if: target user opted in OR viewer is the same user
  IF v_viewer_id IS NOT NULL AND v_viewer_id = p_user_profile_id THEN
    v_allow_additional := true;
  END IF;

  -- Additional clubs (only if allowed)
  IF v_allow_additional THEN
    SELECT coalesce(
      jsonb_agg(
        jsonb_build_object('id', ba.id, 'name', ba.club_name)
        ORDER BY ba.club_name
      ),
      '[]'::jsonb
    )
    INTO v_additional
    FROM public.user_home_clubs uhc
    JOIN public.business_accounts ba
      ON ba.id = uhc.business_id
    WHERE uhc.user_profile_id = p_user_profile_id
      AND (v_primary_id IS NULL OR ba.id <> v_primary_id);
  END IF;

  RETURN jsonb_build_object(
    'primary', CASE
      WHEN v_primary_id IS NULL THEN NULL
      ELSE jsonb_build_object('id', v_primary_id, 'name', v_primary_name)
    END,
    'additional', v_additional
  );
END;
$$;

-- RPC: get_home_clubs_for_users - batch query for People grids with privacy rules
CREATE OR REPLACE FUNCTION public.get_home_clubs_for_users(
  p_user_profile_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_viewer_id uuid := auth.uid();
  v_result jsonb;
BEGIN
  -- Basic validation
  IF p_user_profile_ids IS NULL OR array_length(p_user_profile_ids, 1) IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  WITH requested_users AS (
    SELECT unnest(p_user_profile_ids) AS user_id
  ),
  base AS (
    SELECT
      up.id AS user_id,
      up.home_club_business_id AS primary_id,
      up.show_additional_home_clubs AS allow_additional_opt_in,
      (up.id = v_viewer_id) AS is_self
    FROM public.user_profiles up
    JOIN requested_users ru ON ru.user_id = up.id
  ),
  primary_club AS (
    SELECT
      b.user_id,
      CASE WHEN b.primary_id IS NULL THEN NULL
           ELSE jsonb_build_object('id', ba.id, 'name', ba.club_name)
      END AS primary_json
    FROM base b
    LEFT JOIN public.business_accounts ba ON ba.id = b.primary_id
  ),
  additional_clubs AS (
    SELECT
      b.user_id,
      coalesce(
        jsonb_agg(
          jsonb_build_object('id', ba.id, 'name', ba.club_name)
          ORDER BY ba.club_name
        ) FILTER (WHERE ba.id IS NOT NULL),
        '[]'::jsonb
      ) AS additional_json
    FROM base b
    LEFT JOIN public.user_home_clubs uhc
      ON uhc.user_profile_id = b.user_id
    LEFT JOIN public.business_accounts ba
      ON ba.id = uhc.business_id
    WHERE
      -- privacy gate
      (b.allow_additional_opt_in = true OR b.is_self = true)
      -- exclude primary from additional
      AND (b.primary_id IS NULL OR ba.id IS NULL OR ba.id <> b.primary_id)
    GROUP BY b.user_id
  ),
  assembled AS (
    SELECT
      b.user_id,
      jsonb_build_object(
        'primary', pc.primary_json,
        'additional',
          CASE
            WHEN (b.allow_additional_opt_in = true OR b.is_self = true)
              THEN coalesce(ac.additional_json, '[]'::jsonb)
            ELSE '[]'::jsonb
          END
      ) AS payload
    FROM base b
    JOIN primary_club pc ON pc.user_id = b.user_id
    LEFT JOIN additional_clubs ac ON ac.user_id = b.user_id
  )
  SELECT coalesce(jsonb_object_agg(user_id::text, payload), '{}'::jsonb)
  INTO v_result
  FROM assembled;

  RETURN v_result;
END;
$$;