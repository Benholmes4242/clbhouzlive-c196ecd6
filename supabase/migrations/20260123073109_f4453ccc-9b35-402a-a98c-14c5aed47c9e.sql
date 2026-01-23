-- Step 1: Drop ALL versions of duplicate functions
DROP FUNCTION IF EXISTS get_countries_leaderboard(text, uuid, integer, integer);
DROP FUNCTION IF EXISTS get_countries_leaderboard(text, integer, integer, uuid);
DROP FUNCTION IF EXISTS get_regions_leaderboard(text, text, text, uuid, integer, integer);
DROP FUNCTION IF EXISTS get_regions_leaderboard(text, integer, integer, uuid);
DROP FUNCTION IF EXISTS get_handicap_improvement_leaderboard(integer, text, text, uuid, uuid, integer, integer, integer);
DROP FUNCTION IF EXISTS get_handicap_improvement_leaderboard(integer, text, text, text, integer, integer, integer, uuid);
DROP FUNCTION IF EXISTS get_lowest_handicap_leaderboard(text, text, uuid, uuid, integer, integer);
DROP FUNCTION IF EXISTS get_lowest_handicap_leaderboard(text, text, text, integer, integer, uuid);
DROP FUNCTION IF EXISTS get_season_improvement_leaderboard(uuid, text, uuid, integer, integer);
DROP FUNCTION IF EXISTS get_season_improvement_leaderboard(uuid, text, integer, integer, uuid);
DROP FUNCTION IF EXISTS get_user_exploration_status(uuid);

-- Step 2: Recreate RPCs with CORRECT table schemas

-- 1. get_countries_leaderboard - uses user_exploration_stats.countries_played
CREATE OR REPLACE FUNCTION get_countries_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  country_code TEXT,
  countries_count INT,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT uf.friend_id
    FROM user_friends uf
    WHERE uf.user_id = p_current_user_id
      AND uf.status = 'accepted'
  ),
  ranked AS (
    SELECT 
      ues.user_id AS ues_user_id,
      up.display_name AS up_display_name,
      up.username AS up_username,
      up.avatar_url AS up_avatar_url,
      up.country_code AS up_country_code,
      ues.countries_played AS ues_countries_count,
      RANK() OVER (ORDER BY ues.countries_played DESC) AS user_rank
    FROM user_exploration_stats ues
    JOIN user_profiles up ON up.id = ues.user_id
    WHERE ues.countries_played > 0
    AND (
      p_scope = 'global'
      OR (p_scope = 'friends' AND (ues.user_id = p_current_user_id OR ues.user_id IN (SELECT friend_id FROM user_friends_cte)))
    )
  )
  SELECT 
    r.ues_user_id AS user_id,
    r.up_display_name AS display_name,
    r.up_username AS username,
    r.up_avatar_url AS avatar_url,
    r.up_country_code AS country_code,
    r.ues_countries_count AS countries_count,
    r.user_rank AS rank
  FROM ranked r
  ORDER BY r.user_rank, r.up_display_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 2. get_regions_leaderboard - uses user_exploration_stats.regions_completed
CREATE OR REPLACE FUNCTION get_regions_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  country_code TEXT,
  regions_count INT,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT uf.friend_id
    FROM user_friends uf
    WHERE uf.user_id = p_current_user_id
      AND uf.status = 'accepted'
  ),
  ranked AS (
    SELECT 
      ues.user_id AS ues_user_id,
      up.display_name AS up_display_name,
      up.username AS up_username,
      up.avatar_url AS up_avatar_url,
      up.country_code AS up_country_code,
      ues.regions_completed AS ues_regions_count,
      RANK() OVER (ORDER BY ues.regions_completed DESC) AS user_rank
    FROM user_exploration_stats ues
    JOIN user_profiles up ON up.id = ues.user_id
    WHERE ues.regions_completed > 0
    AND (
      p_scope = 'global'
      OR (p_scope = 'friends' AND (ues.user_id = p_current_user_id OR ues.user_id IN (SELECT friend_id FROM user_friends_cte)))
    )
  )
  SELECT 
    r.ues_user_id AS user_id,
    r.up_display_name AS display_name,
    r.up_username AS username,
    r.up_avatar_url AS avatar_url,
    r.up_country_code AS country_code,
    r.ues_regions_count AS regions_count,
    r.user_rank AS rank
  FROM ranked r
  ORDER BY r.user_rank, r.up_display_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 3. get_handicap_improvement_leaderboard - uses user_handicap_history.handicap_value
