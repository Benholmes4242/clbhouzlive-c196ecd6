-- First drop the existing function, then recreate with new signature
DROP FUNCTION IF EXISTS public.get_championship_leaderboard_alltime(text, integer, integer, uuid);

-- Now create with the updated return type including current_division
CREATE FUNCTION public.get_championship_leaderboard_alltime(
  p_scope text DEFAULT 'global',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  profile_photo_url text,
  home_club text,
  total_courses bigint,
  rank bigint,
  is_friend boolean,
  is_rival boolean,
  current_division text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH course_counts AS (
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id) as total_courses
    FROM course_ratings cr
    WHERE cr.user_id IS NOT NULL
    GROUP BY cr.user_id
    HAVING COUNT(DISTINCT cr.course_id) > 0
  ),
  ranked_users AS (
    SELECT 
      cc.user_id,
      cc.total_courses,
      ROW_NUMBER() OVER (ORDER BY cc.total_courses DESC, cc.user_id) as rank
    FROM course_counts cc
  ),
  friend_ids AS (
    SELECT friend_id
    FROM user_friends
    WHERE user_id = p_current_user_id AND status = 'accepted'
  ),
  rival_ids AS (
    SELECT rival_id
    FROM user_rivals
    WHERE user_id = p_current_user_id AND is_active = true
  )
  SELECT 
    ru.user_id,
    up.username,
    up.display_name,
    up.profile_photo_url,
    up.home_club,
    ru.total_courses,
    ru.rank,
    EXISTS (SELECT 1 FROM friend_ids fi WHERE fi.friend_id = ru.user_id) as is_friend,
    EXISTS (SELECT 1 FROM rival_ids ri WHERE ri.rival_id = ru.user_id) as is_rival,
    COALESCE(
      (SELECT dc.division_id 
       FROM division_config dc 
       WHERE dc.threshold <= ru.total_courses 
       ORDER BY dc.threshold DESC 
       LIMIT 1),
      'rookie'
    )::text as current_division
  FROM ranked_users ru
  JOIN user_profiles up ON up.id = ru.user_id
  WHERE 
    CASE 
      WHEN p_scope = 'friends' THEN 
        ru.user_id = p_current_user_id 
        OR EXISTS (SELECT 1 FROM friend_ids fi WHERE fi.friend_id = ru.user_id)
      ELSE true
    END
  ORDER BY ru.rank
  LIMIT p_limit
  OFFSET p_offset;
$$;