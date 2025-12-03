-- Drop and recreate the function with new return columns
DROP FUNCTION IF EXISTS get_top100_course_leaderboard(text, text, integer, integer);

CREATE OR REPLACE FUNCTION get_top100_course_leaderboard(
  scope_param text,
  time_range_param text,
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0
)
RETURNS TABLE (
  course_id uuid,
  course_name text,
  country text,
  sub_country text,
  thumbnail_url text,
  list_slug text,
  times_played bigint,
  avg_rating numeric,
  global_rank integer,
  regional_rank integer,
  usa_rank integer,
  friends_count bigint,
  friends_avg_rating numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user for friends lookup
  current_user_id := auth.uid();

  RETURN QUERY
  WITH course_stats AS (
    SELECT 
      gc.id,
      gc.name,
      gc.country,
      gc.sub_country,
      gc.thumbnail_image,
      gc.global_rank,
      gc.regional_rank,
      gc.usa_rank,
      COALESCE(l.slug, 'global') as list_slug,
      COUNT(DISTINCT cr.user_id) as times_played,
      ROUND(AVG(cr.rating)::numeric, 1) as avg_rating,
      -- Friends stats: count friends who rated this course
      COUNT(DISTINCT CASE 
        WHEN current_user_id IS NOT NULL AND uf.follower_id = current_user_id
        THEN cr.user_id
        ELSE NULL
      END) AS friends_count,
      -- Friends average rating
      ROUND(AVG(
        CASE 
          WHEN current_user_id IS NOT NULL AND uf.follower_id = current_user_id
          THEN cr.rating
          ELSE NULL
        END
      )::numeric, 1) AS friends_avg_rating
    FROM golf_courses gc
    LEFT JOIN course_top100_memberships m ON m.course_id = gc.id
    LEFT JOIN top100_lists l ON l.id = m.list_id
    LEFT JOIN course_ratings cr ON cr.course_id = gc.id
      AND (
        time_range_param = 'all_time' 
        OR (time_range_param = 'this_year' AND cr.created_at >= date_trunc('year', now()))
        OR (time_range_param = 'this_month' AND cr.created_at >= date_trunc('month', now()))
        OR (time_range_param = 'this_week' AND cr.created_at >= date_trunc('week', now()))
      )
    -- Join to user_follows to find friends (people the user follows)
    LEFT JOIN user_follows uf ON uf.following_id = cr.user_id 
      AND uf.follower_id = current_user_id
    WHERE 
      m.id IS NOT NULL
      AND (
        scope_param = 'worldwide'
        OR (scope_param = 'global-top-100' AND l.slug = 'global')
        OR (scope_param = 'gb-i-top-100' AND l.slug = 'gb-i')
        OR (scope_param = 'usa-top-100' AND l.slug = 'usa')
        OR (scope_param = 'europe-top-100' AND l.slug = 'europe')
      )
    GROUP BY gc.id, gc.name, gc.country, gc.sub_country, gc.thumbnail_image, 
             gc.global_rank, gc.regional_rank, gc.usa_rank, l.slug
  )
  SELECT 
    cs.id as course_id,
    cs.name as course_name,
    cs.country,
    cs.sub_country,
    cs.thumbnail_image as thumbnail_url,
    cs.list_slug,
    cs.times_played,
    cs.avg_rating,
    cs.global_rank,
    cs.regional_rank,
    cs.usa_rank,
    cs.friends_count,
    cs.friends_avg_rating
  FROM course_stats cs
  ORDER BY 
    CASE WHEN cs.global_rank IS NOT NULL THEN cs.global_rank ELSE 9999 END,
    CASE WHEN cs.regional_rank IS NOT NULL THEN cs.regional_rank ELSE 9999 END,
    CASE WHEN cs.usa_rank IS NOT NULL THEN cs.usa_rank ELSE 9999 END
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;