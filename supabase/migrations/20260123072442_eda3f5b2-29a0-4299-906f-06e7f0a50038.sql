-- Fix all leaderboard RPCs to use user_friends instead of follows

-- 1. get_countries_leaderboard
DROP FUNCTION IF EXISTS get_countries_leaderboard(TEXT, INT, INT, UUID);

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
  countries_count BIGINT,
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
  user_countries AS (
    SELECT 
      ues.user_id AS ues_user_id,
      COUNT(DISTINCT ues.country_code) AS countries_count
    FROM user_exploration_stats ues
    WHERE ues.country_code IS NOT NULL
    GROUP BY ues.user_id
  ),
  ranked AS (
    SELECT 
      uc.ues_user_id,
      up.display_name AS up_display_name,
      up.username AS up_username,
      up.avatar_url AS up_avatar_url,
      up.country_code AS up_country_code,
      uc.countries_count AS uc_countries_count,
      RANK() OVER (ORDER BY uc.countries_count DESC) AS user_rank
    FROM user_countries uc
    JOIN user_profiles up ON up.id = uc.ues_user_id
    WHERE (
      p_scope = 'global'
      OR (p_scope = 'friends' AND (uc.ues_user_id = p_current_user_id OR uc.ues_user_id IN (SELECT friend_id FROM user_friends_cte)))
    )
  )
  SELECT 
    r.ues_user_id AS user_id,
    r.up_display_name AS display_name,
    r.up_username AS username,
    r.up_avatar_url AS avatar_url,
    r.up_country_code AS country_code,
    r.uc_countries_count AS countries_count,
    r.user_rank AS rank
  FROM ranked r
  ORDER BY r.user_rank, r.up_display_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 2. get_regions_leaderboard
DROP FUNCTION IF EXISTS get_regions_leaderboard(TEXT, INT, INT, UUID);

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
  regions_count BIGINT,
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
  user_regions AS (
    SELECT 
      ues.user_id AS ues_user_id,
      COUNT(DISTINCT ues.region_slug) AS regions_count
    FROM user_exploration_stats ues
    WHERE ues.region_slug IS NOT NULL
      AND ues.courses_in_region >= ues.required_courses
    GROUP BY ues.user_id
  ),
  ranked AS (
    SELECT 
      ur.ues_user_id,
      up.display_name AS up_display_name,
      up.username AS up_username,
      up.avatar_url AS up_avatar_url,
      up.country_code AS up_country_code,
      ur.regions_count AS ur_regions_count,
      RANK() OVER (ORDER BY ur.regions_count DESC) AS user_rank
    FROM user_regions ur
    JOIN user_profiles up ON up.id = ur.ues_user_id
    WHERE (
      p_scope = 'global'
      OR (p_scope = 'friends' AND (ur.ues_user_id = p_current_user_id OR ur.ues_user_id IN (SELECT friend_id FROM user_friends_cte)))
    )
  )
  SELECT 
    r.ues_user_id AS user_id,
    r.up_display_name AS display_name,
    r.up_username AS username,
    r.up_avatar_url AS avatar_url,
    r.up_country_code AS country_code,
    r.ur_regions_count AS regions_count,
    r.user_rank AS rank
  FROM ranked r
  ORDER BY r.user_rank, r.up_display_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 3. get_handicap_improvement_leaderboard
DROP FUNCTION IF EXISTS get_handicap_improvement_leaderboard(INT, TEXT, TEXT, TEXT, INT, INT, INT, UUID);