CREATE OR REPLACE FUNCTION get_handicap_improvement_leaderboard(
  p_days INT DEFAULT 30,
  p_scope TEXT DEFAULT 'global',
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  country_code TEXT,
  handicap_before NUMERIC,
  handicap_current NUMERIC,
  improvement NUMERIC,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT uf.friend_id
    FROM user_friends uf
    WHERE uf.user_id = p_current_user_id
      AND uf.status = 'accepted'
  ),
  -- Get earliest handicap in period for each user
  period_start AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id AS uhh_user_id,
      uhh.handicap_value AS start_value
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at >= NOW() - (p_days || ' days')::INTERVAL
    ORDER BY uhh.user_id, uhh.recorded_at ASC
  ),
  -- Get latest handicap for each user
  period_end AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id AS uhh_user_id,
      uhh.handicap_value AS end_value
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at >= NOW() - (p_days || ' days')::INTERVAL
    ORDER BY uhh.user_id, uhh.recorded_at DESC
  ),
  improvements AS (
    SELECT 
      ps.uhh_user_id,
      ps.start_value,
      pe.end_value,
      ps.start_value - pe.end_value AS improvement_amount
    FROM period_start ps
    JOIN period_end pe ON pe.uhh_user_id = ps.uhh_user_id
    WHERE ps.start_value > pe.end_value  -- Only include actual improvements
  ),
  ranked AS (
    SELECT 
      i.uhh_user_id,
      up.display_name AS up_display_name,
      up.username AS up_username,
      up.avatar_url AS up_avatar_url,
      up.country_code AS up_country_code,
      i.start_value AS i_handicap_before,
      i.end_value AS i_handicap_current,
      i.improvement_amount AS i_improvement,
      RANK() OVER (ORDER BY i.improvement_amount DESC) AS user_rank
    FROM improvements i
    JOIN user_profiles up ON up.id = i.uhh_user_id
    WHERE (
      p_scope = 'global'
      OR (p_scope = 'friends' AND (i.uhh_user_id = p_current_user_id OR i.uhh_user_id IN (SELECT friend_id FROM user_friends_cte)))
    )
  )
  SELECT 
    r.uhh_user_id AS user_id,
    r.up_display_name AS display_name,
    r.up_username AS username,
    r.up_avatar_url AS avatar_url,
    r.up_country_code AS country_code,
    r.i_handicap_before AS handicap_before,
    r.i_handicap_current AS handicap_current,
    r.i_improvement AS improvement,
    r.user_rank AS rank
  FROM ranked r
  ORDER BY r.user_rank, r.up_display_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 4. get_lowest_handicap_leaderboard - uses user_profiles.eg_handicap_index
CREATE OR REPLACE FUNCTION get_lowest_handicap_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  country_code TEXT,
  handicap_index NUMERIC,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT uf.friend_id
    FROM user_friends uf
    WHERE uf.user_id = p_current_user_id
      AND uf.status = 'accepted'
  ),
  ranked AS (
    SELECT 
      up.id AS up_id,
      up.display_name AS up_display_name,
      up.username AS up_username,
      up.avatar_url AS up_avatar_url,
      up.country_code AS up_country_code,
      up.eg_handicap_index AS up_handicap_index,
      RANK() OVER (ORDER BY up.eg_handicap_index ASC NULLS LAST) AS user_rank
    FROM user_profiles up
    WHERE up.eg_handicap_index IS NOT NULL
    AND (
      p_scope = 'global'
      OR (p_scope = 'friends' AND (up.id = p_current_user_id OR up.id IN (SELECT friend_id FROM user_friends_cte)))
    )
  )
  SELECT 
    r.up_id AS user_id,
    r.up_display_name AS display_name,
    r.up_username AS username,
    r.up_avatar_url AS avatar_url,
    r.up_country_code AS country_code,
    r.up_handicap_index AS handicap_index,
    r.user_rank AS rank
  FROM ranked r
  ORDER BY r.user_rank, r.up_display_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 5. get_season_improvement_leaderboard
