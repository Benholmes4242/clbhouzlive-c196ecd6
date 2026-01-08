-- Drop existing function first (return type is changing)
DROP FUNCTION IF EXISTS public.get_top100_leaderboard(text, text, integer, integer, uuid);

-- Add primary_club_id to get_top100_leaderboard RPC for Nearby players feature
CREATE OR REPLACE FUNCTION public.get_top100_leaderboard(
  scope_param text DEFAULT 'worldwide',
  time_range_param text DEFAULT 'all_time',
  limit_param integer DEFAULT 100,
  offset_param integer DEFAULT 0,
  current_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  profile_photo_url text,
  home_club text,
  primary_club_id uuid,
  top100_courses_played bigint,
  global_rank bigint,
  regional_rank bigint,
  is_friend boolean,
  last_activity timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  list_slugs text[];
BEGIN
  -- Map scope to list slugs
  CASE scope_param
    WHEN 'worldwide' THEN list_slugs := ARRAY['global', 'gb-i', 'usa', 'europe'];
    WHEN 'gbi' THEN list_slugs := ARRAY['gb-i'];
    WHEN 'gb-i' THEN list_slugs := ARRAY['gb-i'];
    WHEN 'usa' THEN list_slugs := ARRAY['usa'];
    WHEN 'europe' THEN list_slugs := ARRAY['europe'];
    WHEN 'global' THEN list_slugs := ARRAY['global'];
    ELSE list_slugs := ARRAY['global', 'gb-i', 'usa', 'europe'];
  END CASE;

  RETURN QUERY
  WITH user_courses AS (
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id) as courses_played,
      MAX(cr.created_at) as last_activity
    FROM course_ratings cr
    INNER JOIN course_top100_memberships ctm ON cr.course_id = ctm.course_id
    INNER JOIN top100_lists t ON ctm.list_id = t.id
    WHERE t.slug = ANY(list_slugs)
      AND cr.rating IS NOT NULL
      AND cr.is_mock = false
      AND (
        time_range_param = 'all_time'
        OR (time_range_param = 'this_year' AND cr.created_at >= date_trunc('year', now()))
        OR (time_range_param = 'this_month' AND cr.created_at >= date_trunc('month', now()))
      )
    GROUP BY cr.user_id
    HAVING COUNT(DISTINCT cr.course_id) > 0
  ),
  ranked_users AS (
    SELECT 
      uc.user_id,
      uc.courses_played,
      uc.last_activity,
      ROW_NUMBER() OVER (ORDER BY uc.courses_played DESC, uc.last_activity DESC) as g_rank,
      ROW_NUMBER() OVER (ORDER BY uc.courses_played DESC, uc.last_activity DESC) as r_rank
    FROM user_courses uc
    INNER JOIN user_profiles up ON uc.user_id = up.id
    WHERE up.is_public = true
  )
  SELECT 
    ru.user_id,
    up.username::text,
    up.display_name::text,
    up.profile_photo_url::text,
    up.home_club::text,
    up.primary_club_id,
    ru.courses_played,
    ru.g_rank,
    ru.r_rank,
    CASE 
      WHEN current_user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM user_friends uf 
        WHERE uf.user_id = current_user_id 
          AND uf.friend_id = ru.user_id 
          AND uf.status = 'accepted'
      )
    END as is_friend,
    ru.last_activity
  FROM ranked_users ru
  INNER JOIN user_profiles up ON ru.user_id = up.id
  ORDER BY ru.g_rank
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_top100_leaderboard TO authenticated;

COMMENT ON FUNCTION get_top100_leaderboard IS 'Returns Top 100 leaderboard with primary_club_id for Nearby distance filtering';