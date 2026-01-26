-- ============================================================================
-- Migration: Add secondary club membership support to Championship RPCs
-- Description: Include users who have the club in user_home_clubs (not just primary)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Drop existing podium functions to allow return type changes
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS get_podium_seasonal(TEXT, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS get_podium_all_time(TEXT, UUID, UUID);

-- ----------------------------------------------------------------------------
-- 2. Recreate get_podium_seasonal with secondary memberships
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_podium_seasonal(
  p_scope TEXT DEFAULT 'global',
  p_division_id UUID DEFAULT NULL,
  p_current_user_id UUID DEFAULT NULL,
  p_club_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  courses_count INT,
  rank INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id AS user_id,
    up.display_name,
    up.profile_photo_url AS avatar_url,
    COALESCE(uss.top100_courses_this_season, 0)::INT AS courses_count,
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(uss.top100_courses_this_season, 0) DESC, up.created_at ASC
    )::INT AS rank
  FROM user_profiles up
  LEFT JOIN user_season_stats uss ON uss.user_id = up.id
  WHERE 
    CASE 
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'division' AND p_division_id IS NOT NULL THEN uss.current_division_id = p_division_id
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
    AND COALESCE(uss.top100_courses_this_season, 0) > 0
  ORDER BY courses_count DESC, up.created_at ASC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql STABLE;

-- ----------------------------------------------------------------------------
-- 3. Recreate get_podium_all_time with secondary memberships
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_podium_all_time(
  p_scope TEXT DEFAULT 'global',
  p_current_user_id UUID DEFAULT NULL,
  p_club_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  courses_count INT,
  rank INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id AS user_id,
    up.display_name,
    up.profile_photo_url AS avatar_url,
    COALESCE(uss.top100_courses_all_time, 0)::INT AS courses_count,
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(uss.top100_courses_all_time, 0) DESC, up.created_at ASC
    )::INT AS rank
  FROM user_profiles up
  LEFT JOIN user_season_stats uss ON uss.user_id = up.id
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
    AND COALESCE(uss.top100_courses_all_time, 0) > 0
  ORDER BY courses_count DESC, up.created_at ASC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql STABLE;