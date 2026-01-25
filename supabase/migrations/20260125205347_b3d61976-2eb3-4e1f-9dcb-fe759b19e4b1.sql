-- Create the get_exploration_leaderboard RPC
-- This replaces/extends get_countries_leaderboard with multi-metric support

CREATE OR REPLACE FUNCTION public.get_exploration_leaderboard(
  p_scope text DEFAULT 'global',
  p_metric text DEFAULT 'countries',
  p_club_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL
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
SET search_path TO 'public'
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
      CASE p_metric
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
      ELSE TRUE
    END
  ORDER BY ru.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Also create the search_golf_clubs RPC for club typeahead
CREATE OR REPLACE FUNCTION public.search_golf_clubs(
  p_query text,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name text,
  country text,
  region text,
  member_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gc.id,
    gc.name,
    gc.country,
    gc.region,
    COUNT(up.id) AS member_count
  FROM golf_clubs gc
  LEFT JOIN user_profiles up ON up.primary_club_id = gc.id
  WHERE gc.name ILIKE '%' || p_query || '%'
  GROUP BY gc.id, gc.name, gc.country, gc.region
  ORDER BY 
    COUNT(up.id) DESC,
    gc.name ASC
  LIMIT p_limit;
END;
$$;