CREATE OR REPLACE FUNCTION get_season_improvement_leaderboard(
  p_season_id UUID DEFAULT NULL,
  p_scope TEXT DEFAULT 'global',
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  country_code TEXT,
  start_handicap NUMERIC,
  current_handicap NUMERIC,
  improvement NUMERIC,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id UUID;
  v_season_start TIMESTAMPTZ;
BEGIN
  -- Get current season if not specified
  IF p_season_id IS NULL THEN
    SELECT cs.id, cs.start_date INTO v_season_id, v_season_start
    FROM championship_seasons cs
    WHERE cs.status = 'active'
    ORDER BY cs.start_date DESC
    LIMIT 1;
  ELSE
    SELECT cs.id, cs.start_date INTO v_season_id, v_season_start
    FROM championship_seasons cs
    WHERE cs.id = p_season_id;
  END IF;

  -- Default to 90 days ago if no season found
  IF v_season_start IS NULL THEN
    v_season_start := NOW() - INTERVAL '90 days';
  END IF;

  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT uf.friend_id
    FROM user_friends uf
    WHERE uf.user_id = p_current_user_id
      AND uf.status = 'accepted'
  ),
  season_start_handicaps AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id AS uhh_user_id,
      uhh.handicap_value AS start_hc
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at >= v_season_start
    ORDER BY uhh.user_id, uhh.recorded_at ASC
  ),
  current_handicaps AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id AS uhh_user_id,
      uhh.handicap_value AS current_hc
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at >= v_season_start
    ORDER BY uhh.user_id, uhh.recorded_at DESC
  ),
  improvements AS (
    SELECT 
      ssh.uhh_user_id,
      ssh.start_hc,
      ch.current_hc,
      ssh.start_hc - ch.current_hc AS improvement_amount
    FROM season_start_handicaps ssh
    JOIN current_handicaps ch ON ch.uhh_user_id = ssh.uhh_user_id
    WHERE ssh.start_hc > ch.current_hc
  ),
  ranked AS (
    SELECT 
      i.uhh_user_id,
      up.display_name AS up_display_name,
      up.username AS up_username,
      up.avatar_url AS up_avatar_url,
      up.country_code AS up_country_code,
      i.start_hc AS i_start_handicap,
      i.current_hc AS i_current_handicap,
      i.improvement_amount AS i_improvement,
      RANK() OVER (ORDER BY i.improvement_amount DESC) AS user_rank
    FROM improvements i
    JOIN user_profiles up ON up.id = i.uhh_user_id
    WHERE (
      p_scope = 'global'
      OR (p_scope = 'friends' AND (i.uhh_user_id = p_current_user_id OR i.uhh_user_id IN (SELECT friend_id FROM user_friends_cte)))
    )
  )
  SELECT 
    r.uhh_user_id AS user_id,
    r.up_display_name AS display_name,
    r.up_username AS username,
    r.up_avatar_url AS avatar_url,
    r.up_country_code AS country_code,
    r.i_start_handicap AS start_handicap,
    r.i_current_handicap AS current_handicap,
    r.i_improvement AS improvement,
    r.user_rank AS rank
  FROM ranked r
  ORDER BY r.user_rank, r.up_display_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 6. get_user_exploration_status
CREATE OR REPLACE FUNCTION get_user_exploration_status(p_user_id UUID)
RETURNS TABLE (
  countries_visited INT,
  regions_completed INT,
  total_courses_logged BIGINT,
  countries_rank BIGINT,
  regions_rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      ues.countries_played,
      ues.regions_completed AS regions_count
    FROM user_exploration_stats ues
    WHERE ues.user_id = p_user_id
  ),
  all_users_countries AS (
    SELECT 
      ues.user_id AS ues_user_id,
      ues.countries_played
    FROM user_exploration_stats ues
    WHERE ues.countries_played > 0
  ),
  all_users_regions AS (
    SELECT 
      ues.user_id AS ues_user_id,
      ues.regions_completed
    FROM user_exploration_stats ues
    WHERE ues.regions_completed > 0
  ),
  country_ranks AS (
    SELECT 
      auc.ues_user_id,
      RANK() OVER (ORDER BY auc.countries_played DESC) AS c_rank
    FROM all_users_countries auc
  ),
  region_ranks AS (
    SELECT 
      aur.ues_user_id,
      RANK() OVER (ORDER BY aur.regions_completed DESC) AS r_rank
    FROM all_users_regions aur
  ),
  course_count AS (
    SELECT COUNT(*) AS total
    FROM course_ratings cr
    WHERE cr.user_id = p_user_id
  )
  SELECT 
    COALESCE(us.countries_played, 0) AS countries_visited,
    COALESCE(us.regions_count, 0) AS regions_completed,
    COALESCE(cc.total, 0) AS total_courses_logged,
    COALESCE(cr.c_rank, 0) AS countries_rank,
    COALESCE(rr.r_rank, 0) AS regions_rank
  FROM user_stats us
  CROSS JOIN course_count cc
  LEFT JOIN country_ranks cr ON cr.ues_user_id = p_user_id
  LEFT JOIN region_ranks rr ON rr.ues_user_id = p_user_id;
END;
$$;