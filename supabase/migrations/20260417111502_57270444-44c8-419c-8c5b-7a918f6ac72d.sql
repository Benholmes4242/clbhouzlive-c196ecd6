-- Extend get_similar_handicap_leaderboard to return home club name
DROP FUNCTION IF EXISTS public.get_similar_handicap_leaderboard(NUMERIC, INTEGER, UUID);

CREATE OR REPLACE FUNCTION public.get_similar_handicap_leaderboard(
  p_target_handicap NUMERIC,
  p_window_size INTEGER DEFAULT 3,
  p_current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  handicap_index NUMERIC,
  club_name TEXT,
  is_current_user BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY up.eg_handicap_index ASC, up.id ASC)::INTEGER AS rank,
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      up.eg_handicap_index::NUMERIC AS handicap_index,
      gc.name AS club_name,
      (up.id = p_current_user_id) AS is_current_user
    FROM public.user_profiles up
    LEFT JOIN public.golf_clubs gc ON gc.id = up.primary_club_id
    WHERE up.eg_handicap_index IS NOT NULL
      AND up.is_public = TRUE
      AND up.show_handicap = TRUE
      AND up.show_in_handicap_leaderboards = TRUE
  ),
  centre AS (
    SELECT rank
    FROM ranked
    ORDER BY ABS(handicap_index - p_target_handicap) ASC, rank ASC
    LIMIT 1
  )
  SELECT r.rank, r.user_id, r.username, r.display_name, r.avatar_url, r.handicap_index, r.club_name, r.is_current_user
  FROM ranked r, centre c
  WHERE r.rank BETWEEN c.rank - p_window_size AND c.rank + p_window_size
  ORDER BY r.rank ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_similar_handicap_leaderboard(NUMERIC, INTEGER, UUID) TO anon, authenticated;