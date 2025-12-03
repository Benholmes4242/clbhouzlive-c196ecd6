-- Phase 2A: Get recent Top 100 course activity from friends
CREATE OR REPLACE FUNCTION public.get_top100_friend_recent_activity(
  scope_param text DEFAULT 'worldwide',
  time_range_param text DEFAULT 'all_time',
  limit_param integer DEFAULT 30
)
RETURNS TABLE (
  course_id uuid,
  course_name text,
  country text,
  sub_country text,
  thumbnail_url text,
  list_slug text,
  played_at timestamptz,
  friend_id uuid,
  friend_name text,
  friend_avatar_url text,
  rating numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH top100_courses AS (
    SELECT gc.id, gc.name, gc.country, gc.sub_country, gc.thumbnail_image,
           gc.global_rank, gc.regional_rank, gc.usa_rank,
           COALESCE(l.slug, 'global') as list_slug
    FROM golf_courses gc
    LEFT JOIN course_top100_memberships m ON m.course_id = gc.id
    LEFT JOIN top100_lists l ON l.id = m.list_id
    WHERE m.id IS NOT NULL
  ),
  my_friends AS (
    -- People the current user follows
    SELECT uf.following_id AS friend_id
    FROM user_follows uf
    WHERE uf.follower_id = current_user_id
  ),
  ratings_scoped AS (
    SELECT
      cr.course_id,
      cr.user_id,
      cr.rating,
      cr.created_at,
      gc.name AS course_name,
      gc.country,
      gc.sub_country,
      gc.thumbnail_image,
      gc.list_slug
    FROM course_ratings cr
    JOIN top100_courses gc ON gc.id = cr.course_id
    JOIN my_friends f ON f.friend_id = cr.user_id
    WHERE
      (time_range_param = 'all_time')
      OR (time_range_param = 'this_year'  AND cr.created_at >= date_trunc('year',  now()))
      OR (time_range_param = 'this_month' AND cr.created_at >= date_trunc('month', now()))
      OR (time_range_param = 'this_week'  AND cr.created_at >= date_trunc('week',  now()))
  )
  SELECT
    r.course_id,
    r.course_name,
    r.country,
    r.sub_country,
    r.thumbnail_image AS thumbnail_url,
    r.list_slug,
    r.created_at AS played_at,
    r.user_id AS friend_id,
    COALESCE(up.display_name, up.username) AS friend_name,
    up.profile_photo_url AS friend_avatar_url,
    ROUND(r.rating::numeric, 1) AS rating
  FROM ratings_scoped r
  LEFT JOIN user_profiles up ON up.id = r.user_id
  ORDER BY r.created_at DESC
  LIMIT limit_param;
END;
$$;

-- Phase 2B: Get courses that are trending/moving this period
CREATE OR REPLACE FUNCTION public.get_top100_course_movers(
  scope_param text DEFAULT 'worldwide',
  time_range_param text DEFAULT 'this_month',
  limit_param integer DEFAULT 10
)
RETURNS TABLE (
  course_id uuid,
  course_name text,
  country text,
  sub_country text,
  thumbnail_url text,
  list_slug text,
  rating_delta numeric,
  plays_delta bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_start timestamptz;
  previous_start timestamptz;
BEGIN
  -- Define periods based on time_range_param
  IF time_range_param = 'this_week' THEN
    current_start := date_trunc('week', now());
    previous_start := current_start - interval '1 week';
  ELSIF time_range_param = 'this_month' THEN
    current_start := date_trunc('month', now());
    previous_start := current_start - interval '1 month';
  ELSE
    current_start := date_trunc('year', now());
    previous_start := current_start - interval '1 year';
  END IF;

  RETURN QUERY
  WITH top100_courses AS (
    SELECT gc.id, gc.name, gc.country, gc.sub_country, gc.thumbnail_image,
           gc.global_rank, gc.regional_rank, gc.usa_rank,
           COALESCE(l.slug, 'global') as list_slug
    FROM golf_courses gc
    LEFT JOIN course_top100_memberships m ON m.course_id = gc.id
    LEFT JOIN top100_lists l ON l.id = m.list_id
    WHERE m.id IS NOT NULL
      AND (
        scope_param = 'worldwide'
        OR (scope_param = 'global-top-100' AND l.slug = 'global')
        OR (scope_param = 'gb-i-top-100' AND l.slug = 'gb-i')
        OR (scope_param = 'usa-top-100' AND l.slug = 'usa')
        OR (scope_param = 'europe-top-100' AND l.slug = 'europe')
      )
  ),
  current_period AS (
    SELECT
      gc.id AS course_id,
      AVG(cr.rating) AS avg_rating,
      COUNT(cr.id) AS plays
    FROM top100_courses gc
    LEFT JOIN course_ratings cr ON cr.course_id = gc.id
      AND cr.created_at >= current_start
    GROUP BY gc.id
  ),
  previous_period AS (
    SELECT
      gc.id AS course_id,
      AVG(cr.rating) AS avg_rating,
      COUNT(cr.id) AS plays
    FROM top100_courses gc
    LEFT JOIN course_ratings cr ON cr.course_id = gc.id
      AND cr.created_at >= previous_start
      AND cr.created_at < current_start
    GROUP BY gc.id
  )
  SELECT
    gc.id AS course_id,
    gc.name AS course_name,
    gc.country,
    gc.sub_country,
    gc.thumbnail_image AS thumbnail_url,
    gc.list_slug,
    ROUND((COALESCE(cp.avg_rating, 0) - COALESCE(pp.avg_rating, 0))::numeric, 1) AS rating_delta,
    (COALESCE(cp.plays, 0) - COALESCE(pp.plays, 0))::bigint AS plays_delta
  FROM top100_courses gc
  LEFT JOIN current_period cp ON cp.course_id = gc.id
  LEFT JOIN previous_period pp ON pp.course_id = gc.id
  WHERE COALESCE(cp.plays, 0) > 0 OR COALESCE(pp.plays, 0) > 0
  ORDER BY
    GREATEST(
      COALESCE(cp.avg_rating, 0) - COALESCE(pp.avg_rating, 0),
      (COALESCE(cp.plays, 0) - COALESCE(pp.plays, 0))::numeric / 10.0
    ) DESC
  LIMIT limit_param;
END;
$$;