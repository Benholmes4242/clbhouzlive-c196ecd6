-- Drop any existing versions of the function to ensure clean state
DROP FUNCTION IF EXISTS public.get_top100_course_leaderboard(text, text, text, uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_top100_course_leaderboard(text, text, text, uuid, integer, integer, text);

-- Create the updated function with country filtering
CREATE OR REPLACE FUNCTION public.get_top100_course_leaderboard(
  p_sort_by text DEFAULT 'rating',
  p_sort_order text DEFAULT 'desc',
  p_time_period text DEFAULT 'all_time',
  p_current_user_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_country text DEFAULT NULL
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
  WITH top100_courses AS (
    SELECT DISTINCT gc.id as course_id
    FROM golf_courses gc
    INNER JOIN course_top100_memberships ctm ON ctm.course_id = gc.id
    WHERE (p_country IS NULL OR gc.country = p_country)
  ),
  course_stats AS (
    SELECT
      t.course_id,
      COALESCE(AVG(cr.rating), 0) as avg_rating,
      COUNT(cr.id) as rating_count,
      COUNT(DISTINCT cr.id) as total_rounds
    FROM top100_courses t
    LEFT JOIN course_ratings cr ON cr.course_id = t.course_id
      AND (v_period_start IS NULL OR cr.created_at >= v_period_start)
      AND cr.is_mock = false
    GROUP BY t.course_id
  ),
  ranked_courses AS (
    SELECT
      gc.id as course_id,
      gc.name as course_name,
      gc.club_name,
      gc.country,
      gc.city,
      gc.region,
      gc.image_url,
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
    FROM top100_courses t
    INNER JOIN golf_courses gc ON gc.id = t.course_id
    INNER JOIN course_stats cs ON cs.course_id = t.course_id
  ),
  with_rank_change AS (
    SELECT
      rc.*,
      COALESCE(
        (SELECT rc.rank::integer - crh.rank::integer
         FROM course_rank_history crh
         WHERE crh.course_id = rc.course_id
           AND crh.rank_type = p_sort_by
           AND crh.time_period = p_time_period
           AND crh.recorded_date < CURRENT_DATE
         ORDER BY crh.recorded_date DESC
         LIMIT 1),
        0
      ) as rank_change
    FROM ranked_courses rc
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
    wrc.rank_change,
    CASE 
      WHEN p_current_user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM course_ratings cr2 
        WHERE cr2.course_id = wrc.course_id 
        AND cr2.user_id = p_current_user_id
      )
    END as has_played
  FROM with_rank_change wrc
  ORDER BY wrc.rank ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_top100_course_leaderboard(text, text, text, uuid, integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top100_course_leaderboard(text, text, text, uuid, integer, integer, text) TO anon;