CREATE OR REPLACE FUNCTION get_handicap_improvement_leaderboard(
  p_days INT DEFAULT 30,
  p_scope TEXT DEFAULT 'global',
  p_country_code TEXT DEFAULT NULL,
  p_region_slug TEXT DEFAULT NULL,
  p_min_improvement INT DEFAULT 1,
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
  current_handicap NUMERIC,
  previous_handicap NUMERIC,
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
  handicap_changes AS (
    SELECT 
      hh.user_id AS hh_user_id,
      hh.handicap_index AS current_hc,
      LAG(hh.handicap_index) OVER (PARTITION BY hh.user_id ORDER BY hh.recorded_at) AS previous_hc,
      hh.recorded_at
    FROM handicap_history hh
    WHERE hh.recorded_at >= NOW() - (p_days || ' days')::INTERVAL
  ),
  user_improvements AS (
    SELECT 
      hc.hh_user_id,
      MIN(hc.current_hc) AS current_handicap,
      MAX(hc.previous_hc) AS previous_handicap,
      MAX(hc.previous_hc) - MIN(hc.current_hc) AS improvement
    FROM handicap_changes hc
    WHERE hc.previous_hc IS NOT NULL
    GROUP BY hc.hh_user_id
    HAVING MAX(hc.previous_hc) - MIN(hc.current_hc) >= p_min_improvement
  ),
  ranked AS (
    SELECT 
      ui.hh_user_id,
      up.display_name AS up_display_name,
      up.username AS up_username,
      up.avatar_url AS up_avatar_url,
      up.country_code AS up_country_code,
      ui.current_handicap AS ui_current_handicap,
      ui.previous_handicap AS ui_previous_handicap,
      ui.improvement AS ui_improvement,
      RANK() OVER (ORDER BY ui.improvement DESC) AS user_rank
    FROM user_improvements ui
    JOIN user_profiles up ON up.id = ui.hh_user_id
    WHERE (
      p_scope = 'global'
      OR (p_scope = 'friends' AND (ui.hh_user_id = p_current_user_id OR ui.hh_user_id IN (SELECT friend_id FROM user_friends_cte)))
    )
    AND (p_country_code IS NULL OR up.country_code = p_country_code)
  )
  SELECT 
    r.hh_user_id AS user_id,
    r.up_display_name AS display_name,
    r.up_username AS username,
    r.up_avatar_url AS avatar_url,
    r.up_country_code AS country_code,
    r.ui_current_handicap AS current_handicap,
    r.ui_previous_handicap AS previous_handicap,
    r.ui_improvement AS improvement,
    r.user_rank AS rank
  FROM ranked r
  ORDER BY r.user_rank, r.up_display_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 4. get_lowest_handicap_leaderboard
DROP FUNCTION IF EXISTS get_lowest_handicap_leaderboard(TEXT, TEXT, TEXT, INT, INT, UUID);

CREATE OR REPLACE FUNCTION get_lowest_handicap_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_country_code TEXT DEFAULT NULL,
  p_region_slug TEXT DEFAULT NULL,
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
      up.handicap_index AS up_handicap_index,
      RANK() OVER (ORDER BY up.handicap_index ASC NULLS LAST) AS user_rank
    FROM user_profiles up
    WHERE up.handicap_index IS NOT NULL
    AND (
      p_scope = 'global'
      OR (p_scope = 'friends' AND (up.id = p_current_user_id OR up.id IN (SELECT friend_id FROM user_friends_cte)))
    )
    AND (p_country_code IS NULL OR up.country_code = p_country_code)
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
DROP FUNCTION IF EXISTS get_season_improvement_leaderboard(UUID, TEXT, INT, INT, UUID);

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

  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT uf.friend_id
    FROM user_friends uf
    WHERE uf.user_id = p_current_user_id
      AND uf.status = 'accepted'
  ),
  season_start_handicaps AS (
    SELECT DISTINCT ON (hh.user_id)
      hh.user_id AS hh_user_id,
      hh.handicap_index AS start_hc
    FROM handicap_history hh
    WHERE hh.recorded_at >= v_season_start
    ORDER BY hh.user_id, hh.recorded_at ASC
  ),
  current_handicaps AS (
    SELECT DISTINCT ON (hh.user_id)
      hh.user_id AS hh_user_id,
      hh.handicap_index AS current_hc
    FROM handicap_history hh
    WHERE hh.recorded_at >= v_season_start
    ORDER BY hh.user_id, hh.recorded_at DESC
  ),
  improvements AS (
    SELECT 
      ssh.hh_user_id,
      ssh.start_hc,
      ch.current_hc,
      ssh.start_hc - ch.current_hc AS improvement
    FROM season_start_handicaps ssh
    JOIN current_handicaps ch ON ch.hh_user_id = ssh.hh_user_id
    WHERE ssh.start_hc > ch.current_hc
  ),
  ranked AS (
    SELECT 
      i.hh_user_id,
      up.display_name AS up_display_name,
      up.username AS up_username,
      up.avatar_url AS up_avatar_url,
      up.country_code AS up_country_code,
      i.start_hc AS i_start_handicap,
      i.current_hc AS i_current_handicap,
      i.improvement AS i_improvement,
      RANK() OVER (ORDER BY i.improvement DESC) AS user_rank
    FROM improvements i
    JOIN user_profiles up ON up.id = i.hh_user_id
    WHERE (
      p_scope = 'global'
      OR (p_scope = 'friends' AND (i.hh_user_id = p_current_user_id OR i.hh_user_id IN (SELECT friend_id FROM user_friends_cte)))
    )
  )
  SELECT 
    r.hh_user_id AS user_id,
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

-- 6. get_user_exploration_status (this one may not use follows, but let's ensure consistency)
DROP FUNCTION IF EXISTS get_user_exploration_status(UUID);

CREATE OR REPLACE FUNCTION get_user_exploration_status(p_user_id UUID)
RETURNS TABLE (
  countries_visited BIGINT,
  regions_completed BIGINT,
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
      COUNT(DISTINCT ues.country_code) AS countries_count,
      COUNT(DISTINCT CASE WHEN ues.courses_in_region >= ues.required_courses THEN ues.region_slug END) AS regions_count,
      SUM(ues.courses_in_region) AS total_courses
    FROM user_exploration_stats ues
    WHERE ues.user_id = p_user_id
  ),
  all_countries AS (
    SELECT 
      ues.user_id AS ues_user_id,
      COUNT(DISTINCT ues.country_code) AS countries_count
    FROM user_exploration_stats ues
    GROUP BY ues.user_id
  ),
  all_regions AS (
    SELECT 
      ues.user_id AS ues_user_id,
      COUNT(DISTINCT CASE WHEN ues.courses_in_region >= ues.required_courses THEN ues.region_slug END) AS regions_count
    FROM user_exploration_stats ues
    GROUP BY ues.user_id
  ),
  country_ranks AS (
    SELECT 
      ac.ues_user_id,
      RANK() OVER (ORDER BY ac.countries_count DESC) AS c_rank
    FROM all_countries ac
  ),
  region_ranks AS (
    SELECT 
      ar.ues_user_id,
      RANK() OVER (ORDER BY ar.regions_count DESC) AS r_rank
    FROM all_regions ar
  )
  SELECT 
    us.countries_count AS countries_visited,
    us.regions_count AS regions_completed,
    us.total_courses AS total_courses_logged,
    COALESCE(cr.c_rank, 0) AS countries_rank,
    COALESCE(rr.r_rank, 0) AS regions_rank
  FROM user_stats us
  LEFT JOIN country_ranks cr ON cr.ues_user_id = p_user_id
  LEFT JOIN region_ranks rr ON rr.ues_user_id = p_user_id;
END;
$$;