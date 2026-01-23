DROP FUNCTION IF EXISTS public.get_countries_leaderboard(text, integer, integer, uuid);

CREATE OR REPLACE FUNCTION public.get_countries_leaderboard(
  p_scope text DEFAULT 'global',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
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