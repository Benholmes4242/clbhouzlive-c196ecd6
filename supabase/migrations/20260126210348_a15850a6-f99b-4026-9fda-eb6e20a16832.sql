-- Fix column name: avatar_url → profile_photo_url in all handicap functions

-- 1. Fix get_lowest_handicap_leaderboard
DROP FUNCTION IF EXISTS public.get_lowest_handicap_leaderboard(TEXT, TEXT, TEXT, INT, INT, UUID);

CREATE OR REPLACE FUNCTION public.get_lowest_handicap_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_club_id TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  profile_photo_url TEXT,
  eg_handicap_index DOUBLE PRECISION,
  primary_club_id UUID,
  club_name TEXT,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url,
      up.eg_handicap_index,
      up.primary_club_id,
      gc.club_name,
      ROW_NUMBER() OVER (ORDER BY up.eg_handicap_index ASC NULLS LAST) AS rank
    FROM user_profiles up
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE up.eg_handicap_index IS NOT NULL
      AND up.show_handicap = TRUE
      AND (
        p_scope = 'global'
        OR (p_scope = 'clubs' AND (
          up.primary_club_id = p_club_id::UUID
          OR EXISTS (
            SELECT 1 FROM user_home_clubs uhc
            WHERE uhc.user_profile_id = up.id
              AND uhc.club_id = p_club_id::UUID
          )
        ))
        OR (p_scope = 'country' AND gc.country = p_country)
      )
  )
  SELECT * FROM ranked
  ORDER BY ranked.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lowest_handicap_leaderboard(TEXT, TEXT, TEXT, INT, INT, UUID) TO authenticated, anon;

-- 2. Fix get_handicap_improvement_leaderboard
DROP FUNCTION IF EXISTS public.get_handicap_improvement_leaderboard(TEXT, TEXT, TEXT, INT, INT, UUID);

CREATE OR REPLACE FUNCTION public.get_handicap_improvement_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_club_id TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  profile_photo_url TEXT,
  current_handicap DOUBLE PRECISION,
  previous_handicap DOUBLE PRECISION,
  improvement DOUBLE PRECISION,
  primary_club_id UUID,
  club_name TEXT,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_improvements AS (
    SELECT
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url,
      up.eg_handicap_index AS current_handicap,
      (
        SELECT uhh.handicap_index
        FROM user_handicap_history uhh
        WHERE uhh.user_id = up.id
          AND uhh.recorded_at <= NOW() - INTERVAL '30 days'
        ORDER BY uhh.recorded_at DESC
        LIMIT 1
      ) AS previous_handicap,
      up.primary_club_id,
      gc.club_name
    FROM user_profiles up
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE up.eg_handicap_index IS NOT NULL
      AND up.show_handicap = TRUE
      AND (
        p_scope = 'global'
        OR (p_scope = 'clubs' AND (
          up.primary_club_id = p_club_id::UUID
          OR EXISTS (
            SELECT 1 FROM user_home_clubs uhc
            WHERE uhc.user_profile_id = up.id
              AND uhc.club_id = p_club_id::UUID
          )
        ))
        OR (p_scope = 'country' AND gc.country = p_country)
      )
  ),
  ranked AS (
    SELECT
      ui.user_id,
      ui.username,
      ui.display_name,
      ui.profile_photo_url,
      ui.current_handicap,
      ui.previous_handicap,
      (ui.previous_handicap - ui.current_handicap) AS improvement,
      ui.primary_club_id,
      ui.club_name,
      ROW_NUMBER() OVER (ORDER BY (ui.previous_handicap - ui.current_handicap) DESC NULLS LAST) AS rank
    FROM user_improvements ui
    WHERE ui.previous_handicap IS NOT NULL
      AND ui.previous_handicap > ui.current_handicap
  )
  SELECT * FROM ranked
  ORDER BY ranked.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_handicap_improvement_leaderboard(TEXT, TEXT, TEXT, INT, INT, UUID) TO authenticated, anon;

-- 3. Fix get_season_improvement_leaderboard
DROP FUNCTION IF EXISTS public.get_season_improvement_leaderboard(TEXT, TEXT, TEXT, INT, INT, UUID);

CREATE OR REPLACE FUNCTION public.get_season_improvement_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_club_id TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  profile_photo_url TEXT,
  current_handicap DOUBLE PRECISION,
  season_start_handicap DOUBLE PRECISION,
  improvement DOUBLE PRECISION,
  primary_club_id UUID,
  club_name TEXT,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_improvements AS (
    SELECT
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url,
      up.eg_handicap_index AS current_handicap,
      ssh.season_start_handicap,
      up.primary_club_id,
      gc.club_name
    FROM user_profiles up
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    LEFT JOIN user_season_start_handicaps ssh ON ssh.user_id = up.id
    WHERE up.eg_handicap_index IS NOT NULL
      AND up.show_handicap = TRUE
      AND ssh.season_start_handicap IS NOT NULL
      AND (
        p_scope = 'global'
        OR (p_scope = 'clubs' AND (
          up.primary_club_id = p_club_id::UUID
          OR EXISTS (
            SELECT 1 FROM user_home_clubs uhc
            WHERE uhc.user_profile_id = up.id
              AND uhc.club_id = p_club_id::UUID
          )
        ))
        OR (p_scope = 'country' AND gc.country = p_country)
      )
  ),
  ranked AS (
    SELECT
      ui.user_id,
      ui.username,
      ui.display_name,
      ui.profile_photo_url,
      ui.current_handicap,
      ui.season_start_handicap,
      (ui.season_start_handicap - ui.current_handicap) AS improvement,
      ui.primary_club_id,
      ui.club_name,
      ROW_NUMBER() OVER (ORDER BY (ui.season_start_handicap - ui.current_handicap) DESC NULLS LAST) AS rank
    FROM user_improvements ui
    WHERE ui.season_start_handicap > ui.current_handicap
  )
  SELECT * FROM ranked
  ORDER BY ranked.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_season_improvement_leaderboard(TEXT, TEXT, TEXT, INT, INT, UUID) TO authenticated, anon;