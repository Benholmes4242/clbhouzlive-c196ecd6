-- Fix Issue 1: Update all leaderboard RPCs to use profile_photo_url instead of avatar_url

-- Drop and recreate get_countries_leaderboard with correct column
DROP FUNCTION IF EXISTS get_countries_leaderboard(text, integer, integer, uuid);

CREATE OR REPLACE FUNCTION get_countries_leaderboard(
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
  countries_count integer,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY ues.countries_played DESC, up.created_at ASC) AS rank,
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      COALESCE(ues.countries_played, 0) AS countries_count
    FROM user_profiles up
    LEFT JOIN user_exploration_stats ues ON ues.user_id = up.id
    WHERE up.is_public = true
      AND (
        p_scope = 'global'
        OR (p_scope = 'friends' AND (up.id IN (SELECT friend_id FROM user_friends_cte) OR up.id = p_current_user_id))
      )
  )
  SELECT
    r.rank,
    r.user_id,
    r.username,
    r.display_name,
    r.avatar_url,
    r.countries_count::integer,
    (r.user_id = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Drop and recreate get_regions_leaderboard with correct column
DROP FUNCTION IF EXISTS get_regions_leaderboard(text, integer, integer, uuid);

CREATE OR REPLACE FUNCTION get_regions_leaderboard(
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
  regions_count integer,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY ues.regions_completed DESC, up.created_at ASC) AS rank,
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      COALESCE(ues.regions_completed, 0) AS regions_count
    FROM user_profiles up
    LEFT JOIN user_exploration_stats ues ON ues.user_id = up.id
    WHERE up.is_public = true
      AND (
        p_scope = 'global'
        OR (p_scope = 'friends' AND (up.id IN (SELECT friend_id FROM user_friends_cte) OR up.id = p_current_user_id))
      )
  )
  SELECT
    r.rank,
    r.user_id,
    r.username,
    r.display_name,
    r.avatar_url,
    r.regions_count::integer,
    (r.user_id = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Drop and recreate get_handicap_improvement_leaderboard with correct column
DROP FUNCTION IF EXISTS get_handicap_improvement_leaderboard(text, integer, integer, uuid);

CREATE OR REPLACE FUNCTION get_handicap_improvement_leaderboard(
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
  current_handicap numeric,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  recent_history AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id,
      uhh.handicap_value AS current_handicap,
      FIRST_VALUE(uhh.handicap_value) OVER (
        PARTITION BY uhh.user_id 
        ORDER BY uhh.recorded_at ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
      ) AS oldest_handicap
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at >= NOW() - INTERVAL '30 days'
    ORDER BY uhh.user_id, uhh.recorded_at DESC
  ),
  improvements AS (
    SELECT
      rh.user_id,
      rh.current_handicap,
      (rh.oldest_handicap - rh.current_handicap) AS improvement
    FROM recent_history rh
    WHERE rh.oldest_handicap > rh.current_handicap
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY i.improvement DESC, up.created_at ASC) AS rank,
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      i.improvement,
      i.current_handicap
    FROM user_profiles up
    INNER JOIN improvements i ON i.user_id = up.id
    WHERE up.is_public = true
      AND (
        p_scope = 'global'
        OR (p_scope = 'friends' AND (up.id IN (SELECT friend_id FROM user_friends_cte) OR up.id = p_current_user_id))
      )
  )
  SELECT
    r.rank,
    r.user_id,
    r.username,
    r.display_name,
    r.avatar_url,
    r.improvement,
    r.current_handicap,
    (r.user_id = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Drop and recreate get_lowest_handicap_leaderboard with correct column
DROP FUNCTION IF EXISTS get_lowest_handicap_leaderboard(text, integer, integer, uuid);

CREATE OR REPLACE FUNCTION get_lowest_handicap_leaderboard(
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
BEGIN
  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY up.eg_handicap_index ASC, up.created_at ASC) AS rank,
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
        OR (p_scope = 'friends' AND (up.id IN (SELECT friend_id FROM user_friends_cte) OR up.id = p_current_user_id))
      )
  )
  SELECT
    r.rank,
    r.user_id,
    r.username,
    r.display_name,
    r.avatar_url,
    r.handicap_index,
    (r.user_id = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Drop and recreate get_season_improvement_leaderboard with correct column
DROP FUNCTION IF EXISTS get_season_improvement_leaderboard(text, integer, integer, uuid);

CREATE OR REPLACE FUNCTION get_season_improvement_leaderboard(
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
  v_season_start date := date_trunc('year', CURRENT_DATE)::date;
BEGIN
  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  season_start_handicaps AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id,
      uhh.handicap_value AS start_handicap
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at >= v_season_start
    ORDER BY uhh.user_id, uhh.recorded_at ASC
  ),
  current_handicaps AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id,
      uhh.handicap_value AS current_handicap
    FROM user_handicap_history uhh
    ORDER BY uhh.user_id, uhh.recorded_at DESC
  ),
  improvements AS (
    SELECT
      ssh.user_id,
      ssh.start_handicap,
      ch.current_handicap,
      (ssh.start_handicap - ch.current_handicap) AS improvement
    FROM season_start_handicaps ssh
    INNER JOIN current_handicaps ch ON ch.user_id = ssh.user_id
    WHERE ssh.start_handicap > ch.current_handicap
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY i.improvement DESC, up.created_at ASC) AS rank,
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      i.improvement,
      i.start_handicap,
      i.current_handicap
    FROM user_profiles up
    INNER JOIN improvements i ON i.user_id = up.id
    WHERE up.is_public = true
      AND (
        p_scope = 'global'
        OR (p_scope = 'friends' AND (up.id IN (SELECT friend_id FROM user_friends_cte) OR up.id = p_current_user_id))
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
    (r.user_id = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;