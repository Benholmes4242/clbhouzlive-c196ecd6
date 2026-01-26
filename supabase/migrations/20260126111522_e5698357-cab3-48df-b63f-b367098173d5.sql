-- Update get_lowest_handicap_leaderboard to support club scope
CREATE OR REPLACE FUNCTION public.get_lowest_handicap_leaderboard(
  p_scope text DEFAULT 'global',
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  handicap_index double precision,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_club_id uuid;
BEGIN
  -- Get current user's primary club for club scope
  IF p_scope = 'club' AND p_current_user_id IS NOT NULL THEN
    SELECT primary_club_id INTO v_user_club_id
    FROM user_profiles
    WHERE id = p_current_user_id;
  END IF;

  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE p_current_user_id IS NOT NULL
      AND uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY up.eg_handicap_index ASC NULLS LAST, up.id) AS rank,
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      up.eg_handicap_index AS handicap_index
    FROM user_profiles up
    WHERE up.is_public = true
      AND up.eg_handicap_index IS NOT NULL
      AND (
        p_scope = 'global'
        OR (p_scope = 'friends' AND p_current_user_id IS NOT NULL 
            AND (up.id IN (SELECT friend_id FROM user_friends_cte) OR up.id = p_current_user_id))
        OR (p_scope = 'club' AND v_user_club_id IS NOT NULL 
            AND up.primary_club_id = v_user_club_id)
      )
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
$function$;

-- Update get_handicap_improvement_leaderboard to support club scope
CREATE OR REPLACE FUNCTION public.get_handicap_improvement_leaderboard(
  p_scope text DEFAULT 'global',
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  improvement double precision,
  handicap_before double precision,
  current_handicap double precision,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_club_id uuid;
BEGIN
  -- Get current user's primary club for club scope
  IF p_scope = 'club' AND p_current_user_id IS NOT NULL THEN
    SELECT primary_club_id INTO v_user_club_id
    FROM user_profiles
    WHERE id = p_current_user_id;
  END IF;

  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE p_current_user_id IS NOT NULL
      AND uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  handicap_30_days_ago AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id,
      uhh.handicap_value AS handicap_before
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at <= NOW() - INTERVAL '30 days'
    ORDER BY uhh.user_id, uhh.recorded_at DESC
  ),
  improvements AS (
    SELECT
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      h30.handicap_before,
      up.eg_handicap_index AS current_handicap,
      (h30.handicap_before - up.eg_handicap_index) AS improvement,
      up.primary_club_id
    FROM handicap_30_days_ago h30
    JOIN user_profiles up ON up.id = h30.user_id
    WHERE up.is_public = true
      AND up.eg_handicap_index IS NOT NULL
      AND h30.handicap_before > up.eg_handicap_index
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY i.improvement DESC, i.user_id) AS rank,
      i.*
    FROM improvements i
    WHERE (
      p_scope = 'global'
      OR (p_scope = 'friends' AND p_current_user_id IS NOT NULL 
          AND (i.user_id IN (SELECT friend_id FROM user_friends_cte) OR i.user_id = p_current_user_id))
      OR (p_scope = 'club' AND v_user_club_id IS NOT NULL 
          AND i.primary_club_id = v_user_club_id)
    )
  )
  SELECT
    r.rank,
    r.user_id,
    r.username,
    r.display_name,
    r.avatar_url,
    r.improvement,
    r.handicap_before,
    r.current_handicap,
    (p_current_user_id IS NOT NULL AND r.user_id = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- Update get_season_improvement_leaderboard to support club scope
CREATE OR REPLACE FUNCTION public.get_season_improvement_leaderboard(
  p_scope text DEFAULT 'global',
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  improvement double precision,
  start_handicap double precision,
  current_handicap double precision,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_club_id uuid;
BEGIN
  -- Get current user's primary club for club scope
  IF p_scope = 'club' AND p_current_user_id IS NOT NULL THEN
    SELECT primary_club_id INTO v_user_club_id
    FROM user_profiles
    WHERE id = p_current_user_id;
  END IF;

  RETURN QUERY
  WITH current_season AS (
    SELECT cs.id, cs.start_date
    FROM championship_seasons cs
    WHERE cs.status = 'active'
    ORDER BY cs.start_date DESC
    LIMIT 1
  ),
  user_friends_cte AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE p_current_user_id IS NOT NULL
      AND uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  season_start_handicaps AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id,
      uhh.handicap_value AS start_handicap
    FROM user_handicap_history uhh, current_season cs
    WHERE uhh.recorded_at >= cs.start_date
    ORDER BY uhh.user_id, uhh.recorded_at ASC
  ),
  improvements AS (
    SELECT
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      ssh.start_handicap,
      up.eg_handicap_index AS current_handicap,
      (ssh.start_handicap - up.eg_handicap_index) AS improvement,
      up.primary_club_id
    FROM season_start_handicaps ssh
    JOIN user_profiles up ON up.id = ssh.user_id
    WHERE up.is_public = true
      AND up.eg_handicap_index IS NOT NULL
      AND ssh.start_handicap > up.eg_handicap_index
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY i.improvement DESC, i.user_id) AS rank,
      i.*
    FROM improvements i
    WHERE (
      p_scope = 'global'
      OR (p_scope = 'friends' AND p_current_user_id IS NOT NULL 
          AND (i.user_id IN (SELECT friend_id FROM user_friends_cte) OR i.user_id = p_current_user_id))
      OR (p_scope = 'club' AND v_user_club_id IS NOT NULL 
          AND i.primary_club_id = v_user_club_id)
    )
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
$function$;