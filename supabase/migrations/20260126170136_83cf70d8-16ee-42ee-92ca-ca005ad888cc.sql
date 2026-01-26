-- ============================================================================
-- STEP 1: DROP ALL EXISTING FUNCTION VERSIONS (EXACT SIGNATURES FROM DB)
-- ============================================================================

-- get_podium_seasonal versions
DROP FUNCTION IF EXISTS public.get_podium_seasonal(text, text, uuid);
DROP FUNCTION IF EXISTS public.get_podium_seasonal(text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_podium_seasonal(text, uuid, uuid, uuid);

-- get_podium_all_time versions
DROP FUNCTION IF EXISTS public.get_podium_all_time(text, uuid);
DROP FUNCTION IF EXISTS public.get_podium_all_time(text, uuid, uuid);

-- get_championship_leaderboard versions
DROP FUNCTION IF EXISTS public.get_championship_leaderboard(text, integer, integer, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_championship_leaderboard(uuid, text, text, uuid, integer, integer);

-- get_championship_leaderboard_alltime versions
DROP FUNCTION IF EXISTS public.get_championship_leaderboard_alltime(text, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_championship_leaderboard_alltime(text, integer, integer, uuid, uuid);

-- ============================================================================
-- STEP 2: RECREATE get_podium_seasonal WITH CLUB SUPPORT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_podium_seasonal(
  p_scope TEXT DEFAULT 'global',
  p_division_id TEXT DEFAULT NULL,
  p_current_user_id UUID DEFAULT NULL,
  p_club_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  division_slug TEXT,
  division_label TEXT,
  ring_color TEXT,
  courses_count INT,
  rank INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id AS user_id,
    up.display_name,
    up.profile_photo_url AS avatar_url,
    uss.current_division AS division_slug,
    dc.label AS division_label,
    dc.ring_color,
    COALESCE(uss.courses_logged, 0)::INT AS courses_count,
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(uss.courses_logged, 0) DESC, up.created_at ASC
    )::INT AS rank
  FROM user_profiles up
  LEFT JOIN user_season_stats uss ON uss.user_id = up.id
  LEFT JOIN division_config dc ON dc.slug = uss.current_division
  WHERE 
    CASE 
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'division' AND p_division_id IS NOT NULL THEN 
        uss.current_division = p_division_id
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        up.id IN (
          SELECT uf.following_id 
          FROM user_follows uf 
          WHERE uf.follower_id = p_current_user_id
        ) OR up.id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN 
        up.primary_club_id = p_club_id
        OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc
          WHERE uhc.user_id = up.id AND uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
    AND COALESCE(uss.courses_logged, 0) > 0
  ORDER BY courses_count DESC, up.created_at ASC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 3: RECREATE get_podium_all_time WITH CLUB SUPPORT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_podium_all_time(
  p_scope TEXT DEFAULT 'global',
  p_current_user_id UUID DEFAULT NULL,
  p_club_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  division_slug TEXT,
  division_label TEXT,
  ring_color TEXT,
  courses_count INT,
  rank INT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_all_time_counts AS (
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id)::INT AS total_courses
    FROM course_ratings cr
    INNER JOIN course_top100_memberships ctm ON ctm.course_id = cr.course_id
    WHERE cr.user_id IS NOT NULL
    GROUP BY cr.user_id
  )
  SELECT
    up.id AS user_id,
    up.display_name,
    up.profile_photo_url AS avatar_url,
    dc.slug AS division_slug,
    dc.label AS division_label,
    dc.ring_color,
    COALESCE(uatc.total_courses, 0)::INT AS courses_count,
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(uatc.total_courses, 0) DESC, up.created_at ASC
    )::INT AS rank
  FROM user_profiles up
  LEFT JOIN user_all_time_counts uatc ON uatc.user_id = up.id
  LEFT JOIN division_config dc ON dc.min_courses <= COALESCE(uatc.total_courses, 0)
    AND (dc.max_courses IS NULL OR dc.max_courses >= COALESCE(uatc.total_courses, 0))
  WHERE 
    CASE 
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        up.id IN (
          SELECT uf.following_id 
          FROM user_follows uf 
          WHERE uf.follower_id = p_current_user_id
        ) OR up.id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN 
        up.primary_club_id = p_club_id
        OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc
          WHERE uhc.user_id = up.id AND uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
    AND COALESCE(uatc.total_courses, 0) > 0
  ORDER BY courses_count DESC, up.created_at ASC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 4: RECREATE get_championship_leaderboard WITH CLUB SUPPORT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_championship_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_division_id TEXT DEFAULT NULL,
  p_current_user_id UUID DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'courses',
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_club_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  division_slug TEXT,
  division_label TEXT,
  ring_color TEXT,
  courses_count INT,
  streak_days INT,
  rank INT,
  total_count BIGINT
) AS $$
DECLARE
  v_total BIGINT;
BEGIN
  SELECT COUNT(DISTINCT up.id) INTO v_total
  FROM user_profiles up
  LEFT JOIN user_season_stats uss ON uss.user_id = up.id
  WHERE 
    CASE 
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'division' AND p_division_id IS NOT NULL THEN 
        uss.current_division = p_division_id
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        up.id IN (
          SELECT uf.following_id 
          FROM user_follows uf 
          WHERE uf.follower_id = p_current_user_id
        ) OR up.id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN 
        up.primary_club_id = p_club_id
        OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc
          WHERE uhc.user_id = up.id AND uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
    AND COALESCE(uss.courses_logged, 0) > 0
    AND (p_search_query IS NULL OR up.display_name ILIKE '%' || p_search_query || '%');

  RETURN QUERY
  SELECT
    up.id AS user_id,
    up.display_name,
    up.profile_photo_url AS avatar_url,
    uss.current_division AS division_slug,
    dc.label AS division_label,
    dc.ring_color,
    COALESCE(uss.courses_logged, 0)::INT AS courses_count,
    COALESCE(uss.active_streak_days, 0)::INT AS streak_days,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE WHEN p_sort_by = 'streak' THEN COALESCE(uss.active_streak_days, 0) ELSE 0 END DESC,
        COALESCE(uss.courses_logged, 0) DESC,
        up.created_at ASC
    )::INT AS rank,
    v_total AS total_count
  FROM user_profiles up
  LEFT JOIN user_season_stats uss ON uss.user_id = up.id
  LEFT JOIN division_config dc ON dc.slug = uss.current_division
  WHERE 
    CASE 
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'division' AND p_division_id IS NOT NULL THEN 
        uss.current_division = p_division_id
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        up.id IN (
          SELECT uf.following_id 
          FROM user_follows uf 
          WHERE uf.follower_id = p_current_user_id
        ) OR up.id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN 
        up.primary_club_id = p_club_id
        OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc
          WHERE uhc.user_id = up.id AND uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
    AND COALESCE(uss.courses_logged, 0) > 0
    AND (p_search_query IS NULL OR up.display_name ILIKE '%' || p_search_query || '%')
  ORDER BY 
    CASE WHEN p_sort_by = 'streak' THEN COALESCE(uss.active_streak_days, 0) ELSE 0 END DESC,
    COALESCE(uss.courses_logged, 0) DESC,
    up.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 5: RECREATE get_championship_leaderboard_alltime WITH CLUB SUPPORT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_championship_leaderboard_alltime(
  p_scope TEXT DEFAULT 'global',
  p_division_id TEXT DEFAULT NULL,
  p_current_user_id UUID DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_club_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  division_slug TEXT,
  division_label TEXT,
  ring_color TEXT,
  courses_count INT,
  rank INT,
  total_count BIGINT
) AS $$
DECLARE
  v_total BIGINT;
