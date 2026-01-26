-- Drop existing function first
DROP FUNCTION IF EXISTS get_exploration_leaderboard(text, text, uuid, integer, integer, uuid);

-- Recreate with fix for secondary clubs
CREATE OR REPLACE FUNCTION public.get_exploration_leaderboard(
  p_scope text DEFAULT 'global'::text, 
  p_metric text DEFAULT 'countries'::text, 
  p_club_id uuid DEFAULT NULL::uuid, 
  p_limit integer DEFAULT 100, 
  p_offset integer DEFAULT 0, 
  p_current_user_id uuid DEFAULT NULL::uuid
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
AS $function$
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
        -- FIX: Include users with this as PRIMARY club OR in their "Also plays at" list
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
$function$;

-- Fix 2: Update search_golf_clubs to count secondary members
DROP FUNCTION IF EXISTS search_golf_clubs(text, integer);

CREATE OR REPLACE FUNCTION search_golf_clubs(
  p_query text,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  country text,
  region text,
  member_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gc.id,
    gc.name,
    gc.country,
    gc.region,
    (
      -- Count users with this as primary club
      (SELECT COUNT(*) FROM user_profiles up WHERE up.primary_club_id = gc.id)
      +
      -- Count users with this in "Also plays at"
      (SELECT COUNT(*) FROM user_home_clubs uhc WHERE uhc.club_id = gc.id)
    ) as member_count
  FROM golf_clubs gc
  WHERE gc.name ILIKE '%' || p_query || '%'
  ORDER BY 
    -- Prefer exact/starts-with matches
    CASE WHEN gc.name ILIKE p_query || '%' THEN 0 ELSE 1 END,
    -- Then by member count
    (
      (SELECT COUNT(*) FROM user_profiles up WHERE up.primary_club_id = gc.id)
      + (SELECT COUNT(*) FROM user_home_clubs uhc WHERE uhc.club_id = gc.id)
    ) DESC,
    gc.name
  LIMIT p_limit;
END;
$$;