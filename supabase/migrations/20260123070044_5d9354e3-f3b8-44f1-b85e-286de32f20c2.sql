-- Fix: Drop and recreate all leaderboard RPC functions with explicit table aliases
-- to resolve ambiguous column reference errors

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_countries_leaderboard(TEXT, UUID, INT, INT);
DROP FUNCTION IF EXISTS public.get_regions_leaderboard(TEXT, TEXT, TEXT, UUID, INT, INT);
DROP FUNCTION IF EXISTS public.get_handicap_improvement_leaderboard(INT, TEXT, TEXT, UUID, UUID, INT, INT, INT);
DROP FUNCTION IF EXISTS public.get_lowest_handicap_leaderboard(TEXT, TEXT, UUID, UUID, INT, INT);
DROP FUNCTION IF EXISTS public.get_season_improvement_leaderboard(UUID, TEXT, UUID, INT, INT);
DROP FUNCTION IF EXISTS public.get_user_exploration_status(UUID);

-- 1. Recreate get_countries_leaderboard
CREATE FUNCTION public.get_countries_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_current_user_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  countries_played INT,
  country_list TEXT[],
  recent_countries TEXT[],
  rank BIGINT,
  is_friend BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      ues.user_id AS ues_user_id,
      ues.countries_played AS ues_countries_played,
      ues.country_list AS ues_country_list,
      ROW_NUMBER() OVER (ORDER BY ues.countries_played DESC, ues.user_id) AS rnk
    FROM user_exploration_stats ues
    JOIN user_profiles up ON up.id = ues.user_id
    WHERE up.is_public = true
      AND ues.countries_played > 0
      AND (
        p_scope = 'global'
        OR (p_scope = 'friends' AND p_current_user_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM follows f WHERE f.follower_id = p_current_user_id AND f.following_id = ues.user_id
        ))
        OR (p_scope = 'club' AND p_current_user_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM user_profiles up2 
          WHERE up2.id = ues.user_id 
            AND up2.primary_club_id IS NOT NULL
            AND up2.primary_club_id = (SELECT up3.primary_club_id FROM user_profiles up3 WHERE up3.id = p_current_user_id)
        ))
      )
  )
  SELECT
    r.ues_user_id AS user_id,
    COALESCE(up.display_name, up.username, 'Golfer')::TEXT AS display_name,
    up.profile_photo_url::TEXT AS profile_photo_url,
    ba.name::TEXT AS home_club,
    r.ues_countries_played::INT AS countries_played,
    r.ues_country_list AS country_list,
    (SELECT ARRAY_AGG(c) FROM (SELECT UNNEST(r.ues_country_list) AS c ORDER BY c LIMIT 3) sub)::TEXT[] AS recent_countries,
    r.rnk AS rank,
    (p_current_user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM follows f WHERE f.follower_id = p_current_user_id AND f.following_id = r.ues_user_id
    ))::BOOLEAN AS is_friend
  FROM ranked r
  JOIN user_profiles up ON up.id = r.ues_user_id
  LEFT JOIN business_accounts ba ON ba.id = up.primary_club_id
  ORDER BY r.rnk
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 2. Recreate get_regions_leaderboard
CREATE FUNCTION public.get_regions_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_region_type TEXT DEFAULT 'all',
  p_parent_region TEXT DEFAULT NULL,
  p_current_user_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  regions_completed INT,
  total_regions INT,
  region_list TEXT[],
  completion_percentage INT,
  rank BIGINT,
  is_friend BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_regions INT;
