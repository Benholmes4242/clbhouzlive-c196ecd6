-- Drop existing functions first to allow return type changes
DROP FUNCTION IF EXISTS public.get_lowest_handicap_leaderboard(text, uuid, integer, integer, uuid, text);
DROP FUNCTION IF EXISTS public.get_handicap_improvement_leaderboard(text, uuid, integer, integer, uuid, text);
DROP FUNCTION IF EXISTS public.get_season_improvement_leaderboard(text, uuid, integer, integer, uuid, text);

-- Fix get_lowest_handicap_leaderboard: handicap_index → eg_handicap_index + show_handicap filter
CREATE FUNCTION public.get_lowest_handicap_leaderboard(
  p_scope text DEFAULT 'global',
  p_club_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  handicap_index double precision,
  club_name text,
  country text,
  rank bigint,
  is_current_user boolean
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
      up.display_name,
      up.avatar_url,
      up.eg_handicap_index AS handicap_index,
      gc.club_name,
      gc.country,
      ROW_NUMBER() OVER (ORDER BY up.eg_handicap_index ASC) AS rank
    FROM user_profiles up
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE up.eg_handicap_index IS NOT NULL
      AND up.show_handicap = TRUE
      AND (p_scope = 'global' OR 
           (p_scope = 'club' AND up.primary_club_id = p_club_id) OR
           (p_scope = 'country' AND gc.country = p_country))
  )
  SELECT 
    r.user_id,
    r.display_name,
    r.avatar_url,
    r.handicap_index,
    r.club_name,
    r.country,
    r.rank,
    (r.user_id = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Fix get_handicap_improvement_leaderboard: handicap_index → eg_handicap_index + show_handicap filter
CREATE FUNCTION public.get_handicap_improvement_leaderboard(
  p_scope text DEFAULT 'global',
  p_club_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  current_handicap double precision,
  previous_handicap double precision,
  improvement double precision,
  club_name text,
  country text,
  rank bigint,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH latest_history AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id,
      uhh.handicap_index AS previous_handicap,
      uhh.recorded_at
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at < NOW() - INTERVAL '30 days'
    ORDER BY uhh.user_id, uhh.recorded_at DESC
  ),
  improvements AS (
    SELECT
      up.id AS user_id,
      up.display_name,
      up.avatar_url,
      up.eg_handicap_index AS current_handicap,
      lh.previous_handicap,
      (lh.previous_handicap - up.eg_handicap_index) AS improvement,
      gc.club_name,
      gc.country
    FROM user_profiles up
    INNER JOIN latest_history lh ON lh.user_id = up.id
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE up.eg_handicap_index IS NOT NULL
      AND up.show_handicap = TRUE
      AND lh.previous_handicap IS NOT NULL
      AND (lh.previous_handicap - up.eg_handicap_index) > 0
      AND (p_scope = 'global' OR 
           (p_scope = 'club' AND up.primary_club_id = p_club_id) OR
           (p_scope = 'country' AND gc.country = p_country))
  ),
  ranked AS (
    SELECT
      i.*,
      ROW_NUMBER() OVER (ORDER BY i.improvement DESC) AS rank
    FROM improvements i
  )
  SELECT 
    r.user_id,
    r.display_name,
    r.avatar_url,
    r.current_handicap,
    r.previous_handicap,
    r.improvement,
    r.club_name,
    r.country,
    r.rank,
    (r.user_id = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Fix get_season_improvement_leaderboard: handicap_index → eg_handicap_index + show_handicap filter
CREATE FUNCTION public.get_season_improvement_leaderboard(
  p_scope text DEFAULT 'global',
  p_club_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  current_handicap double precision,
  season_start_handicap double precision,
  improvement double precision,
  club_name text,
  country text,
  rank bigint,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH season_data AS (
    SELECT
      up.id AS user_id,
      up.display_name,
      up.avatar_url,
      up.eg_handicap_index AS current_handicap,
      uss.season_start_handicap,
      (uss.season_start_handicap - up.eg_handicap_index) AS improvement,
      gc.club_name,
      gc.country
    FROM user_profiles up
    INNER JOIN user_season_stats uss ON uss.user_id = up.id
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE up.eg_handicap_index IS NOT NULL
      AND up.show_handicap = TRUE
      AND uss.season_start_handicap IS NOT NULL
      AND (uss.season_start_handicap - up.eg_handicap_index) > 0
      AND (p_scope = 'global' OR 
           (p_scope = 'club' AND up.primary_club_id = p_club_id) OR
           (p_scope = 'country' AND gc.country = p_country))
  ),
  ranked AS (
    SELECT
      sd.*,
      ROW_NUMBER() OVER (ORDER BY sd.improvement DESC) AS rank
    FROM season_data sd
  )
  SELECT 
    r.user_id,
    r.display_name,
    r.avatar_url,
    r.current_handicap,
    r.season_start_handicap,
    r.improvement,
    r.club_name,
    r.country,
    r.rank,
    (r.user_id = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_lowest_handicap_leaderboard(text, uuid, integer, integer, uuid, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_handicap_improvement_leaderboard(text, uuid, integer, integer, uuid, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_season_improvement_leaderboard(text, uuid, integer, integer, uuid, text) TO authenticated, anon;