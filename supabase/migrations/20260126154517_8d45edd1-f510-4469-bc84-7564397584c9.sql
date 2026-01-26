-- ============================================================================
-- Migration: Add p_club_id parameter to Championship Leaderboard RPCs
-- Description: Enables filtering championship leaderboards by golf club
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Update get_championship_leaderboard function (seasonal)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_championship_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_current_user_id UUID DEFAULT NULL,
  p_club_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  courses_logged INT,
  rank BIGINT,
  rank_change_today INT,
  rank_change_week INT,
  division_id TEXT,
  division_name TEXT,
  division_ring_color TEXT,
  zone_type TEXT,
  streak_days INT,
  is_active_streak BOOLEAN,
  courses_to_next_division INT,
  last_activity_at TIMESTAMPTZ,
  is_friend BOOLEAN,
  is_rival BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_courses AS (
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id) FILTER (
        WHERE EXISTS (SELECT 1 FROM course_top100_memberships t WHERE t.course_id = cr.course_id)
      ) as top100_count
    FROM course_ratings cr
    WHERE cr.review_date >= (
      SELECT start_date FROM championship_seasons WHERE status = 'active' LIMIT 1
    )
    GROUP BY cr.user_id
  ),
  ranked_users AS (
    SELECT
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url,
      gc.name AS home_club,
      COALESCE(uc.top100_count, 0)::INT AS courses_logged,
      ROW_NUMBER() OVER (
        ORDER BY COALESCE(uc.top100_count, 0) DESC, up.created_at ASC
      ) AS rank,
      COALESCE(uss.rank_change_daily, 0)::INT AS rank_change_today,
      COALESCE(uss.rank_change_weekly, 0)::INT AS rank_change_week,
      COALESCE(dc.slug, 'rookie') AS division_id,
      COALESCE(dc.name, 'Rookie') AS division_name,
      COALESCE(dc.color_hex, '#94a3b8') AS division_ring_color,
      CASE 
        WHEN uss.zone = 'promotion' THEN 'promotion'
        WHEN uss.zone = 'relegation' THEN 'relegation'
        ELSE 'safe'
      END AS zone_type,
      COALESCE(uss.current_streak, 0)::INT AS streak_days,
      COALESCE(uss.current_streak, 0) > 0 AS is_active_streak,
      COALESCE(uss.courses_to_next_division, 0)::INT AS courses_to_next_division,
      up.updated_at AS last_activity_at,
      EXISTS (
        SELECT 1 FROM user_follows uf 
        WHERE uf.follower_id = p_current_user_id AND uf.following_id = up.id
      ) AS is_friend,
      FALSE AS is_rival
    FROM user_profiles up
    LEFT JOIN user_courses uc ON uc.user_id = up.id
    LEFT JOIN user_season_stats uss ON uss.user_id = up.id
    LEFT JOIN division_config dc ON dc.id = uss.division_id
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE 
      COALESCE(uc.top100_count, 0) > 0
      AND (
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
      )
  )
  SELECT * FROM ranked_users
  ORDER BY rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 2. Update get_championship_leaderboard_alltime function
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_championship_leaderboard_alltime(
  p_scope TEXT DEFAULT 'global',
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_current_user_id UUID DEFAULT NULL,
  p_club_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  total_courses BIGINT,
  rank BIGINT,
  is_friend BOOLEAN,
  is_rival BOOLEAN,
  current_division TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH lifetime_courses AS (
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id) FILTER (
        WHERE EXISTS (SELECT 1 FROM course_top100_memberships t WHERE t.course_id = cr.course_id)
      ) as top100_count
    FROM course_ratings cr
    GROUP BY cr.user_id
  ),
  ranked_users AS (
    SELECT
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url,
      gc.name AS home_club,
      COALESCE(lc.top100_count, 0) AS total_courses,
      ROW_NUMBER() OVER (
        ORDER BY COALESCE(lc.top100_count, 0) DESC, up.created_at ASC
      ) AS rank,
      EXISTS (
        SELECT 1 FROM user_follows uf 
        WHERE uf.follower_id = p_current_user_id AND uf.following_id = up.id
      ) AS is_friend,
      FALSE AS is_rival,
      COALESCE(
        (SELECT dc.slug FROM division_config dc 
         WHERE dc.min_courses <= COALESCE(lc.top100_count, 0) 
         ORDER BY dc.min_courses DESC LIMIT 1),
        'rookie'
      ) AS current_division
    FROM user_profiles up
    LEFT JOIN lifetime_courses lc ON lc.user_id = up.id
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE 
      COALESCE(lc.top100_count, 0) > 0
      AND (
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
      )
  )
  SELECT * FROM ranked_users
  ORDER BY rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. Update get_podium_seasonal function
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_podium_seasonal(
  p_scope TEXT DEFAULT 'global',
  p_division_id TEXT DEFAULT NULL,
  p_current_user_id UUID DEFAULT NULL,
  p_club_id UUID DEFAULT NULL
)
RETURNS TABLE (
  podium_position INT,
  user_id UUID,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  narrative_text TEXT,
  courses_logged INT,
  division_id TEXT,
  division_name TEXT,
  streak_days INT,
  is_on_streak BOOLEAN,
  rank_change_today INT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_courses AS (
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id) FILTER (
        WHERE EXISTS (SELECT 1 FROM course_top100_memberships t WHERE t.course_id = cr.course_id)
      ) as top100_count
    FROM course_ratings cr
    WHERE cr.review_date >= (
      SELECT start_date FROM championship_seasons WHERE status = 'active' LIMIT 1
    )
    GROUP BY cr.user_id
  ),
  ranked_users AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY COALESCE(uc.top100_count, 0) DESC, up.created_at ASC)::INT AS podium_position,
      up.id AS user_id,
      up.display_name,
      up.username,
      up.profile_photo_url AS avatar_url,
      NULL::TEXT AS narrative_text,
      COALESCE(uc.top100_count, 0)::INT AS courses_logged,
      COALESCE(dc.slug, 'rookie') AS division_id,
      COALESCE(dc.name, 'Rookie') AS division_name,
      COALESCE(uss.current_streak, 0)::INT AS streak_days,
      COALESCE(uss.current_streak, 0) > 0 AS is_on_streak,
      COALESCE(uss.rank_change_daily, 0)::INT AS rank_change_today
    FROM user_profiles up
    LEFT JOIN user_courses uc ON uc.user_id = up.id
    LEFT JOIN user_season_stats uss ON uss.user_id = up.id
    LEFT JOIN division_config dc ON dc.id = uss.division_id
    WHERE 
      COALESCE(uc.top100_count, 0) > 0
      AND (
        CASE 
          WHEN p_scope = 'global' THEN TRUE
          WHEN p_scope = 'division' AND p_division_id IS NOT NULL THEN dc.slug = p_division_id
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
      )
  )
  SELECT * FROM ranked_users
  WHERE podium_position <= 3
  ORDER BY podium_position;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 4. Update get_podium_all_time function
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_podium_all_time(
  p_scope TEXT DEFAULT 'global',
  p_current_user_id UUID DEFAULT NULL,
  p_club_id UUID DEFAULT NULL
)
RETURNS TABLE (
  podium_position INT,
  user_id UUID,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  narrative_text TEXT,
  all_time_courses BIGINT,
  seasons_won INT,
  podium_finishes INT
) AS $$
BEGIN
  RETURN QUERY
  WITH lifetime_courses AS (
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id) FILTER (
        WHERE EXISTS (SELECT 1 FROM course_top100_memberships t WHERE t.course_id = cr.course_id)
      ) as top100_count
    FROM course_ratings cr
    GROUP BY cr.user_id
  ),
  ranked_users AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY COALESCE(lc.top100_count, 0) DESC, up.created_at ASC)::INT AS podium_position,
      up.id AS user_id,
      up.display_name,
      up.username,
      up.profile_photo_url AS avatar_url,
      NULL::TEXT AS narrative_text,
      COALESCE(lc.top100_count, 0) AS all_time_courses,
      0::INT AS seasons_won,
      0::INT AS podium_finishes
    FROM user_profiles up
    LEFT JOIN lifetime_courses lc ON lc.user_id = up.id
    WHERE 
      COALESCE(lc.top100_count, 0) > 0
      AND (
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
      )
  )
  SELECT * FROM ranked_users
  WHERE podium_position <= 3
  ORDER BY podium_position;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 5. Create index for performance (if not exists)
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_user_profiles_primary_club_id 
ON user_profiles(primary_club_id) 
WHERE primary_club_id IS NOT NULL;