BEGIN
  SELECT COUNT(*) INTO v_total_regions
  FROM regions_config rc
  WHERE rc.is_completable = true
    AND (p_region_type = 'all' OR rc.region_type = p_region_type)
    AND (p_parent_region IS NULL OR rc.parent_slug = p_parent_region);

  RETURN QUERY
  WITH ranked AS (
    SELECT
      ues.user_id AS ues_user_id,
      ues.regions_completed AS ues_regions_completed,
      ues.region_list AS ues_region_list,
      ROW_NUMBER() OVER (ORDER BY ues.regions_completed DESC, ues.user_id) AS rnk
    FROM user_exploration_stats ues
    JOIN user_profiles up ON up.id = ues.user_id
    WHERE up.is_public = true
      AND ues.regions_completed > 0
      AND (
        p_scope = 'global'
        OR (p_scope = 'friends' AND p_current_user_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM follows f WHERE f.follower_id = p_current_user_id AND f.following_id = ues.user_id
        ))
        OR (p_scope = 'club' AND p_current_user_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM user_profiles up2 
          WHERE up2.id = ues.user_id 
            AND up2.primary_club_id IS NOT NULL
            AND up2.primary_club_id = (SELECT up3.primary_club_id FROM user_profiles up3 WHERE up3.id = p_current_user_id)
        ))
      )
  )
  SELECT
    r.ues_user_id AS user_id,
    COALESCE(up.display_name, up.username, 'Golfer')::TEXT AS display_name,
    up.profile_photo_url::TEXT AS profile_photo_url,
    ba.name::TEXT AS home_club,
    r.ues_regions_completed::INT AS regions_completed,
    v_total_regions AS total_regions,
    r.ues_region_list AS region_list,
    CASE WHEN v_total_regions > 0 
      THEN ((r.ues_regions_completed::NUMERIC / v_total_regions) * 100)::INT 
      ELSE 0 
    END AS completion_percentage,
    r.rnk AS rank,
    (p_current_user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM follows f WHERE f.follower_id = p_current_user_id AND f.following_id = r.ues_user_id
    ))::BOOLEAN AS is_friend
  FROM ranked r
  JOIN user_profiles up ON up.id = r.ues_user_id
  LEFT JOIN business_accounts ba ON ba.id = up.primary_club_id
  ORDER BY r.rnk
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 3. Recreate get_handicap_improvement_leaderboard
CREATE FUNCTION public.get_handicap_improvement_leaderboard(
  p_days INT DEFAULT 30,
  p_scope TEXT DEFAULT 'global',
  p_region TEXT DEFAULT NULL,
  p_club_id UUID DEFAULT NULL,
  p_current_user_id UUID DEFAULT NULL,
  p_min_rounds INT DEFAULT 3,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  handicap_before NUMERIC,
  handicap_current NUMERIC,
  improvement NUMERIC,
  rounds_in_period INT,
  rank BIGINT,
  is_friend BOOLEAN,
  is_big_mover BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff_date TIMESTAMPTZ := NOW() - (p_days || ' days')::INTERVAL;
BEGIN
  RETURN QUERY
  WITH user_start_handicap AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id AS uhh_user_id,
      uhh.handicap_value AS start_handicap
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at <= v_cutoff_date
    ORDER BY uhh.user_id, uhh.recorded_at DESC
  ),
  improvements AS (
    SELECT
      up.id AS up_user_id,
      ush.start_handicap AS hc_before,
      up.eg_handicap_index AS hc_current,
      (ush.start_handicap - up.eg_handicap_index) AS hc_improvement,
      (SELECT COUNT(*) FROM course_ratings cr WHERE cr.user_id = up.id AND cr.created_at >= v_cutoff_date)::INT AS rounds_count
    FROM user_profiles up
    JOIN user_start_handicap ush ON ush.uhh_user_id = up.id
    WHERE up.is_public = true
      AND up.show_handicap = true
      AND up.eg_handicap_index IS NOT NULL
      AND (ush.start_handicap - up.eg_handicap_index) > 0
      AND (
        p_scope = 'global'
        OR (p_scope = 'friends' AND p_current_user_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM follows f WHERE f.follower_id = p_current_user_id AND f.following_id = up.id
        ))
        OR (p_scope = 'club' AND p_club_id IS NOT NULL AND up.primary_club_id = p_club_id)
        OR (p_scope = 'club' AND p_club_id IS NULL AND p_current_user_id IS NOT NULL AND up.primary_club_id = (
          SELECT up2.primary_club_id FROM user_profiles up2 WHERE up2.id = p_current_user_id
        ))
      )
  ),
  ranked AS (
    SELECT
      imp.up_user_id,
      imp.hc_before,
      imp.hc_current,
      imp.hc_improvement,
      imp.rounds_count,
      ROW_NUMBER() OVER (ORDER BY imp.hc_improvement DESC, imp.up_user_id) AS rnk
    FROM improvements imp
    WHERE imp.rounds_count >= p_min_rounds
  )
  SELECT
    r.up_user_id AS user_id,
    COALESCE(up.display_name, up.username, 'Golfer')::TEXT AS display_name,
    up.profile_photo_url::TEXT AS profile_photo_url,
    ba.name::TEXT AS home_club,
    r.hc_before AS handicap_before,
    r.hc_current AS handicap_current,
    r.hc_improvement AS improvement,
    r.rounds_count AS rounds_in_period,
    r.rnk AS rank,
    (p_current_user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM follows f WHERE f.follower_id = p_current_user_id AND f.following_id = r.up_user_id
    ))::BOOLEAN AS is_friend,
    (r.hc_improvement >= 2.0)::BOOLEAN AS is_big_mover
  FROM ranked r
  JOIN user_profiles up ON up.id = r.up_user_id
  LEFT JOIN business_accounts ba ON ba.id = up.primary_club_id
  ORDER BY r.rnk
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 4. Recreate get_lowest_handicap_leaderboard
CREATE FUNCTION public.get_lowest_handicap_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_region TEXT DEFAULT NULL,
  p_club_id UUID DEFAULT NULL,
  p_current_user_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  primary_club_id UUID,
  current_handicap NUMERIC,
  rank BIGINT,
  is_friend BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      up.id AS up_user_id,
      up.eg_handicap_index AS up_handicap,
      up.primary_club_id AS up_club_id,
      ROW_NUMBER() OVER (ORDER BY up.eg_handicap_index ASC, up.id) AS rnk
    FROM user_profiles up
    WHERE up.is_public = true
      AND up.show_handicap = true
      AND up.eg_handicap_index IS NOT NULL
      AND (
        p_scope = 'global'
        OR (p_scope = 'friends' AND p_current_user_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM follows f WHERE f.follower_id = p_current_user_id AND f.following_id = up.id
        ))
        OR (p_scope = 'club' AND p_club_id IS NOT NULL AND up.primary_club_id = p_club_id)
        OR (p_scope = 'club' AND p_club_id IS NULL AND p_current_user_id IS NOT NULL AND up.primary_club_id = (
          SELECT up2.primary_club_id FROM user_profiles up2 WHERE up2.id = p_current_user_id
        ))
      )
  )
  SELECT
    r.up_user_id AS user_id,
    COALESCE(up.display_name, up.username, 'Golfer')::TEXT AS display_name,
    up.profile_photo_url::TEXT AS profile_photo_url,
    ba.name::TEXT AS home_club,
    r.up_club_id AS primary_club_id,
    r.up_handicap AS current_handicap,
    r.rnk AS rank,
    (p_current_user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM follows f WHERE f.follower_id = p_current_user_id AND f.following_id = r.up_user_id
    ))::BOOLEAN AS is_friend
  FROM ranked r
  JOIN user_profiles up ON up.id = r.up_user_id
  LEFT JOIN business_accounts ba ON ba.id = up.primary_club_id
  ORDER BY r.rnk
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 5. Recreate get_season_improvement_leaderboard
CREATE FUNCTION public.get_season_improvement_leaderboard(
  p_season_id UUID DEFAULT NULL,
  p_scope TEXT DEFAULT 'global',
  p_current_user_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  handicap_season_start NUMERIC,
  handicap_current NUMERIC,
  improvement NUMERIC,
  rank BIGINT,
  is_friend BOOLEAN,
  season_name TEXT,
  days_remaining INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season RECORD;
BEGIN
  IF p_season_id IS NOT NULL THEN
    SELECT * INTO v_season FROM championship_seasons cs WHERE cs.id = p_season_id;
  ELSE
    SELECT * INTO v_season FROM championship_seasons cs WHERE cs.status = 'active' ORDER BY cs.start_date DESC LIMIT 1;
  END IF;

  IF v_season IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH season_start_handicaps AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id AS uhh_user_id,
      uhh.handicap_value AS start_handicap
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at <= v_season.start_date
    ORDER BY uhh.user_id, uhh.recorded_at DESC
  ),
  improvements AS (
    SELECT
      up.id AS up_user_id,
      ssh.start_handicap AS hc_season_start,
      up.eg_handicap_index AS hc_current,
      (ssh.start_handicap - up.eg_handicap_index) AS hc_improvement
    FROM user_profiles up
    JOIN season_start_handicaps ssh ON ssh.uhh_user_id = up.id
    WHERE up.is_public = true
      AND up.show_handicap = true
      AND up.eg_handicap_index IS NOT NULL
      AND (ssh.start_handicap - up.eg_handicap_index) > 0
      AND (
        p_scope = 'global'
        OR (p_scope = 'friends' AND p_current_user_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM follows f WHERE f.follower_id = p_current_user_id AND f.following_id = up.id
        ))
        OR (p_scope = 'club' AND p_current_user_id IS NOT NULL AND up.primary_club_id = (
          SELECT up2.primary_club_id FROM user_profiles up2 WHERE up2.id = p_current_user_id
        ))
      )
  ),
  ranked AS (
    SELECT
      imp.up_user_id,
      imp.hc_season_start,
      imp.hc_current,
      imp.hc_improvement,
      ROW_NUMBER() OVER (ORDER BY imp.hc_improvement DESC, imp.up_user_id) AS rnk
    FROM improvements imp
  )
  SELECT
    r.up_user_id AS user_id,
    COALESCE(up.display_name, up.username, 'Golfer')::TEXT AS display_name,
    up.profile_photo_url::TEXT AS profile_photo_url,
    ba.name::TEXT AS home_club,
    r.hc_season_start AS handicap_season_start,
    r.hc_current AS handicap_current,
    r.hc_improvement AS improvement,
    r.rnk AS rank,
    (p_current_user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM follows f WHERE f.follower_id = p_current_user_id AND f.following_id = r.up_user_id
    ))::BOOLEAN AS is_friend,
    v_season.name::TEXT AS season_name,
    GREATEST(0, (v_season.end_date::DATE - CURRENT_DATE))::INT AS days_remaining
  FROM ranked r
  JOIN user_profiles up ON up.id = r.up_user_id
  LEFT JOIN business_accounts ba ON ba.id = up.primary_club_id
  ORDER BY r.rnk
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 6. Recreate get_user_exploration_status
CREATE FUNCTION public.get_user_exploration_status(p_user_id UUID)
RETURNS TABLE (
  countries_played INT,
  countries_rank BIGINT,
  country_list TEXT[],
  regions_completed INT,
  regions_rank BIGINT,
  total_regions INT,
  region_list TEXT[],
  next_country_suggestion TEXT,
  next_region_suggestion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_countries_played INT;
  v_regions_completed INT;
  v_country_list TEXT[];
  v_region_list TEXT[];
  v_countries_rank BIGINT;
  v_regions_rank BIGINT;
  v_total_regions INT;
BEGIN
  SELECT 
    ues.countries_played,
    ues.regions_completed,
    ues.country_list,
    ues.region_list
  INTO v_countries_played, v_regions_completed, v_country_list, v_region_list
  FROM user_exploration_stats ues
  WHERE ues.user_id = p_user_id;

  IF v_countries_played IS NULL THEN
    v_countries_played := 0;
    v_regions_completed := 0;
    v_country_list := ARRAY[]::TEXT[];
    v_region_list := ARRAY[]::TEXT[];
  END IF;

  SELECT COUNT(*) + 1 INTO v_countries_rank
  FROM user_exploration_stats ues2
  JOIN user_profiles up ON up.id = ues2.user_id
  WHERE up.is_public = true
    AND ues2.countries_played > v_countries_played;

  SELECT COUNT(*) + 1 INTO v_regions_rank
  FROM user_exploration_stats ues3
  JOIN user_profiles up ON up.id = ues3.user_id
  WHERE up.is_public = true
    AND ues3.regions_completed > v_regions_completed;

  SELECT COUNT(*) INTO v_total_regions
  FROM regions_config rc
  WHERE rc.is_completable = true;

  RETURN QUERY
  SELECT
    v_countries_played,
    v_countries_rank,
    v_country_list,
    v_regions_completed,
    v_regions_rank,
    v_total_regions,
    v_region_list,
    NULL::TEXT AS next_country_suggestion,
    NULL::TEXT AS next_region_suggestion;
END;
$$;