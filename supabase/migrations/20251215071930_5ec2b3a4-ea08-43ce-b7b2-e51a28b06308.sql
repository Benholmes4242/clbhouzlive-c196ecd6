-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_top100_leaderboard(TEXT, TEXT, INT, INT, UUID);

-- Recreate the get_top100_leaderboard function to use course_top100_memberships instead of is_top100 column
CREATE OR REPLACE FUNCTION public.get_top100_leaderboard(
  scope_param TEXT DEFAULT 'worldwide',
  time_range_param TEXT DEFAULT 'all_time',
  limit_param INT DEFAULT 100,
  offset_param INT DEFAULT 0,
  current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  top100_courses_played BIGINT,
  global_rank BIGINT,
  regional_rank BIGINT,
  is_friend BOOLEAN,
  last_activity_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  WITH user_top100_counts AS (
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id) as courses_played,
      MAX(cr.created_at) as last_activity
    FROM course_ratings cr
    INNER JOIN course_top100_memberships ctm ON cr.course_id = ctm.course_id
    INNER JOIN top100_lists t100 ON ctm.list_id = t100.id
    WHERE cr.is_mock = false
      AND cr.rating IS NOT NULL
      AND (
        scope_param = 'worldwide' 
        OR (scope_param = 'gbi' AND t100.slug = 'gbi')
        OR (scope_param = 'usa' AND t100.slug = 'usa')
        OR (scope_param = 'europe' AND t100.slug = 'europe')
      )
      AND (
        time_range_param = 'all_time'
        OR (time_range_param = 'this_year' AND cr.created_at >= date_trunc('year', CURRENT_DATE))
        OR (time_range_param = 'last_30_days' AND cr.created_at >= CURRENT_DATE - INTERVAL '30 days')
      )
    GROUP BY cr.user_id
    HAVING COUNT(DISTINCT cr.course_id) > 0
  ),
  ranked_users AS (
    SELECT 
      utc.user_id,
      utc.courses_played,
      utc.last_activity,
      ROW_NUMBER() OVER (ORDER BY utc.courses_played DESC, utc.last_activity DESC) as global_rank,
      ROW_NUMBER() OVER (ORDER BY utc.courses_played DESC, utc.last_activity DESC) as regional_rank
    FROM user_top100_counts utc
  )
  SELECT 
    ru.user_id,
    up.username,
    up.display_name,
    up.profile_photo_url,
    up.home_club,
    ru.courses_played as top100_courses_played,
    ru.global_rank,
    ru.regional_rank,
    CASE 
      WHEN current_user_id IS NOT NULL THEN EXISTS (
        SELECT 1 FROM user_friends uf 
        WHERE uf.status = 'accepted' 
        AND ((uf.user_id = current_user_id AND uf.friend_id = ru.user_id)
          OR (uf.friend_id = current_user_id AND uf.user_id = ru.user_id))
      )
      ELSE false
    END as is_friend,
    ru.last_activity as last_activity_at
  FROM ranked_users ru
  INNER JOIN user_profiles up ON ru.user_id = up.id
  WHERE up.is_public = true
  ORDER BY ru.global_rank ASC
  LIMIT limit_param
  OFFSET offset_param;
$$;