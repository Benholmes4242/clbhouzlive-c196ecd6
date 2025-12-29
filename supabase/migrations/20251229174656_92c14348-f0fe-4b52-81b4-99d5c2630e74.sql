-- RPC function for Friends First sorting with proper global ordering and pagination
-- Returns post IDs in correct order, which the client then uses to fetch full post data

CREATE OR REPLACE FUNCTION public.get_friends_first_post_ids(
  p_current_user_id uuid,
  p_limit int,
  p_offset int,
  p_media_type text DEFAULT NULL,  -- 'video', 'image', or null for all
  p_max_duration int DEFAULT NULL,
  p_min_duration int DEFAULT NULL
)
RETURNS TABLE(post_id uuid, is_friend boolean)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT DISTINCT ON (p.id)
    p.id AS post_id,
    (uf.following_id IS NOT NULL) AS is_friend
  FROM public.posts p
  INNER JOIN public.post_media pm ON pm.post_id = p.id
  LEFT JOIN public.user_follows uf
    ON uf.following_id = p.user_id
   AND uf.follower_id = p_current_user_id
  WHERE
    -- Exclude current user's personal posts (business posts OK)
    (p.user_id != p_current_user_id OR p.actor_type = 'business')
    -- Visibility filter: anyone, followers, null (legacy), or private if owner
    AND (
      p.visibility = 'anyone' 
      OR p.visibility = 'followers' 
      OR p.visibility IS NULL 
      OR (p.visibility = 'private' AND p.user_id = p_current_user_id)
    )
    -- Media type filter
    AND (p_media_type IS NULL OR pm.media_type = p_media_type)
    -- Duration filters (for video filtering)
    AND (p_max_duration IS NULL OR pm.duration_seconds IS NULL OR pm.duration_seconds <= p_max_duration)
    AND (p_min_duration IS NULL OR pm.duration_seconds IS NULL OR pm.duration_seconds >= p_min_duration)
  ORDER BY
    p.id,  -- Required for DISTINCT ON
    (uf.following_id IS NOT NULL) DESC,
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Corrected version using subquery for proper ordering
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
AS $$
  WITH filtered_posts AS (
    SELECT DISTINCT p.id, p.user_id, p.created_at
    FROM public.posts p
    INNER JOIN public.post_media pm ON pm.post_id = p.id
    WHERE
      -- Exclude current user's personal posts (business posts OK)
      (p.user_id != p_current_user_id OR p.actor_type = 'business')
      -- Visibility filter
      AND (
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
    (uf.following_id IS NOT NULL) AS is_friend
  FROM filtered_posts fp
  LEFT JOIN public.user_follows uf
    ON uf.following_id = fp.user_id
   AND uf.follower_id = p_current_user_id
  ORDER BY
    (uf.following_id IS NOT NULL) DESC,
    fp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_created_at
ON public.posts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_following
ON public.user_follows (follower_id, following_id);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_friends_first_post_ids(uuid, int, int, text, int, int) TO authenticated;