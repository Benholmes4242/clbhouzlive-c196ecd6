DROP FUNCTION IF EXISTS get_top_video_reviews(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_top_video_reviews(
  days_back INTEGER DEFAULT 30,
  result_limit INTEGER DEFAULT 10,
  p_region_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  post_id UUID,
  review_id UUID,
  video_url TEXT,
  thumbnail_url TEXT,
  aspect_ratio NUMERIC,
  rating NUMERIC,
  review_text TEXT,
  review_snippet TEXT,
  created_at TIMESTAMPTZ,
  course_id UUID,
  course_name TEXT,
  course_location TEXT,
  course_slug TEXT,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  engagement_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as post_id,
    cr.id as review_id,
    pm.media_url as video_url,
    COALESCE(pm.poster_url, pm.media_url, gc.thumbnail_image) as thumbnail_url,
    CASE WHEN pm.width > 0 AND pm.height > 0 
      THEN (pm.width::NUMERIC / pm.height::NUMERIC) 
      ELSE 1.0 
    END as aspect_ratio,
    cr.rating,
    cr.review as review_text,
    LEFT(cr.review, 80) as review_snippet,
    p.created_at,
    gc.id as course_id,
    gc.name as course_name,
    CONCAT(COALESCE(gc.sub_country, ''), CASE WHEN gc.sub_country IS NOT NULL THEN ', ' ELSE '' END, gc.country) as course_location,
    gc.id::TEXT as course_slug,
    up.id as user_id,
    up.username,
    up.display_name,
    up.profile_photo_url as avatar_url,
    COALESCE(lc.cnt, 0)::INTEGER as likes_count,
    COALESCE(cc.cnt, 0)::INTEGER as comments_count,
    (
      COALESCE(lc.cnt, 0) * 3 + 
      COALESCE(cc.cnt, 0) * 2 +
      1
    )::NUMERIC * (
      1 + (days_back - LEAST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400, days_back::NUMERIC)) / days_back * 0.3
    ) as engagement_score
  FROM posts p
  JOIN course_ratings cr ON cr.id = p.source_review_id
  LEFT JOIN post_media pm ON pm.post_id = p.id AND pm.display_order = 0
  JOIN golf_courses gc ON cr.course_id = gc.id
  JOIN user_profiles up ON up.id = p.user_id
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes pl WHERE pl.post_id = p.id) lc ON TRUE
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments pc WHERE pc.post_id = p.id) cc ON TRUE
  WHERE 
    p.created_at >= NOW() - (days_back || ' days')::INTERVAL
    AND p.status = 'published'
    AND cr.rating >= 7.0
    AND (
      p_region_slug IS NULL
      OR gc.country IN (
        SELECT erm.country
        FROM explore_region_members erm
        JOIN explore_regions er ON er.id = erm.region_id
        WHERE er.slug = p_region_slug
      )
    )
  ORDER BY engagement_score DESC
  LIMIT result_limit;
END;
$$;