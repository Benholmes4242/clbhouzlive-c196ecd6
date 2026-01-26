-- Update Handicap RPC functions with p_country parameter

-- 1. Update get_lowest_handicap_leaderboard
DROP FUNCTION IF EXISTS public.get_lowest_handicap_leaderboard(text, uuid, integer, integer, uuid);

CREATE OR REPLACE FUNCTION public.get_lowest_handicap_leaderboard(
  p_scope text DEFAULT 'global',
  p_club_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  profile_photo_url text,
  handicap_index numeric,
  home_club text,
  rank bigint,
  is_current_user boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id AS user_id,
    up.username,
    up.display_name,
    up.profile_photo_url,
    up.handicap_index,
    gc.name AS home_club,
    ROW_NUMBER() OVER (
      ORDER BY up.handicap_index ASC NULLS LAST, up.created_at ASC
    ) AS rank,
    (up.id = p_current_user_id) AS is_current_user
  FROM user_profiles up
  LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
  WHERE 
    up.handicap_index IS NOT NULL
    AND CASE 
      WHEN p_scope = 'country' AND p_country IS NOT NULL THEN 
        gc.country = p_country
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        up.id IN (
          SELECT uf.following_id FROM user_follows uf WHERE uf.follower_id = p_current_user_id
        ) OR up.id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN 
        up.primary_club_id = p_club_id OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc 
          WHERE uhc.user_profile_id = up.id AND uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
  ORDER BY up.handicap_index ASC NULLS LAST, up.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lowest_handicap_leaderboard(text, uuid, integer, integer, uuid, text) TO authenticated, anon;

-- 2. Update get_handicap_improvement_leaderboard
DROP FUNCTION IF EXISTS public.get_handicap_improvement_leaderboard(text, uuid, integer, integer, uuid);

CREATE OR REPLACE FUNCTION public.get_handicap_improvement_leaderboard(
  p_scope text DEFAULT 'global',
  p_club_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  profile_photo_url text,
  current_handicap numeric,
  previous_handicap numeric,
  improvement numeric,
  home_club text,
  rank bigint,
  is_current_user boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH handicap_changes AS (
    SELECT
      uhh.user_id,
      uhh.handicap_index AS current_handicap,
      LAG(uhh.handicap_index) OVER (PARTITION BY uhh.user_id ORDER BY uhh.recorded_at) AS previous_handicap,
      uhh.recorded_at
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at >= NOW() - INTERVAL '30 days'
  ),
  latest_improvement AS (
    SELECT DISTINCT ON (hc.user_id)
      hc.user_id,
      hc.current_handicap,
      hc.previous_handicap,
      (hc.previous_handicap - hc.current_handicap) AS improvement
    FROM handicap_changes hc
    WHERE hc.previous_handicap IS NOT NULL
      AND hc.previous_handicap > hc.current_handicap
    ORDER BY hc.user_id, hc.recorded_at DESC
  )
  SELECT
    up.id AS user_id,
    up.username,
    up.display_name,
    up.profile_photo_url,
    li.current_handicap,
    li.previous_handicap,
    li.improvement,
    gc.name AS home_club,
    ROW_NUMBER() OVER (
      ORDER BY li.improvement DESC, up.created_at ASC
    ) AS rank,
    (up.id = p_current_user_id) AS is_current_user
  FROM latest_improvement li
  JOIN user_profiles up ON up.id = li.user_id
  LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
  WHERE 
    CASE 
      WHEN p_scope = 'country' AND p_country IS NOT NULL THEN 
        gc.country = p_country
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        up.id IN (
          SELECT uf.following_id FROM user_follows uf WHERE uf.follower_id = p_current_user_id
        ) OR up.id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN 
        up.primary_club_id = p_club_id OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc 
          WHERE uhc.user_profile_id = up.id AND uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
  ORDER BY li.improvement DESC, up.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_handicap_improvement_leaderboard(text, uuid, integer, integer, uuid, text) TO authenticated, anon;

-- 3. Update get_season_improvement_leaderboard
DROP FUNCTION IF EXISTS public.get_season_improvement_leaderboard(text, uuid, integer, integer, uuid);

CREATE OR REPLACE FUNCTION public.get_season_improvement_leaderboard(
  p_scope text DEFAULT 'global',
  p_club_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  profile_photo_url text,
  current_handicap numeric,
  season_start_handicap numeric,
  improvement numeric,
  home_club text,
  rank bigint,
  is_current_user boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_start date;
BEGIN
  -- Get current season start date
  SELECT start_date INTO v_season_start
  FROM championship_seasons
  WHERE status = 'active'
  ORDER BY start_date DESC
  LIMIT 1;

  -- Default to start of year if no active season
  IF v_season_start IS NULL THEN
    v_season_start := date_trunc('year', CURRENT_DATE)::date;
  END IF;

  RETURN QUERY
  WITH season_start_handicaps AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id,
      uhh.handicap_index AS season_start_handicap
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at <= v_season_start + INTERVAL '7 days'
    ORDER BY uhh.user_id, uhh.recorded_at DESC
  ),
  improvements AS (
    SELECT
      up.id AS user_id,
      up.handicap_index AS current_handicap,
      ssh.season_start_handicap,
      (ssh.season_start_handicap - up.handicap_index) AS improvement
    FROM user_profiles up
    JOIN season_start_handicaps ssh ON ssh.user_id = up.id
    WHERE up.handicap_index IS NOT NULL
      AND ssh.season_start_handicap > up.handicap_index
  )
  SELECT
    up.id AS user_id,
    up.username,
    up.display_name,
    up.profile_photo_url,
    i.current_handicap,
    i.season_start_handicap,
    i.improvement,
    gc.name AS home_club,
    ROW_NUMBER() OVER (
      ORDER BY i.improvement DESC, up.created_at ASC
    ) AS rank,
    (up.id = p_current_user_id) AS is_current_user
  FROM improvements i
  JOIN user_profiles up ON up.id = i.user_id
  LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
  WHERE 
    CASE 
      WHEN p_scope = 'country' AND p_country IS NOT NULL THEN 
        gc.country = p_country
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        up.id IN (
          SELECT uf.following_id FROM user_follows uf WHERE uf.follower_id = p_current_user_id
        ) OR up.id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN 
        up.primary_club_id = p_club_id OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc 
          WHERE uhc.user_profile_id = up.id AND uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
  ORDER BY i.improvement DESC, up.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_season_improvement_leaderboard(text, uuid, integer, integer, uuid, text) TO authenticated, anon;