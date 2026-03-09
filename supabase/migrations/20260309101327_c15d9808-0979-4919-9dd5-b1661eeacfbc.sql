CREATE OR REPLACE FUNCTION get_trending_courses(
  p_days_back INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 15,
  p_region_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  course_id UUID,
  course_name TEXT,
  country TEXT,
  sub_country TEXT,
  thumbnail_image TEXT,
  global_rank INTEGER,
  review_count BIGINT,
  post_count BIGINT,
  trending_score NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_days_back INTEGER := p_days_back;
  v_limit INTEGER := p_limit;
  v_region_slug TEXT := p_region_slug;
  v_cutoff TIMESTAMPTZ := NOW() - (p_days_back || ' days')::INTERVAL;
  v_halflife NUMERIC := 168;
BEGIN
  RETURN QUERY
  WITH course_activity AS (
    SELECT
      gc.id AS c_id,
      gc.name AS c_name,
      gc.country AS c_country,
      gc.sub_country AS c_sub_country,
      gc.thumbnail_image AS c_thumbnail,
      gc.global_rank AS c_global_rank,
      (SELECT COUNT(*) 
       FROM course_ratings cr 
       JOIN posts p ON p.source_review_id = cr.id 
       WHERE cr.course_id = gc.id 
         AND p.status = 'published' 
         AND p.created_at >= v_cutoff
      ) AS recent_reviews,
      (SELECT COUNT(*) 
       FROM posts p2 
       WHERE p2.course_id = gc.id 
         AND p2.status = 'published' 
         AND p2.created_at >= v_cutoff
      ) AS recent_posts,
      GREATEST(
        COALESCE(
          (SELECT MAX(p3.created_at) 
           FROM posts p3 
           WHERE (p3.course_id = gc.id OR p3.source_review_id IN (SELECT cr2.id FROM course_ratings cr2 WHERE cr2.course_id = gc.id))
             AND p3.status = 'published' 
             AND p3.created_at >= v_cutoff),
          v_cutoff
        ),
        v_cutoff
      ) AS latest_activity
    FROM golf_courses gc
    WHERE gc.thumbnail_image IS NOT NULL
      AND (
        v_region_slug IS NULL
        OR gc.country IN (
          SELECT erm.country 
          FROM explore_region_members erm 
          JOIN explore_regions er ON er.id = erm.region_id 
          WHERE er.slug = v_region_slug
        )
      )
  )
  SELECT
    ca.c_id,
    ca.c_name,
    ca.c_country,
    ca.c_sub_country,
    ca.c_thumbnail,
    ca.c_global_rank,
    ca.recent_reviews,
    ca.recent_posts,
    (ca.recent_reviews * 3.0 + ca.recent_posts * 1.0)
      * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - ca.latest_activity)) / 3600.0 / v_halflife)
    AS trending_score
  FROM course_activity ca
  WHERE (ca.recent_reviews + ca.recent_posts) > 0
  ORDER BY trending_score DESC
  LIMIT v_limit;
END;
$$;