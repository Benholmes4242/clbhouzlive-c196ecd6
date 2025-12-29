-- Add deterministic tie-breaker to prevent pagination jitter

DROP FUNCTION IF EXISTS public.get_friends_first_post_ids(uuid, int, int, text, int, int);

CREATE OR REPLACE FUNCTION public.get_friends_first_post_ids(
  p_current_user_id uuid,
  p_limit int,
  p_offset int,
  p_media_type text DEFAULT NULL,
  p_max_duration int DEFAULT NULL,
  p_min_duration int DEFAULT NULL
)
RETURNS TABLE(post_id uuid, is_friend boolean)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH filtered_posts AS (
    SELECT DISTINCT p.id, p.user_id, p.created_at
    FROM public.posts p
    INNER JOIN public.post_media pm ON pm.post_id = p.id
    WHERE
      -- Visibility filter (don't exclude user's own posts!)
      (
        p.visibility = 'anyone' 
        OR p.visibility = 'followers' 
        OR p.visibility IS NULL 
        OR (p.visibility = 'private' AND p.user_id = p_current_user_id)
      )
      -- Media type filter
      AND (p_media_type IS NULL OR pm.media_type = p_media_type)
      -- Duration filters
      AND (p_max_duration IS NULL OR pm.duration_seconds IS NULL OR pm.duration_seconds <= p_max_duration)
      AND (p_min_duration IS NULL OR pm.duration_seconds IS NULL OR pm.duration_seconds >= p_min_duration)
  )
  SELECT 
    fp.id AS post_id,
    (uf.following_id IS NOT NULL AND fp.user_id != p_current_user_id) AS is_friend
  FROM filtered_posts fp
  LEFT JOIN public.user_follows uf
    ON uf.following_id = fp.user_id
   AND uf.follower_id = p_current_user_id
  ORDER BY
    (uf.following_id IS NOT NULL AND fp.user_id != p_current_user_id) DESC,
    fp.created_at DESC,
    fp.id DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_friends_first_post_ids(uuid, int, int, text, int, int) TO authenticated;