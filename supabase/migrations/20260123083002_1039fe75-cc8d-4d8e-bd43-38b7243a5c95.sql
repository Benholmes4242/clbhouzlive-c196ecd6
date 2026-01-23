-- Fix remaining functions by dropping first then recreating

-- Drop the existing functions that have incompatible return types
DROP FUNCTION IF EXISTS public.get_lowest_handicap_leaderboard(text, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_season_improvement_leaderboard(text, integer, integer, uuid);

-- Recreate get_lowest_handicap_leaderboard with correct return columns
CREATE OR REPLACE FUNCTION public.get_lowest_handicap_leaderboard(
  p_scope text DEFAULT 'global',
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  handicap_index numeric,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_club_id uuid;
BEGIN
  IF p_current_user_id IS NOT NULL THEN
    SELECT up.primary_club_id
      INTO v_current_user_club_id
    FROM public.user_profiles up
    WHERE up.id = p_current_user_id;
  END IF;

  RETURN QUERY
  WITH friend_ids AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM public.user_friends uf
    WHERE p_current_user_id IS NOT NULL
      AND uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  scoped AS (
    SELECT
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      up.eg_handicap_index::numeric AS handicap_index
    FROM public.user_profiles up
    WHERE up.is_public = true
      AND up.show_handicap = true
      AND up.eg_handicap_index IS NOT NULL
      AND (
        p_scope = 'global'
        OR (
          p_scope = 'friends'
          AND p_current_user_id IS NOT NULL
          AND (up.id IN (SELECT friend_id FROM friend_ids) OR up.id = p_current_user_id)
        )
        OR (
          p_scope = 'club'
          AND p_current_user_id IS NOT NULL
          AND v_current_user_club_id IS NOT NULL
          AND up.primary_club_id = v_current_user_club_id
        )
      )
  ),
  ranked AS (
    SELECT
      row_number() OVER (ORDER BY s.handicap_index ASC, s.user_id) AS rank,
      s.*
    FROM scoped s
  )
  SELECT
    r.rank,
    r.user_id,
    r.username,
    r.display_name,
    r.avatar_url,
    r.handicap_index,
    (p_current_user_id IS NOT NULL AND r.user_id = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lowest_handicap_leaderboard(text, integer, integer, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_lowest_handicap_leaderboard(text, integer, integer, uuid) TO authenticated;

-- Recreate get_season_improvement_leaderboard with correct return columns
CREATE OR REPLACE FUNCTION public.get_season_improvement_leaderboard(
  p_scope text DEFAULT 'global',
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  improvement numeric,
  start_handicap numeric,
  current_handicap numeric,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_club_id uuid;
BEGIN
  IF p_current_user_id IS NOT NULL THEN
    SELECT up.primary_club_id
      INTO v_current_user_club_id
    FROM public.user_profiles up
    WHERE up.id = p_current_user_id;
  END IF;

  RETURN QUERY
  WITH current_season AS (
    SELECT cs.id, cs.start_date
    FROM public.championship_seasons cs
    WHERE cs.status = 'active'
    ORDER BY cs.start_date DESC
    LIMIT 1
  ),
  friend_ids AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM public.user_friends uf
    WHERE p_current_user_id IS NOT NULL
      AND uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  season_start AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id,
      uhh.handicap_value::numeric AS start_handicap
    FROM public.user_handicap_history uhh
    JOIN current_season cs ON true
    WHERE uhh.recorded_at >= cs.start_date
    ORDER BY uhh.user_id, uhh.recorded_at ASC
  ),
  improvements AS (
    SELECT
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      ss.start_handicap,
      up.eg_handicap_index::numeric AS current_handicap,
      (ss.start_handicap - up.eg_handicap_index::numeric) AS improvement,
      up.primary_club_id
    FROM season_start ss
    JOIN public.user_profiles up ON up.id = ss.user_id
    WHERE up.is_public = true
      AND up.show_handicap = true
      AND up.eg_handicap_index IS NOT NULL
      AND ss.start_handicap IS NOT NULL
      AND ss.start_handicap > up.eg_handicap_index::numeric
      AND (
        p_scope = 'global'
        OR (
          p_scope = 'friends'
          AND p_current_user_id IS NOT NULL
          AND (up.id IN (SELECT friend_id FROM friend_ids) OR up.id = p_current_user_id)
        )
        OR (
          p_scope = 'club'
          AND p_current_user_id IS NOT NULL
          AND v_current_user_club_id IS NOT NULL
          AND up.primary_club_id = v_current_user_club_id
        )
      )
  ),
  ranked AS (
    SELECT
      row_number() OVER (ORDER BY i.improvement DESC, i.user_id) AS rank,
      i.*
    FROM improvements i
  )
  SELECT
    r.rank,
    r.user_id,
    r.username,
    r.display_name,
    r.avatar_url,
    r.improvement,
    r.start_handicap,
    r.current_handicap,
    (p_current_user_id IS NOT NULL AND r.user_id = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_season_improvement_leaderboard(text, integer, integer, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_season_improvement_leaderboard(text, integer, integer, uuid) TO authenticated;