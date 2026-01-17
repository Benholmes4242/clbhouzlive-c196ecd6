
-- Fix the get_top_video_reviews function - remove gc.slug reference (doesn't exist)
CREATE OR REPLACE FUNCTION get_top_video_reviews(
  days_back INTEGER DEFAULT 7,
  result_limit INTEGER DEFAULT 7
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
    pm.poster_url as thumbnail_url,
    pm.aspect_ratio,
    cr.rating,
    cr.review as review_text,
    LEFT(cr.review, 80) as review_snippet,
    p.created_at,
    gc.id as course_id,
    gc.name as course_name,
    CONCAT(COALESCE(gc.sub_country, ''), CASE WHEN gc.sub_country IS NOT NULL THEN ', ' ELSE '' END, gc.country) as course_location,
    gc.id::TEXT as course_slug, -- Use ID as slug since slug column doesn't exist
    up.id as user_id,
    up.username,
    up.display_name,
    up.profile_photo_url as avatar_url,
    COALESCE(p.like_count, 0)::INTEGER as likes_count,
    COALESCE(p.comment_count, 0)::INTEGER as comments_count,
    (
      COALESCE(p.like_count, 0) * 3 + 
      COALESCE(p.comment_count, 0) * 2
    )::NUMERIC * (
      1 + (days_back - LEAST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400, days_back::NUMERIC)) / days_back * 0.3
    ) as engagement_score
  FROM posts p
  JOIN course_ratings cr ON cr.id = p.source_review_id
  JOIN post_media pm ON pm.post_id = p.id
  JOIN golf_courses gc ON cr.course_id = gc.id
  JOIN user_profiles up ON up.id = p.user_id
  WHERE 
    p.created_at >= NOW() - (days_back || ' days')::INTERVAL
    AND p.status = 'published'
    AND pm.display_order = 0
    AND pm.media_type = 'video'
    AND cr.review IS NOT NULL
    AND cr.review != ''
  ORDER BY engagement_score DESC
  LIMIT result_limit;
END;
$$;
