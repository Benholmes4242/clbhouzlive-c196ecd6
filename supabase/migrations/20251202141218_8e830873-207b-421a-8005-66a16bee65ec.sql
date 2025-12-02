-- Drop existing function first to change return type
DROP FUNCTION IF EXISTS public.get_top100_course_leaderboard(text, text, integer, integer);

-- Recreate with global_rank, regional_rank, usa_rank columns
CREATE OR REPLACE FUNCTION public.get_top100_course_leaderboard(
  scope_param text DEFAULT 'worldwide',
  time_range_param text DEFAULT 'all_time',
  limit_param integer DEFAULT 20,
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
  usa_rank integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
      COALESCE(
        CASE 
          WHEN scope_param = 'global-top-100' THEN 'global'
          WHEN scope_param = 'gb-i-top-100' THEN 'gb-i'
          WHEN scope_param = 'usa-top-100' THEN 'usa'
          WHEN scope_param = 'europe-top-100' THEN 'europe'
          ELSE 'worldwide'
        END, 
        'worldwide'
      ) as list_slug,
      COUNT(DISTINCT cr.user_id) as times_played,
      AVG(cr.rating)::numeric(3,1) as avg_rating
    FROM golf_courses gc
    LEFT JOIN course_ratings cr ON cr.course_id = gc.id
      AND (
        time_range_param = 'all_time' 
        OR (time_range_param = 'this_year' AND cr.created_at >= date_trunc('year', now()))
        OR (time_range_param = 'this_month' AND cr.created_at >= date_trunc('month', now()))
      )
    WHERE 
      CASE 
        WHEN scope_param = 'worldwide' THEN (gc.global_rank IS NOT NULL OR gc.regional_rank IS NOT NULL OR gc.usa_rank IS NOT NULL)
        WHEN scope_param = 'global-top-100' THEN gc.global_rank IS NOT NULL AND gc.global_rank <= 100
        WHEN scope_param = 'gb-i-top-100' THEN gc.regional_rank IS NOT NULL AND gc.regional_rank <= 100 AND gc.country IN ('United Kingdom', 'Ireland', 'England', 'Scotland', 'Wales', 'Northern Ireland')
        WHEN scope_param = 'usa-top-100' THEN gc.usa_rank IS NOT NULL AND gc.usa_rank <= 100
        WHEN scope_param = 'europe-top-100' THEN gc.regional_rank IS NOT NULL AND gc.regional_rank <= 100 AND gc.continent = 'Europe' AND gc.country NOT IN ('United Kingdom', 'Ireland', 'England', 'Scotland', 'Wales', 'Northern Ireland')
        ELSE (gc.global_rank IS NOT NULL OR gc.regional_rank IS NOT NULL OR gc.usa_rank IS NOT NULL)
      END
    GROUP BY gc.id, gc.name, gc.country, gc.sub_country, gc.thumbnail_image, gc.global_rank, gc.regional_rank, gc.usa_rank
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
    cs.usa_rank
  FROM course_stats cs
  ORDER BY 
    CASE 
      WHEN scope_param = 'global-top-100' THEN cs.global_rank
      WHEN scope_param = 'gb-i-top-100' THEN cs.regional_rank
      WHEN scope_param = 'usa-top-100' THEN cs.usa_rank
      WHEN scope_param = 'europe-top-100' THEN cs.regional_rank
      ELSE COALESCE(cs.global_rank, cs.regional_rank, cs.usa_rank, 9999)
    END ASC NULLS LAST
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;