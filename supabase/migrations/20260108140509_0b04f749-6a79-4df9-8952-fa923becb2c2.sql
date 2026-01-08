-- Create RPC for trending explore moments (last 7 days weighted by engagement)
-- Uses post_likes, post_comments, post_shares for post moments
-- Reviews currently don't have engagement tables, so they use recency only

CREATE OR REPLACE FUNCTION public.rpc_explore_trending(
  p_limit int DEFAULT 40,
  p_region_key text DEFAULT NULL
)
RETURNS TABLE (
  moment_id text,
  source_type text,
  source_id uuid,
  course_id uuid,
  user_id uuid,
  created_at timestamptz,
  media_type text,
  media_url text,
  thumbnail_url text,
  stream_id text,
  aspect_ratio numeric,
  display_order int,
  region_key text,
  likes_count bigint,
  comments_count bigint,
  shares_count bigint,
  trend_score numeric
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH moment_engagement AS (
    SELECT
      em.moment_id,
      em.source_type,
      em.source_id,
      em.course_id,
      em.user_id,
      em.created_at,
      em.media_type,
      em.media_url,
      em.thumbnail_url,
      em.stream_id,
      em.aspect_ratio,
      em.display_order,
      em.region_key,
      -- Engagement counts (posts only for now)
      CASE 
        WHEN em.source_type = 'post' THEN COALESCE(pl.likes_count, 0)
        ELSE 0
      END AS likes_count,
      CASE 
        WHEN em.source_type = 'post' THEN COALESCE(pc.comments_count, 0)
        ELSE 0
      END AS comments_count,
      CASE 
        WHEN em.source_type = 'post' THEN COALESCE(ps.shares_count, 0)
        ELSE 0
      END AS shares_count,
      -- Hours since posted (for recency decay)
      EXTRACT(EPOCH FROM (now() - em.created_at)) / 3600.0 AS hours_since_posted
    FROM public.explore_moments em
    -- Join post engagement tables
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::bigint AS likes_count
      FROM public.post_likes
      WHERE post_id = em.source_id::uuid AND em.source_type = 'post'
    ) pl ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::bigint AS comments_count
      FROM public.post_comments
      WHERE post_id = em.source_id::uuid AND em.source_type = 'post'
    ) pc ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::bigint AS shares_count
      FROM public.post_shares
      WHERE post_id = em.source_id::uuid AND em.source_type = 'post'
    ) ps ON true
    WHERE em.created_at >= now() - interval '7 days'
      AND (p_region_key IS NULL OR em.region_key = p_region_key)
  )
  SELECT
    me.moment_id,
    me.source_type,
    me.source_id,
    me.course_id,
    me.user_id,
    me.created_at,
    me.media_type,
    me.media_url,
    me.thumbnail_url,
    me.stream_id,
    me.aspect_ratio,
    me.display_order,
    me.region_key,
    me.likes_count,
    me.comments_count,
    me.shares_count,
    -- Trend score: (likes * 3) + (comments * 5) + (shares * 8) + recency_bonus
    -- Recency bonus: (1 / (hours + 2)) * 50 gives boost to newer content
    ROUND(
      (me.likes_count * 3) +
      (me.comments_count * 5) +
      (me.shares_count * 8) +
      ((1.0 / (me.hours_since_posted + 2.0)) * 50.0),
      2
    )::numeric AS trend_score
  FROM moment_engagement me
  ORDER BY trend_score DESC, me.created_at DESC
  LIMIT p_limit;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.rpc_explore_trending(int, text) TO anon, authenticated;

-- Add index to improve engagement lookups
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON public.post_shares(post_id);

-- Add index for 7-day filter on explore_moments
CREATE INDEX IF NOT EXISTS idx_explore_moments_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_ratings_created_at ON public.course_ratings(created_at DESC);