BEGIN
  WITH user_all_time_counts AS (
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id)::INT AS total_courses
    FROM course_ratings cr
    INNER JOIN course_top100_memberships ctm ON ctm.course_id = cr.course_id
    WHERE cr.user_id IS NOT NULL
    GROUP BY cr.user_id
  )
  SELECT COUNT(DISTINCT up.id) INTO v_total
  FROM user_profiles up
  LEFT JOIN user_all_time_counts uatc ON uatc.user_id = up.id
  LEFT JOIN division_config dc ON dc.min_courses <= COALESCE(uatc.total_courses, 0)
    AND (dc.max_courses IS NULL OR dc.max_courses >= COALESCE(uatc.total_courses, 0))
  WHERE 
    CASE 
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'division' AND p_division_id IS NOT NULL THEN 
        dc.slug = p_division_id
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        up.id IN (
          SELECT uf.following_id 
          FROM user_follows uf 
          WHERE uf.follower_id = p_current_user_id
        ) OR up.id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN 
        up.primary_club_id = p_club_id
        OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc
          WHERE uhc.user_id = up.id AND uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
    AND COALESCE(uatc.total_courses, 0) > 0
    AND (p_search_query IS NULL OR up.display_name ILIKE '%' || p_search_query || '%');

  RETURN QUERY
  WITH user_all_time_counts AS (
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id)::INT AS total_courses
    FROM course_ratings cr
    INNER JOIN course_top100_memberships ctm ON ctm.course_id = cr.course_id
    WHERE cr.user_id IS NOT NULL
    GROUP BY cr.user_id
  )
  SELECT
    up.id AS user_id,
    up.display_name,
    up.profile_photo_url AS avatar_url,
    dc.slug AS division_slug,
    dc.label AS division_label,
    dc.ring_color,
    COALESCE(uatc.total_courses, 0)::INT AS courses_count,
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(uatc.total_courses, 0) DESC, up.created_at ASC
    )::INT AS rank,
    v_total AS total_count
  FROM user_profiles up
  LEFT JOIN user_all_time_counts uatc ON uatc.user_id = up.id
  LEFT JOIN division_config dc ON dc.min_courses <= COALESCE(uatc.total_courses, 0)
    AND (dc.max_courses IS NULL OR dc.max_courses >= COALESCE(uatc.total_courses, 0))
  WHERE 
    CASE 
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'division' AND p_division_id IS NOT NULL THEN 
        dc.slug = p_division_id
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        up.id IN (
          SELECT uf.following_id 
          FROM user_follows uf 
          WHERE uf.follower_id = p_current_user_id
        ) OR up.id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN 
        up.primary_club_id = p_club_id
        OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc
          WHERE uhc.user_id = up.id AND uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
    AND COALESCE(uatc.total_courses, 0) > 0
    AND (p_search_query IS NULL OR up.display_name ILIKE '%' || p_search_query || '%')
  ORDER BY COALESCE(uatc.total_courses, 0) DESC, up.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 6: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_podium_seasonal(text, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_podium_seasonal(text, text, uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_podium_all_time(text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_podium_all_time(text, uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_championship_leaderboard(text, text, uuid, text, text, integer, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_championship_leaderboard(text, text, uuid, text, text, integer, integer, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_championship_leaderboard_alltime(text, text, uuid, text, integer, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_championship_leaderboard_alltime(text, text, uuid, text, integer, integer, uuid) TO anon;