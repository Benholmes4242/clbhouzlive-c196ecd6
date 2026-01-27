-- Update the course leaderboard RPC to support filtering by sub_country
-- This allows filtering by sub-regions like "England" within "Britain & Ireland"

CREATE OR REPLACE FUNCTION get_top100_course_leaderboard(
  p_sort_by text DEFAULT 'rating',
  p_sort_order text DEFAULT 'desc',
  p_time_period text DEFAULT 'all_time',
  p_current_user_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_country text DEFAULT NULL,
  p_sub_country text DEFAULT NULL  -- NEW: Filter by sub_country (e.g., "England")
)
RETURNS TABLE(
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
  v_time_filter timestamp with time zone;
BEGIN
  -- Calculate time filter based on period
  IF p_time_period = 'month' THEN
    v_time_filter := date_trunc('month', now());
  ELSIF p_time_period = 'year' THEN
    v_time_filter := date_trunc('year', now());
  ELSE
    v_time_filter := NULL; -- all_time
  END IF;

  RETURN QUERY
  WITH course_stats AS (
    SELECT
      gc.id as course_id,
      gc.name as course_name,
      gc.club_name,
      gc.country,
      gc.sub_country as city,  -- city column maps to sub_country
      gc.region,
      COALESCE(gc.thumbnail_image, gc.cover_image) as image_url,
      ROUND(AVG(cr.rating)::numeric, 2) as avg_rating,
      COUNT(DISTINCT cr.id) as rating_count,
      COUNT(DISTINCT cr.id) as total_rounds
    FROM golf_courses gc
    INNER JOIN course_top100_memberships ctm ON gc.id = ctm.course_id
    LEFT JOIN course_ratings cr ON gc.id = cr.course_id
      AND (v_time_filter IS NULL OR cr.created_at >= v_time_filter)
    WHERE 
      -- Filter by country (region) if provided and no sub_country specified
      (p_country IS NULL OR p_sub_country IS NOT NULL OR gc.country = p_country)
      -- Filter by sub_country if provided
      AND (p_sub_country IS NULL OR gc.sub_country = p_sub_country)
    GROUP BY gc.id, gc.name, gc.club_name, gc.country, gc.sub_country, gc.region, gc.thumbnail_image, gc.cover_image
  ),
  ranked_courses AS (
    SELECT
      cs.*,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE 
            WHEN p_sort_by = 'rating' AND p_sort_order = 'desc' THEN cs.avg_rating
            WHEN p_sort_by = 'most_played' AND p_sort_order = 'desc' THEN cs.total_rounds
            ELSE cs.avg_rating
          END DESC NULLS LAST,
          cs.course_name ASC
      ) as rank
    FROM course_stats cs
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
         ORDER BY crh.recorded_at DESC
         LIMIT 1),
        0
      ) as rank_change
    FROM ranked_courses rc
  ),
  with_played_status AS (
    SELECT
      wrc.*,
      EXISTS(
        SELECT 1 FROM course_ratings cr2
        WHERE cr2.course_id = wrc.course_id
          AND cr2.user_id = p_current_user_id
      ) as has_played
    FROM with_rank_change wrc
  )
  SELECT
    wps.course_id,
    wps.course_name,
    wps.club_name,
    wps.country,
    wps.city,
    wps.region,
    wps.image_url,
    wps.avg_rating,
    wps.rating_count,
    wps.total_rounds,
    wps.rank,
    wps.rank_change,
    wps.has_played
  FROM with_played_status wps
  ORDER BY wps.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;