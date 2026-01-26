-- Fix functions with correct column names
-- division_config: division_id (not slug), display_name (not label), threshold (not min_courses)
-- user_home_clubs: user_profile_id (not user_id)

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_podium_seasonal(text, uuid);
DROP FUNCTION IF EXISTS get_podium_all_time(uuid);
DROP FUNCTION IF EXISTS get_championship_leaderboard(text, text, uuid, integer, integer, uuid);
DROP FUNCTION IF EXISTS get_championship_leaderboard_alltime(text, uuid, integer, integer, uuid);

-- Recreate get_podium_seasonal with correct schema
CREATE OR REPLACE FUNCTION get_podium_seasonal(
  p_season_id TEXT,
  p_club_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  current_rank INTEGER,
  courses_count INTEGER,
  division_slug TEXT,
  division_label TEXT,
  ring_color TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id AS user_id,
    up.username,
    up.display_name,
    up.avatar_url,
    uss.current_rank,
    uss.courses_logged AS courses_count,
    dc.division_id AS division_slug,
    dc.display_name AS division_label,
    dc.ring_color
  FROM user_season_stats uss
  JOIN user_profiles up ON up.id = uss.user_id
  LEFT JOIN division_config dc ON dc.division_id = uss.current_division
  WHERE uss.season_id = p_season_id::uuid
    AND uss.current_rank IS NOT NULL
    AND uss.current_rank <= 3
    AND (
      p_club_id IS NULL 
      OR up.primary_club_id = p_club_id 
      OR EXISTS (
        SELECT 1 FROM user_home_clubs uhc 
        WHERE uhc.user_profile_id = up.id AND uhc.club_id = p_club_id
      )
    )
  ORDER BY uss.current_rank ASC
  LIMIT 3;
END;
$$;

-- Recreate get_podium_all_time with correct schema
CREATE OR REPLACE FUNCTION get_podium_all_time(
  p_club_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  current_rank INTEGER,
  courses_count INTEGER,
  division_slug TEXT,
  division_label TEXT,
  ring_color TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH all_time_counts AS (
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id)::INTEGER AS unique_courses
    FROM course_ratings cr
    JOIN course_top100_memberships ct ON ct.course_id = cr.course_id
    WHERE cr.user_id IS NOT NULL
    GROUP BY cr.user_id
  ),
  ranked AS (
    SELECT 
      atc.user_id,
      atc.unique_courses,
      ROW_NUMBER() OVER (ORDER BY atc.unique_courses DESC)::INTEGER AS rank
    FROM all_time_counts atc
  )
  SELECT 
    up.id AS user_id,
    up.username,
    up.display_name,
    up.avatar_url,
    r.rank AS current_rank,
    r.unique_courses AS courses_count,
    dc.division_id AS division_slug,
    dc.display_name AS division_label,
    dc.ring_color
  FROM ranked r
  JOIN user_profiles up ON up.id = r.user_id
  LEFT JOIN division_config dc ON dc.threshold <= r.unique_courses
  WHERE r.rank <= 3
    AND (
      p_club_id IS NULL 
      OR up.primary_club_id = p_club_id 
      OR EXISTS (
        SELECT 1 FROM user_home_clubs uhc 
        WHERE uhc.user_profile_id = up.id AND uhc.club_id = p_club_id
      )
    )
  ORDER BY r.rank ASC
  LIMIT 3;
END;
$$;

-- Recreate get_championship_leaderboard with correct schema
CREATE OR REPLACE FUNCTION get_championship_leaderboard(
  p_season_id TEXT,
  p_division TEXT DEFAULT NULL,
  p_club_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  current_rank INTEGER,
  courses_count INTEGER,
  division_slug TEXT,
  division_label TEXT,
  ring_color TEXT,
  rank_change INTEGER,
  is_current_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id AS user_id,
    up.username,
    up.display_name,
    up.avatar_url,
    uss.current_rank,
    uss.courses_logged AS courses_count,
    dc.division_id AS division_slug,
    dc.display_name AS division_label,
    dc.ring_color,
    0::INTEGER AS rank_change,
    (up.id = p_current_user_id) AS is_current_user
  FROM user_season_stats uss
  JOIN user_profiles up ON up.id = uss.user_id
  LEFT JOIN division_config dc ON dc.division_id = uss.current_division
  WHERE uss.season_id = p_season_id::uuid
    AND uss.current_rank IS NOT NULL
    AND (p_division IS NULL OR uss.current_division = p_division)
    AND (
      p_club_id IS NULL 
      OR up.primary_club_id = p_club_id 
      OR EXISTS (
        SELECT 1 FROM user_home_clubs uhc 
        WHERE uhc.user_profile_id = up.id AND uhc.club_id = p_club_id
      )
    )
  ORDER BY uss.current_rank ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Recreate get_championship_leaderboard_alltime with correct schema
CREATE OR REPLACE FUNCTION get_championship_leaderboard_alltime(
  p_division TEXT DEFAULT NULL,
  p_club_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  current_rank INTEGER,
  courses_count INTEGER,
  division_slug TEXT,
  division_label TEXT,
  ring_color TEXT,
  rank_change INTEGER,
  is_current_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH all_time_counts AS (
    SELECT 
      cr.user_id AS uid,
      COUNT(DISTINCT cr.course_id)::INTEGER AS unique_courses
    FROM course_ratings cr
    JOIN course_top100_memberships ct ON ct.course_id = cr.course_id
    WHERE cr.user_id IS NOT NULL
    GROUP BY cr.user_id
  ),
  with_division AS (
    SELECT 
      atc.uid,
      atc.unique_courses,
      (SELECT dc2.division_id FROM division_config dc2 WHERE dc2.threshold <= atc.unique_courses ORDER BY dc2.threshold DESC LIMIT 1) AS div_id
    FROM all_time_counts atc
  ),
  ranked AS (
    SELECT 
      wd.uid,
      wd.unique_courses,
      wd.div_id,
      ROW_NUMBER() OVER (ORDER BY wd.unique_courses DESC)::INTEGER AS rank
    FROM with_division wd
    WHERE (p_division IS NULL OR wd.div_id = p_division)
  )
  SELECT 
    up.id AS user_id,
    up.username,
    up.display_name,
    up.avatar_url,
    r.rank AS current_rank,
    r.unique_courses AS courses_count,
    dc.division_id AS division_slug,
    dc.display_name AS division_label,
    dc.ring_color,
    0::INTEGER AS rank_change,
    (up.id = p_current_user_id) AS is_current_user
  FROM ranked r
  JOIN user_profiles up ON up.id = r.uid
  LEFT JOIN division_config dc ON dc.division_id = r.div_id
  WHERE (
    p_club_id IS NULL 
    OR up.primary_club_id = p_club_id 
    OR EXISTS (
      SELECT 1 FROM user_home_clubs uhc 
      WHERE uhc.user_profile_id = up.id AND uhc.club_id = p_club_id
    )
  )
  ORDER BY r.rank ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_podium_seasonal(TEXT, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_podium_all_time(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_championship_leaderboard(TEXT, TEXT, UUID, INTEGER, INTEGER, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_championship_leaderboard_alltime(TEXT, UUID, INTEGER, INTEGER, UUID) TO authenticated, anon;