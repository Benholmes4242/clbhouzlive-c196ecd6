-- Fix index naming issues from previous migration
DROP INDEX IF EXISTS public.idx_explore_moments_created_at;

-- Correctly named indexes for posts (powers explore_moments post side)
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc
  ON public.posts(created_at DESC);

-- Composite index for course + created_at queries
CREATE INDEX IF NOT EXISTS idx_posts_course_created_at_desc
  ON public.posts(course_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_ratings_created_at_desc
  ON public.course_ratings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_ratings_course_created_at_desc
  ON public.course_ratings(course_id, created_at DESC);

-- Add index for course_media_likes lookups (for review trending)
CREATE INDEX IF NOT EXISTS idx_course_media_likes_media_id
  ON public.course_media_likes(media_id);

-- Update RPC to include course_media_likes for review moments
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
      -- Engagement counts
      CASE 
        WHEN em.source_type = 'post' THEN COALESCE(pl.likes_count, 0)
        WHEN em.source_type = 'review' THEN COALESCE(rml.likes_count, 0)
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
    -- Post engagement tables
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
    -- Review media likes (course_media_likes.media_id is a text field matching the moment_id suffix)
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::bigint AS likes_count
      FROM public.course_media_likes
      WHERE media_id = REPLACE(em.moment_id, 'review_', '') AND em.source_type = 'review'
    ) rml ON true
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