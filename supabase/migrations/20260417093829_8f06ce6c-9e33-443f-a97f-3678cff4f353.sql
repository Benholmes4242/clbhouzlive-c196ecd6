-- 1. Extend the editorial surface check to include 'handicap'
ALTER TABLE public.championship_editorial_daily
  DROP CONSTRAINT IF EXISTS championship_editorial_daily_surface_check;

ALTER TABLE public.championship_editorial_daily
  ADD CONSTRAINT championship_editorial_daily_surface_check
  CHECK (surface IN ('top100', 'global', 'courses', 'handicap'));

-- 2. New RPC: peer window centred on a target handicap
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
  is_current_user BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY eg_handicap_index ASC, id ASC)::INTEGER AS rank,
      id AS user_id,
      username,
      display_name,
      profile_photo_url AS avatar_url,
      eg_handicap_index::NUMERIC AS handicap_index,
      (id = p_current_user_id) AS is_current_user
    FROM public.user_profiles
    WHERE eg_handicap_index IS NOT NULL
      AND is_public = TRUE
      AND show_handicap = TRUE
      AND show_in_handicap_leaderboards = TRUE
  ),
  centre AS (
    SELECT rank
    FROM ranked
    ORDER BY ABS(handicap_index - p_target_handicap) ASC, rank ASC
    LIMIT 1
  )
  SELECT r.rank, r.user_id, r.username, r.display_name, r.avatar_url, r.handicap_index, r.is_current_user
  FROM ranked r, centre c
  WHERE r.rank BETWEEN c.rank - p_window_size AND c.rank + p_window_size
  ORDER BY r.rank ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_similar_handicap_leaderboard(NUMERIC, INTEGER, UUID) TO anon, authenticated;