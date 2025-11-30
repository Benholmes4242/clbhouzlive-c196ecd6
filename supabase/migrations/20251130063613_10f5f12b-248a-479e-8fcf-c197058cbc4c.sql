-- Drop and recreate get_top100_discover_recommendations with new fields
DROP FUNCTION IF EXISTS get_top100_discover_recommendations(uuid, int);

CREATE FUNCTION get_top100_discover_recommendations(
  target_user_id uuid,
  limit_param int default 12
)
RETURNS TABLE (
  post_id uuid,
  course_id uuid,
  course_name text,
  list_slug text,
  list_rank int,
  list_short_label text,
  engagement_score numeric,
  created_at timestamptz,
  thumbnail_url text,
  caption text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_intent jsonb;
  wishlist_slugs text[];
  target_list text;
BEGIN
  -- Get user's Top 100 intent
  SELECT get_user_top100_intent(target_user_id) INTO user_intent;
  
  -- Extract wishlist slugs
  wishlist_slugs := ARRAY(SELECT jsonb_array_elements_text(user_intent->'wishlist_list_slugs'));
  
  -- Use first wishlist list, or default to global-top-100
  IF array_length(wishlist_slugs, 1) > 0 THEN
    target_list := wishlist_slugs[1];
  ELSE
    target_list := 'global-top-100';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id as post_id,
    p.course_id,
    gc.name as course_name,
    ctm.list_slug,
    ctm.rank as list_rank,
    tl.short_label as list_short_label,
    (COALESCE(p.like_count, 0) * 2 + COALESCE(p.comment_count, 0) * 3)::numeric as engagement_score,
    p.created_at,
    p.thumbnail_url,
    p.caption
  FROM posts p
  INNER JOIN golf_courses gc ON gc.id = p.course_id
  INNER JOIN course_top100_memberships ctm ON ctm.course_id = gc.id
  INNER JOIN top100_lists tl ON tl.id = ctm.list_id
  WHERE 
    ctm.list_slug = target_list
    AND p.course_id NOT IN (
      SELECT DISTINCT course_id 
      FROM user_courses 
      WHERE user_id = target_user_id AND played = true
    )
  ORDER BY engagement_score DESC, p.created_at DESC
  LIMIT limit_param;
END;
$$;

GRANT EXECUTE ON FUNCTION get_top100_discover_recommendations TO authenticated;

-- Drop and recreate get_trending_top100_moments with new fields
DROP FUNCTION IF EXISTS get_trending_top100_moments(int, int);

CREATE FUNCTION get_trending_top100_moments(
  limit_param int default 12,
  days_param int default 7
)
RETURNS TABLE (
  post_id uuid,
  course_id uuid,
  course_name text,
  list_slug text,
  list_rank int,
  list_short_label text,
  engagement_score numeric,
  created_at timestamptz,
  thumbnail_url text,
  caption text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as post_id,
    p.course_id,
    gc.name as course_name,
    ctm.list_slug,
    ctm.rank as list_rank,
    tl.short_label as list_short_label,
    (COALESCE(p.like_count, 0) * 2 + COALESCE(p.comment_count, 0) * 3)::numeric as engagement_score,
    p.created_at,
    p.thumbnail_url,
    p.caption
  FROM posts p
  INNER JOIN golf_courses gc ON gc.id = p.course_id
  INNER JOIN course_top100_memberships ctm ON ctm.course_id = gc.id
  INNER JOIN top100_lists tl ON tl.id = ctm.list_id
  WHERE 
    p.created_at > (NOW() - (days_param || ' days')::interval)
  ORDER BY engagement_score DESC, p.created_at DESC
  LIMIT limit_param;
END;
$$;

GRANT EXECUTE ON FUNCTION get_trending_top100_moments TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_top100_moments TO anon;