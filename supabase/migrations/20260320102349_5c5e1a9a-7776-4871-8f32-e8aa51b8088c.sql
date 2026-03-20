
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS show_in_handicap_leaderboards BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_in_exploration_leaderboards BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN user_profiles.show_in_handicap_leaderboards
IS 'When false, user is excluded from all handicap-based leaderboards';
COMMENT ON COLUMN user_profiles.show_in_exploration_leaderboards
IS 'When false, user is excluded from courses played / exploration leaderboards';

-- Update get_lowest_handicap_leaderboard to filter by show_in_handicap_leaderboards
CREATE OR REPLACE FUNCTION public.get_lowest_handicap_leaderboard(
  p_scope text,
  p_current_user_id uuid DEFAULT NULL,
  p_club_id text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  handicap_index numeric,
  club_name text,
  country text,
  rank bigint,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      up.id AS user_id,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      up.eg_handicap_index AS handicap_index,
      gc.name AS club_name,
      gc.country,
      ROW_NUMBER() OVER (ORDER BY up.eg_handicap_index ASC) AS rank
    FROM user_profiles up
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE up.eg_handicap_index IS NOT NULL
      AND up.show_handicap = TRUE
      AND up.show_in_handicap_leaderboards = TRUE
      AND (
        p_scope = 'global' 
        OR (p_scope = 'club' AND up.primary_club_id = p_club_id)
        OR (p_scope = 'friends' AND p_current_user_id IS NOT NULL AND (
          up.id IN (SELECT uf.following_id FROM user_follows uf WHERE uf.follower_id = p_current_user_id)
          OR up.id = p_current_user_id
        ))
        OR (p_scope = 'country' AND gc.country = p_country)
      )
  )
  SELECT 
    r.user_id,
    r.display_name,
    r.avatar_url,
    r.handicap_index,
    r.club_name,
    r.country,
    r.rank,
    (r.user_id = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Update get_handicap_improvement_leaderboard
CREATE OR REPLACE FUNCTION public.get_handicap_improvement_leaderboard(
  p_scope text,
  p_current_user_id uuid DEFAULT NULL,
  p_club_id text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  user_id uuid,
  username text,
  display_name text,
  profile_photo_url text,
  current_handicap numeric,
  previous_handicap numeric,
  improvement numeric,
  primary_club_id uuid,
  club_name text,
  rank bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_improvements AS (
    SELECT
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url,
      up.eg_handicap_index AS current_handicap,
      (
        SELECT uhh.handicap_index
        FROM user_handicap_history uhh
        WHERE uhh.user_id = up.id
          AND uhh.recorded_at <= NOW() - INTERVAL '30 days'
        ORDER BY uhh.recorded_at DESC
        LIMIT 1
      ) AS previous_handicap,
      up.primary_club_id,
      gc.club_name
    FROM user_profiles up
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE up.eg_handicap_index IS NOT NULL
      AND up.show_handicap = TRUE
      AND up.show_in_handicap_leaderboards = TRUE
      AND (
        p_scope = 'global'
        OR (p_scope = 'clubs' AND (
          up.primary_club_id = p_club_id::UUID
          OR EXISTS (
            SELECT 1 FROM user_home_clubs uhc
            WHERE uhc.user_profile_id = up.id
              AND uhc.club_id = p_club_id::UUID
          )
        ))
        OR (p_scope = 'country' AND gc.country = p_country)
      )
  ),
  ranked AS (
    SELECT
      ui.user_id,
      ui.username,
      ui.display_name,
      ui.profile_photo_url,
      ui.current_handicap,
      ui.previous_handicap,
      (ui.previous_handicap - ui.current_handicap) AS improvement,
      ui.primary_club_id,
      ui.club_name,
      ROW_NUMBER() OVER (ORDER BY (ui.previous_handicap - ui.current_handicap) DESC NULLS LAST) AS rank
    FROM user_improvements ui
    WHERE ui.previous_handicap IS NOT NULL
      AND ui.previous_handicap > ui.current_handicap
  )
  SELECT * FROM ranked
  ORDER BY ranked.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Update get_season_improvement_leaderboard
CREATE OR REPLACE FUNCTION public.get_season_improvement_leaderboard(
  p_scope text,
  p_current_user_id uuid DEFAULT NULL,
  p_club_id text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  user_id uuid,
  username text,
  display_name text,
  profile_photo_url text,
  current_handicap numeric,
  season_start_handicap numeric,
  improvement numeric,
  primary_club_id uuid,
  club_name text,
  rank bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_improvements AS (
    SELECT
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url,
      up.eg_handicap_index AS current_handicap,
      ssh.season_start_handicap,
      up.primary_club_id,
      gc.club_name
    FROM user_profiles up
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    LEFT JOIN user_season_start_handicaps ssh ON ssh.user_id = up.id
    WHERE up.eg_handicap_index IS NOT NULL
      AND up.show_handicap = TRUE
      AND up.show_in_handicap_leaderboards = TRUE
      AND ssh.season_start_handicap IS NOT NULL
      AND (
        p_scope = 'global'
        OR (p_scope = 'clubs' AND (
          up.primary_club_id = p_club_id::UUID
          OR EXISTS (
            SELECT 1 FROM user_home_clubs uhc
            WHERE uhc.user_profile_id = up.id
              AND uhc.club_id = p_club_id::UUID
          )
        ))
        OR (p_scope = 'country' AND gc.country = p_country)
      )
  ),
  ranked AS (
    SELECT
      ui.user_id,
      ui.username,
      ui.display_name,
      ui.profile_photo_url,
      ui.current_handicap,
      ui.season_start_handicap,
      (ui.season_start_handicap - ui.current_handicap) AS improvement,
      ui.primary_club_id,
      ui.club_name,
      ROW_NUMBER() OVER (ORDER BY (ui.season_start_handicap - ui.current_handicap) DESC NULLS LAST) AS rank
    FROM user_improvements ui
    WHERE ui.season_start_handicap > ui.current_handicap
  )
  SELECT * FROM ranked
  ORDER BY ranked.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Update get_exploration_leaderboard
CREATE OR REPLACE FUNCTION public.get_exploration_leaderboard(
  p_scope text,
  p_metric text DEFAULT 'countries',
  p_current_user_id uuid DEFAULT NULL,
  p_club_id uuid DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
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
  courses_count bigint,
  home_club text,
  home_club_id uuid,
  is_friend boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_course_counts AS (
    SELECT cr.user_id, COUNT(*) AS total_courses
    FROM course_ratings cr
    GROUP BY cr.user_id
  ),
  friend_ids AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE p_current_user_id IS NOT NULL
      AND uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  ranked_users AS (
    SELECT 
      ues.user_id,
      up.username,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      ues.countries_played,
      ues.country_list,
      COALESCE(ues.continents_played, 0) AS continents_played,
      COALESCE(ues.continent_list, ARRAY[]::text[]) AS continent_list,
      COALESCE(ues.regions_completed, 0) AS regions_completed,
      COALESCE(ues.region_list, ARRAY[]::text[]) AS region_list,
      COALESCE(ucc.total_courses, 0) AS courses_count,
      gc.name AS home_club,
      gc.id AS home_club_id,
      up.primary_club_id,
      ROW_NUMBER() OVER (
        ORDER BY 
          CASE p_metric
            WHEN 'countries' THEN ues.countries_played
            WHEN 'continents' THEN COALESCE(ues.continents_played, 0)
            WHEN 'regions' THEN COALESCE(ues.regions_completed, 0)
            ELSE ues.countries_played
          END DESC,
          ues.updated_at ASC
      ) AS rank
    FROM user_exploration_stats ues
    JOIN user_profiles up ON up.id = ues.user_id
    LEFT JOIN user_course_counts ucc ON ucc.user_id = ues.user_id
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE 
      up.show_in_exploration_leaderboards = TRUE
      AND CASE p_metric
        WHEN 'countries' THEN ues.countries_played > 0
        WHEN 'continents' THEN COALESCE(ues.continents_played, 0) > 0
        WHEN 'regions' THEN COALESCE(ues.regions_completed, 0) > 0
        ELSE ues.countries_played > 0
      END
  )
  SELECT 
    ru.rank,
    ru.user_id,
    ru.username,
    ru.display_name,
    ru.avatar_url,
    ru.countries_played::integer AS countries_count,
    ru.country_list,
    ru.continents_played::integer AS continents_count,
    ru.continent_list,
    ru.regions_completed::integer AS regions_count,
    ru.region_list,
    ru.courses_count,
    ru.home_club,
    ru.home_club_id,
    (p_current_user_id IS NOT NULL AND ru.user_id IN (SELECT fi.friend_id FROM friend_ids fi)) AS is_friend
  FROM ranked_users ru
  WHERE 
    CASE 
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN
        ru.user_id IN (SELECT fi.friend_id FROM friend_ids fi) OR ru.user_id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN
        ru.primary_club_id = p_club_id
        OR ru.user_id IN (
          SELECT uhc.user_profile_id 
          FROM user_home_clubs uhc 
          WHERE uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
  ORDER BY ru.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Update get_countries_leaderboard
CREATE OR REPLACE FUNCTION public.get_countries_leaderboard(
  p_scope text DEFAULT 'global',
  p_current_user_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  countries_count integer,
  country_list text[],
  courses_count bigint,
  home_club text,
  rank bigint,
  is_friend boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_course_counts AS (
    SELECT cr.user_id, COUNT(*) AS total_courses
    FROM course_ratings cr
    GROUP BY cr.user_id
  ),
  ranked_users AS (
    SELECT 
      ues.user_id,
      up.display_name,
      up.username,
      up.profile_photo_url AS avatar_url,
      ues.countries_played AS countries_count,
      ues.country_list,
      COALESCE(ucc.total_courses, 0) AS courses_count,
      gc.name AS home_club,
      ROW_NUMBER() OVER (ORDER BY ues.countries_played DESC, ues.updated_at ASC) AS rank
    FROM user_exploration_stats ues
    JOIN user_profiles up ON up.id = ues.user_id
    LEFT JOIN user_course_counts ucc ON ucc.user_id = ues.user_id
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE ues.countries_played > 0
      AND up.show_in_exploration_leaderboards = TRUE
  ),
  friend_ids AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE p_current_user_id IS NOT NULL
      AND uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  )
  SELECT 
    ru.user_id,
    ru.display_name,
    ru.username,
    ru.avatar_url,
    ru.countries_count::integer,
    ru.country_list,
    ru.courses_count,
    ru.home_club,
    ru.rank,
    (p_current_user_id IS NOT NULL AND ru.user_id IN (SELECT fi.friend_id FROM friend_ids fi)) AS is_friend
  FROM ranked_users ru
  WHERE 
    CASE 
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN
        ru.user_id IN (SELECT fi.friend_id FROM friend_ids fi) OR ru.user_id = p_current_user_id
      ELSE TRUE
    END
  ORDER BY ru.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
