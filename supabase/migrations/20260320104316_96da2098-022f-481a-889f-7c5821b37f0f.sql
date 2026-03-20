-- Add show_in_exploration_leaderboards filter to get_podium_all_time
CREATE OR REPLACE FUNCTION public.get_podium_all_time(
  p_scope text,
  p_country text DEFAULT NULL,
  p_current_user_id uuid DEFAULT NULL,
  p_club_id uuid DEFAULT NULL
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  courses_count integer,
  rank bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
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
    up.show_in_exploration_leaderboards = TRUE
    AND CASE 
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

-- Add show_in_exploration_leaderboards filter to get_podium_seasonal
CREATE OR REPLACE FUNCTION public.get_podium_seasonal(
  p_scope text,
  p_country text DEFAULT NULL,
  p_current_user_id uuid DEFAULT NULL,
  p_club_id uuid DEFAULT NULL,
  p_division_id uuid DEFAULT NULL
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  courses_count integer,
  rank bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
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
    up.show_in_exploration_leaderboards = TRUE
    AND CASE 
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

-- Add show_in_exploration_leaderboards filter to get_user_podium_proximity
CREATE OR REPLACE FUNCTION public.get_user_podium_proximity(
  p_user_id uuid,
  p_scope text DEFAULT 'global',
  p_time_filter text DEFAULT 'season',
  p_division_id uuid DEFAULT NULL
)
RETURNS TABLE(
  user_position integer,
  third_place_courses integer,
  courses_to_podium integer,
  is_on_podium boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_user_courses INTEGER;
  v_third_courses INTEGER;
  v_user_rank INTEGER;
  v_season_id UUID;
BEGIN
  SELECT id INTO v_season_id
  FROM championship_seasons
  WHERE status = 'active'
  LIMIT 1;

  IF p_time_filter = 'season' THEN
    SELECT uss.courses_logged INTO v_user_courses
    FROM user_season_stats uss
    WHERE uss.season_id = v_season_id
      AND uss.user_id = p_user_id;
    
    SELECT courses_logged INTO v_third_courses
    FROM (
      SELECT uss.courses_logged, ROW_NUMBER() OVER (ORDER BY uss.courses_logged DESC) as pos
      FROM user_season_stats uss
      JOIN user_profiles up ON up.id = uss.user_id
      WHERE uss.season_id = v_season_id
        AND up.show_in_exploration_leaderboards = TRUE
        AND (p_scope = 'global' OR (p_scope = 'division' AND uss.current_division = p_division_id))
    ) sub
    WHERE pos = 3;
    
    SELECT COUNT(*) + 1 INTO v_user_rank
    FROM user_season_stats uss
    JOIN user_profiles up ON up.id = uss.user_id
    WHERE uss.season_id = v_season_id
      AND up.show_in_exploration_leaderboards = TRUE
      AND uss.courses_logged > COALESCE(v_user_courses, 0);
  ELSE
    SELECT all_time_courses_logged INTO v_user_courses
    FROM user_hall_of_fame
    WHERE user_hall_of_fame.user_id = p_user_id;
    
    SELECT all_time_courses_logged INTO v_third_courses
    FROM (
      SELECT uhof.all_time_courses_logged, ROW_NUMBER() OVER (ORDER BY uhof.all_time_courses_logged DESC) as pos
      FROM user_hall_of_fame uhof
      JOIN user_profiles up ON up.id = uhof.user_id
      WHERE up.show_in_exploration_leaderboards = TRUE
    ) sub
    WHERE pos = 3;
    
    SELECT COUNT(*) + 1 INTO v_user_rank
    FROM user_hall_of_fame uhof
    JOIN user_profiles up ON up.id = uhof.user_id
    WHERE up.show_in_exploration_leaderboards = TRUE
      AND uhof.all_time_courses_logged > COALESCE(v_user_courses, 0);
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(v_user_rank, 999)::INTEGER as user_position,
    COALESCE(v_third_courses, 0)::INTEGER as third_place_courses,
    GREATEST(0, COALESCE(v_third_courses, 0) - COALESCE(v_user_courses, 0) + 1)::INTEGER as courses_to_podium,
    (COALESCE(v_user_rank, 999) <= 3)::BOOLEAN as is_on_podium;
END;
$$;