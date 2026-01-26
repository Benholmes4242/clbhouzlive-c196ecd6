-- Phase 1: Geographic Filtering for All Leaderboard Tabs

-- 1.1 Create helper function to get available countries
CREATE OR REPLACE FUNCTION public.get_leaderboard_countries()
RETURNS TABLE (
  country_code text,
  country_name text,
  user_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gc.country AS country_code,
    gc.country AS country_name,
    COUNT(DISTINCT up.id) AS user_count
  FROM user_profiles up
  INNER JOIN golf_clubs gc ON gc.id = up.primary_club_id
  WHERE gc.country IS NOT NULL 
    AND gc.country != ''
  GROUP BY gc.country
  HAVING COUNT(DISTINCT up.id) > 0
  ORDER BY COUNT(DISTINCT up.id) DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard_countries() TO authenticated, anon;

-- 1.2 Update get_championship_leaderboard with p_country parameter
DROP FUNCTION IF EXISTS public.get_championship_leaderboard(text, integer, integer, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_championship_leaderboard(text, integer, integer, uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.get_championship_leaderboard(
  p_scope text DEFAULT 'global',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL,
  p_club_id uuid DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  profile_photo_url text,
  home_club text,
  courses_logged integer,
  rank bigint,
  rank_change_today integer,
  rank_change_week integer,
  division_id text,
  division_name text,
  division_ring_color text,
  zone_type text,
  streak_days integer,
  is_active_streak boolean,
  last_activity_at timestamptz,
  courses_to_next_division integer,
  is_friend boolean,
  is_rival boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id AS user_id,
    up.username,
    up.display_name,
    up.profile_photo_url,
    gc.name AS home_club,
    COALESCE(uss.courses_logged, 0)::integer AS courses_logged,
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(uss.courses_logged, 0) DESC, up.created_at ASC
    ) AS rank,
    0::integer AS rank_change_today,
    0::integer AS rank_change_week,
    uss.current_division AS division_id,
    dc.display_name AS division_name,
    dc.ring_color AS division_ring_color,
    NULL::text AS zone_type,
    COALESCE(uss.active_streak_days, 0)::integer AS streak_days,
    COALESCE(uss.active_streak_days, 0) > 0 AS is_active_streak,
    uss.last_activity_at,
    COALESCE(dc.threshold - uss.courses_logged, 0)::integer AS courses_to_next_division,
    CASE WHEN p_current_user_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM user_follows uf 
      WHERE uf.follower_id = p_current_user_id AND uf.following_id = up.id
    ) ELSE FALSE END AS is_friend,
    FALSE AS is_rival
  FROM user_profiles up
  LEFT JOIN user_season_stats uss ON uss.user_id = up.id
  LEFT JOIN division_config dc ON dc.division_id = uss.current_division
  LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
  WHERE 
    CASE 
      WHEN p_scope = 'country' AND p_country IS NOT NULL THEN 
        gc.country = p_country
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        up.id IN (
          SELECT uf.following_id FROM user_follows uf WHERE uf.follower_id = p_current_user_id
        ) OR up.id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN 
        up.primary_club_id = p_club_id OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc 
          WHERE uhc.user_profile_id = up.id AND uhc.club_id = p_club_id
        )
      WHEN p_scope = 'division' THEN TRUE
      ELSE TRUE
    END
    AND COALESCE(uss.courses_logged, 0) > 0
  ORDER BY courses_logged DESC, up.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_championship_leaderboard(text, integer, integer, uuid, uuid, text) TO authenticated, anon;

-- 1.3 Update get_championship_leaderboard_alltime with p_country parameter
DROP FUNCTION IF EXISTS public.get_championship_leaderboard_alltime(text, integer, integer, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_championship_leaderboard_alltime(text, integer, integer, uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.get_championship_leaderboard_alltime(
  p_scope text DEFAULT 'global',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL,
  p_club_id uuid DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  profile_photo_url text,
  home_club text,
  total_courses integer,
  rank bigint,
  is_friend boolean,
  is_rival boolean,
  current_division text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id AS user_id,
    up.username,
    up.display_name,
    up.profile_photo_url,
    gc.name AS home_club,
    (
      SELECT COUNT(DISTINCT cr.course_id)::integer
      FROM course_ratings cr
      JOIN course_top100_memberships ct ON ct.course_id = cr.course_id
      WHERE cr.user_id = up.id
    ) AS total_courses,
    ROW_NUMBER() OVER (
      ORDER BY (
        SELECT COUNT(DISTINCT cr.course_id)
        FROM course_ratings cr
        JOIN course_top100_memberships ct ON ct.course_id = cr.course_id
        WHERE cr.user_id = up.id
      ) DESC, up.created_at ASC
    ) AS rank,
    CASE WHEN p_current_user_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM user_follows uf 
      WHERE uf.follower_id = p_current_user_id AND uf.following_id = up.id
    ) ELSE FALSE END AS is_friend,
    FALSE AS is_rival,
    (
      SELECT dc.division_id FROM division_config dc
      WHERE (
        SELECT COUNT(DISTINCT cr.course_id)
        FROM course_ratings cr
        JOIN course_top100_memberships ct ON ct.course_id = cr.course_id
        WHERE cr.user_id = up.id
      ) >= dc.threshold
      ORDER BY dc.threshold DESC
      LIMIT 1
    ) AS current_division
  FROM user_profiles up
  LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
  WHERE 
    CASE 
      WHEN p_scope = 'country' AND p_country IS NOT NULL THEN 
        gc.country = p_country
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        up.id IN (
          SELECT uf.following_id FROM user_follows uf WHERE uf.follower_id = p_current_user_id
        ) OR up.id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN 
        up.primary_club_id = p_club_id OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc 
          WHERE uhc.user_profile_id = up.id AND uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
    AND EXISTS (
      SELECT 1 FROM course_ratings cr
      JOIN course_top100_memberships ct ON ct.course_id = cr.course_id
      WHERE cr.user_id = up.id
    )
  ORDER BY total_courses DESC, up.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_championship_leaderboard_alltime(text, integer, integer, uuid, uuid, text) TO authenticated, anon;

-- 1.4 Update get_podium_seasonal with p_country parameter
DROP FUNCTION IF EXISTS public.get_podium_seasonal(text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_podium_seasonal(text, text, uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.get_podium_seasonal(
  p_scope text DEFAULT 'global',
  p_division_id text DEFAULT NULL,
  p_current_user_id uuid DEFAULT NULL,
  p_club_id uuid DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  courses_count integer,
  rank bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id AS user_id,
    up.display_name,
    up.profile_photo_url AS avatar_url,
    COALESCE(uss.courses_logged, 0)::integer AS courses_count,
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(uss.courses_logged, 0) DESC, up.created_at ASC
    ) AS rank
  FROM user_profiles up
  LEFT JOIN user_season_stats uss ON uss.user_id = up.id
  LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
  WHERE 
    CASE 
      WHEN p_scope = 'country' AND p_country IS NOT NULL THEN 
        gc.country = p_country
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
        up.primary_club_id = p_club_id OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc 
          WHERE uhc.user_profile_id = up.id AND uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
    AND COALESCE(uss.courses_logged, 0) > 0
  ORDER BY courses_count DESC, up.created_at ASC
  LIMIT 3;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_podium_seasonal(text, text, uuid, uuid, text) TO authenticated, anon;

-- 1.5 Update get_podium_all_time with p_country parameter
DROP FUNCTION IF EXISTS public.get_podium_all_time(text, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_podium_all_time(text, uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.get_podium_all_time(
  p_scope text DEFAULT 'global',
  p_current_user_id uuid DEFAULT NULL,
  p_club_id uuid DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  courses_count integer,
  rank bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id AS user_id,
    up.display_name,
    up.profile_photo_url AS avatar_url,
    (
      SELECT COUNT(DISTINCT cr.course_id)::integer
      FROM course_ratings cr
      JOIN course_top100_memberships ct ON ct.course_id = cr.course_id
      WHERE cr.user_id = up.id
    ) AS courses_count,
    ROW_NUMBER() OVER (
      ORDER BY (
        SELECT COUNT(DISTINCT cr.course_id)
        FROM course_ratings cr
        JOIN course_top100_memberships ct ON ct.course_id = cr.course_id
        WHERE cr.user_id = up.id
      ) DESC, up.created_at ASC
    ) AS rank
  FROM user_profiles up
  LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
  WHERE 
    CASE 
      WHEN p_scope = 'country' AND p_country IS NOT NULL THEN 
        gc.country = p_country
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        up.id IN (
          SELECT uf.following_id 
          FROM user_follows uf 
          WHERE uf.follower_id = p_current_user_id
        ) OR up.id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN 
        up.primary_club_id = p_club_id OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc 
          WHERE uhc.user_profile_id = up.id AND uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
    AND EXISTS (
      SELECT 1 FROM course_ratings cr
      JOIN course_top100_memberships ct ON ct.course_id = cr.course_id
      WHERE cr.user_id = up.id
    )
  ORDER BY courses_count DESC, up.created_at ASC
  LIMIT 3;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_podium_all_time(text, uuid, uuid, text) TO authenticated, anon;

-- 1.6 Update get_exploration_leaderboard with p_country parameter
DROP FUNCTION IF EXISTS public.get_exploration_leaderboard(text, uuid, uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_exploration_leaderboard(text, uuid, uuid, integer, integer, text);

CREATE OR REPLACE FUNCTION public.get_exploration_leaderboard(
  p_scope text DEFAULT 'global',
  p_current_user_id uuid DEFAULT NULL,
  p_club_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_country text DEFAULT NULL
)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  countries_count integer,
  country_list text[],
  continents_count integer,
  continent_list text[],
  regions_count integer,
  region_list text[],
  courses_count integer,
  home_club text,
  home_club_id uuid,
  is_current_user boolean,
  is_friend boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_exploration AS (
    SELECT 
      cr.user_id,
      COUNT(DISTINCT gc.country) FILTER (WHERE gc.country IS NOT NULL) AS countries_count,
      ARRAY_AGG(DISTINCT gc.country) FILTER (WHERE gc.country IS NOT NULL) AS country_list,
      COUNT(DISTINCT gc.region) FILTER (WHERE gc.region IS NOT NULL) AS regions_count,
      ARRAY_AGG(DISTINCT gc.region) FILTER (WHERE gc.region IS NOT NULL) AS region_list,
      COUNT(DISTINCT cr.course_id) AS courses_count
    FROM course_ratings cr
    JOIN golf_courses gcs ON gcs.id = cr.course_id
    JOIN golf_clubs gc ON gc.id = gcs.club_id
    GROUP BY cr.user_id
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ue.countries_count DESC, ue.courses_count DESC, up.created_at ASC) AS rank,
    up.id AS user_id,
    up.username,
    up.display_name,
    up.profile_photo_url AS avatar_url,
    COALESCE(ue.countries_count, 0)::integer AS countries_count,
    COALESCE(ue.country_list, ARRAY[]::text[]) AS country_list,
    0::integer AS continents_count,
    ARRAY[]::text[] AS continent_list,
    COALESCE(ue.regions_count, 0)::integer AS regions_count,
    COALESCE(ue.region_list, ARRAY[]::text[]) AS region_list,
    COALESCE(ue.courses_count, 0)::integer AS courses_count,
    hc.name AS home_club,
    hc.id AS home_club_id,
    up.id = p_current_user_id AS is_current_user,
    CASE WHEN p_current_user_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM user_follows uf 
      WHERE uf.follower_id = p_current_user_id AND uf.following_id = up.id
    ) ELSE FALSE END AS is_friend
  FROM user_profiles up
  LEFT JOIN user_exploration ue ON ue.user_id = up.id
  LEFT JOIN golf_clubs hc ON hc.id = up.primary_club_id
  WHERE 
    CASE 
      WHEN p_scope = 'country' AND p_country IS NOT NULL THEN 
        hc.country = p_country
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        up.id IN (
          SELECT uf.following_id FROM user_follows uf WHERE uf.follower_id = p_current_user_id
        ) OR up.id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN 
        up.primary_club_id = p_club_id OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc 
          WHERE uhc.user_profile_id = up.id AND uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
    AND COALESCE(ue.countries_count, 0) > 0
  ORDER BY countries_count DESC, courses_count DESC, up.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_exploration_leaderboard(text, uuid, uuid, integer, integer, text) TO authenticated, anon;