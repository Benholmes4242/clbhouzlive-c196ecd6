-- Create new RPC for Golf Courses leaderboard (shows ALL reviewed courses, no Top 100 restriction)
CREATE OR REPLACE FUNCTION get_course_leaderboard(
  p_sort_by text DEFAULT 'rating',
  p_sort_order text DEFAULT 'desc',
  p_time_period text DEFAULT 'all_time',
  p_current_user_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_country text DEFAULT NULL,
  p_sub_country text DEFAULT NULL
)
RETURNS TABLE (
  course_id uuid,
  course_name text,
  club_name text,
  country text,
  city text,
  region text,
  image_url text,
  avg_rating numeric,
  rating_count bigint,
  total_rounds bigint,
  rank bigint,
  rank_change integer,
  has_played boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start timestamp with time zone;
BEGIN
  -- Calculate period start based on time_period
  IF p_time_period = 'week' THEN
    v_period_start := date_trunc('week', now());
  ELSIF p_time_period = 'month' THEN
    v_period_start := date_trunc('month', now());
  ELSIF p_time_period = 'year' THEN
    v_period_start := date_trunc('year', now());
  ELSE
    v_period_start := NULL; -- all_time
  END IF;

  RETURN QUERY
  WITH reviewed_courses AS (
    -- Get all courses that have at least 1 review (no Top 100 restriction)
    SELECT DISTINCT gc.id as course_id
    FROM golf_courses gc
    INNER JOIN course_ratings cr ON cr.course_id = gc.id
    WHERE cr.is_mock = false
      AND (p_country IS NULL OR gc.country = p_country)
      AND (p_sub_country IS NULL OR gc.sub_country = p_sub_country)
  ),
  course_stats AS (
    SELECT
      rc.course_id,
      COALESCE(AVG(cr.rating), 0) as avg_rating,
      COUNT(cr.id) as rating_count,
      COUNT(DISTINCT cr.id) as total_rounds
    FROM reviewed_courses rc
    LEFT JOIN course_ratings cr ON cr.course_id = rc.course_id
      AND (v_period_start IS NULL OR cr.created_at >= v_period_start)
      AND cr.is_mock = false
    GROUP BY rc.course_id
  ),
  ranked_courses AS (
    SELECT
      gc.id as course_id,
      gc.name as course_name,
      club.name as club_name,
      gc.country,
      gc.sub_country as city,
      gc.region,
      gc.thumbnail_image as image_url,
      ROUND(cs.avg_rating, 2) as avg_rating,
      cs.rating_count,
      cs.total_rounds,
      CASE 
        WHEN p_sort_by = 'rating' THEN
          ROW_NUMBER() OVER (ORDER BY cs.avg_rating DESC NULLS LAST, cs.rating_count DESC NULLS LAST, gc.name ASC)
        WHEN p_sort_by = 'most_played' THEN
          ROW_NUMBER() OVER (ORDER BY cs.total_rounds DESC NULLS LAST, cs.avg_rating DESC NULLS LAST, gc.name ASC)
        WHEN p_sort_by = 'trending' THEN
          ROW_NUMBER() OVER (ORDER BY cs.rating_count DESC NULLS LAST, cs.avg_rating DESC NULLS LAST, gc.name ASC)
        ELSE
          ROW_NUMBER() OVER (ORDER BY cs.avg_rating DESC NULLS LAST, cs.rating_count DESC NULLS LAST, gc.name ASC)
      END as rank
    FROM reviewed_courses rc
    INNER JOIN golf_courses gc ON gc.id = rc.course_id
    LEFT JOIN golf_clubs club ON club.id = gc.club_id
    INNER JOIN course_stats cs ON cs.course_id = rc.course_id
  )
  SELECT
    wrc.course_id,
    wrc.course_name,
    wrc.club_name,
    wrc.country,
    wrc.city,
    wrc.region,
    wrc.image_url,
    wrc.avg_rating,
    wrc.rating_count,
    wrc.total_rounds,
    wrc.rank,
    0 as rank_change, -- No rank history tracking for general leaderboard
    CASE 
      WHEN p_current_user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM course_ratings cr2 
        WHERE cr2.course_id = wrc.course_id 
        AND cr2.user_id = p_current_user_id
      )
    END as has_played
  FROM ranked_courses wrc
  ORDER BY wrc.rank ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Delete the duplicate Majlis course entry (no reviews)
DELETE FROM golf_courses WHERE id = '2bb76eff-d70b-4050-a972-6100bcce88a3';