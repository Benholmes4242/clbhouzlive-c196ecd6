CREATE OR REPLACE FUNCTION public.get_watch_category_counts()
RETURNS TABLE(category text, post_count bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    unnest(p.post_categories) AS category,
    COUNT(DISTINCT p.id) AS post_count
  FROM posts p
  INNER JOIN post_media pm ON pm.post_id = p.id
  WHERE p.status = 'published'
    AND pm.media_type = 'video'
    AND pm.duration_seconds IS NOT NULL
    AND pm.duration_seconds <= 180
    AND array_length(p.post_categories, 1) > 0
  GROUP BY category
  ORDER BY post_count DESC;
$$;