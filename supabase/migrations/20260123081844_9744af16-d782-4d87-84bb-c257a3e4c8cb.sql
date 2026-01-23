-- Drop ALL versions of handicap leaderboard functions
DROP FUNCTION IF EXISTS public.get_handicap_improvement_leaderboard(text, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_handicap_improvement_leaderboard(integer, text, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_handicap_improvement_leaderboard(integer, text, text, text, integer, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_handicap_improvement_leaderboard(integer, text, text, uuid, uuid, integer, integer, integer);

DROP FUNCTION IF EXISTS public.get_lowest_handicap_leaderboard(text, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_lowest_handicap_leaderboard(text, text, text, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_lowest_handicap_leaderboard(text, text, uuid, uuid, integer, integer);

DROP FUNCTION IF EXISTS public.get_season_improvement_leaderboard(text, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_season_improvement_leaderboard(uuid, text, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_season_improvement_leaderboard(uuid, text, uuid, integer, integer);

-- Recreate get_lowest_handicap_leaderboard with signature matching hook
CREATE OR REPLACE FUNCTION public.get_lowest_handicap_leaderboard(
  p_scope text DEFAULT 'global',
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  handicap_index numeric,
  home_club text,
  rank bigint,
  is_friend boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT 
      up.id AS user_id,
      up.display_name,
      up.username,
      up.profile_photo_url AS avatar_url,
      up.eg_handicap_index AS handicap_index,
      gc.name AS home_club,
      ROW_NUMBER() OVER (ORDER BY up.eg_handicap_index ASC NULLS LAST, up.updated_at ASC) AS rank
    FROM user_profiles up
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE up.eg_handicap_index IS NOT NULL
  ),
  friend_ids AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE p_current_user_id IS NOT NULL
      AND uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  )
  SELECT 
    ru.user_id,
    ru.display_name,
    ru.username,
    ru.avatar_url,
    ru.handicap_index,
    ru.home_club,
    ru.rank,
    (p_current_user_id IS NOT NULL AND ru.user_id IN (SELECT fi.friend_id FROM friend_ids fi)) AS is_friend
  FROM ranked_users ru
  WHERE 
    CASE 
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN
        ru.user_id IN (SELECT fi.friend_id FROM friend_ids fi) OR ru.user_id = p_current_user_id
      ELSE TRUE
    END
  ORDER BY ru.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Recreate get_season_improvement_leaderboard with signature matching hook
CREATE OR REPLACE FUNCTION public.get_season_improvement_leaderboard(
  p_scope text DEFAULT 'global',
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  handicap_improvement numeric,
  start_handicap numeric,
  current_handicap numeric,
  home_club text,
  rank bigint,
  is_friend boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH current_season AS (
    SELECT cs.id, cs.start_date
    FROM championship_seasons cs
    WHERE cs.status = 'active'
    ORDER BY cs.start_date DESC
    LIMIT 1
  ),
  season_start_handicaps AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id,
      uhh.new_handicap AS start_handicap
    FROM user_handicap_history uhh, current_season cs
    WHERE uhh.changed_at >= cs.start_date
    ORDER BY uhh.user_id, uhh.changed_at ASC
  ),
  ranked_users AS (
    SELECT 
      up.id AS user_id,
      up.display_name,
      up.username,
      up.profile_photo_url AS avatar_url,
      COALESCE(ssh.start_handicap, up.eg_handicap_index) - up.eg_handicap_index AS handicap_improvement,
      COALESCE(ssh.start_handicap, up.eg_handicap_index) AS start_handicap,
      up.eg_handicap_index AS current_handicap,
      gc.name AS home_club,
      ROW_NUMBER() OVER (
        ORDER BY (COALESCE(ssh.start_handicap, up.eg_handicap_index) - up.eg_handicap_index) DESC NULLS LAST, 
        up.updated_at ASC
      ) AS rank
    FROM user_profiles up
    LEFT JOIN season_start_handicaps ssh ON ssh.user_id = up.id
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE up.eg_handicap_index IS NOT NULL
      AND (COALESCE(ssh.start_handicap, up.eg_handicap_index) - up.eg_handicap_index) > 0
  ),
  friend_ids AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE p_current_user_id IS NOT NULL
      AND uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  )
  SELECT 
    ru.user_id,
    ru.display_name,
    ru.username,
    ru.avatar_url,
    ru.handicap_improvement,
    ru.start_handicap,
    ru.current_handicap,
    ru.home_club,
    ru.rank,
    (p_current_user_id IS NOT NULL AND ru.user_id IN (SELECT fi.friend_id FROM friend_ids fi)) AS is_friend
  FROM ranked_users ru
  WHERE 
    CASE 
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN
        ru.user_id IN (SELECT fi.friend_id FROM friend_ids fi) OR ru.user_id = p_current_user_id
      ELSE TRUE
    END
  ORDER BY ru.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;