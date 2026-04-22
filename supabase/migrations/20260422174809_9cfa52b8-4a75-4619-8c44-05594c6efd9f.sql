-- ===========================================================================
-- Phase 1 — Pro Shop Foundation
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend course_mood_blurbs to support post-level reasoning blurbs
-- ---------------------------------------------------------------------------

ALTER TABLE public.course_mood_blurbs
  ADD COLUMN IF NOT EXISTS post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE;

-- Expand allowed mood values to include the three new editorial picks
ALTER TABLE public.course_mood_blurbs
  DROP CONSTRAINT IF EXISTS course_mood_blurbs_mood_check;

ALTER TABLE public.course_mood_blurbs
  ADD CONSTRAINT course_mood_blurbs_mood_check
  CHECK (mood IN (
    'foryou','weekend','friends','hidden','bucket','hero_feature',
    'watch_of_week','clip_of_week','video_of_week'
  ));

-- Index for efficient post-blurb lookup
CREATE INDEX IF NOT EXISTS idx_course_mood_blurbs_post_id
  ON public.course_mood_blurbs(post_id)
  WHERE post_id IS NOT NULL;

-- One blurb per (post, mood) pair when post-scoped
CREATE UNIQUE INDEX IF NOT EXISTS course_mood_blurbs_post_mood_unique_idx
  ON public.course_mood_blurbs(post_id, mood)
  WHERE post_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. get_user_course_anchored_content
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_course_anchored_content(
  p_user_id uuid,
  p_limit_per_course int DEFAULT 4
)
RETURNS TABLE (
  course_id uuid,
  course_name text,
  course_country text,
  content_count int,
  recent_post_ids uuid[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH played AS (
    SELECT DISTINCT uca.course_id, MAX(uca.played_at) AS last_played
    FROM public.user_course_activity uca
    WHERE uca.user_id = p_user_id
      AND uca.has_played = true
      AND uca.course_id IS NOT NULL
    GROUP BY uca.course_id
  ),
  primary_media AS (
    SELECT
      pm.post_id,
      pm.duration_seconds,
      ROW_NUMBER() OVER (
        PARTITION BY pm.post_id
        ORDER BY pm.display_order ASC NULLS LAST, pm.created_at ASC
      ) AS rn
    FROM public.post_media pm
    WHERE pm.media_type = 'video'
  ),
  course_posts AS (
    SELECT
      p.course_id,
      p.id AS post_id,
      p.created_at,
      ROW_NUMBER() OVER (
        PARTITION BY p.course_id
        ORDER BY p.created_at DESC
      ) AS post_rn
    FROM public.posts p
    JOIN primary_media pm ON pm.post_id = p.id AND pm.rn = 1
    JOIN played pl ON pl.course_id = p.course_id
    WHERE p.created_at > now() - interval '30 days'
      AND p.status = 'published'
  ),
  agg AS (
    SELECT
      cp.course_id,
      COUNT(*)::int AS total,
      array_agg(cp.post_id ORDER BY cp.created_at DESC) FILTER (WHERE cp.post_rn <= p_limit_per_course) AS post_ids
    FROM course_posts cp
    GROUP BY cp.course_id
    HAVING COUNT(*) >= 3
  )
  SELECT
    gc.id AS course_id,
    gc.name AS course_name,
    gc.country AS course_country,
    a.total AS content_count,
    a.post_ids AS recent_post_ids
  FROM agg a
  JOIN public.golf_courses gc ON gc.id = a.course_id
  JOIN played pl ON pl.course_id = a.course_id
  ORDER BY a.total DESC, pl.last_played DESC
  LIMIT 5;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_course_anchored_content(uuid, int) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. get_watch_of_the_week (mixed format)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_watch_of_the_week()
RETURNS TABLE (
  post_id uuid,
  user_id uuid,
  course_id uuid,
  course_name text,
  caption text,
  thumbnail_url text,
  hls_url text,
  duration_seconds numeric,
  format text,
  username text,
  display_name text,
  avatar_url text,
  is_verified boolean,
  like_count int,
  comment_count int,
  created_at timestamptz,
  why_ai text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH primary_media AS (
    SELECT
      pm.post_id,
      pm.duration_seconds,
      pm.poster_url,
      pm.hls_url,
      pm.media_url,
      ROW_NUMBER() OVER (
        PARTITION BY pm.post_id
        ORDER BY pm.display_order ASC NULLS LAST, pm.created_at ASC
      ) AS rn
    FROM public.post_media pm
    WHERE pm.media_type = 'video'
  ),
  qualified_courses AS (
    SELECT cra.course_id
    FROM public.course_rating_aggregates cra
    WHERE cra.review_count >= 5
  ),
  candidates AS (
    SELECT
      p.id AS pid,
      p.user_id AS uid,
      p.course_id AS cid,
      p.content AS caption,
      pm.poster_url,
      pm.hls_url,
      pm.duration_seconds,
      CASE WHEN pm.duration_seconds <= 90 THEN 'clip' ELSE 'video' END AS format,
      COALESCE(p.like_count, 0) AS lc,
      COALESCE(p.comment_count, 0) AS cc,
      0 AS sc,  -- no share_count column on posts; placeholder
      p.created_at,
      (
        (COALESCE(p.like_count, 0) * 1.5)
        + (COALESCE(p.comment_count, 0) * 3.0)
      ) / GREATEST(1, EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0) AS score
    FROM public.posts p
    JOIN primary_media pm ON pm.post_id = p.id AND pm.rn = 1
    JOIN qualified_courses qc ON qc.course_id = p.course_id
    WHERE p.created_at > now() - interval '14 days'
      AND p.status = 'published'
      AND COALESCE(p.like_count, 0) > 10
  ),
  pick AS (
    SELECT * FROM candidates ORDER BY score DESC LIMIT 1
  )
  SELECT
    pk.pid,
    pk.uid,
    pk.cid,
    gc.name,
    pk.caption,
    pk.poster_url,
    pk.hls_url,
    pk.duration_seconds,
    pk.format,
    up.username,
    up.display_name,
    up.avatar_url,
    COALESCE(up.is_verified, false),
    pk.lc,
    pk.cc,
    pk.created_at,
    mb.blurb
  FROM pick pk
  LEFT JOIN public.golf_courses gc ON gc.id = pk.cid
  LEFT JOIN public.user_profiles up ON up.id = pk.uid
  LEFT JOIN public.course_mood_blurbs mb
    ON mb.post_id = pk.pid
    AND mb.mood = 'watch_of_week'
    AND mb.expires_at > now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_watch_of_the_week() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. get_clip_of_the_week (short-form ≤90s)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_clip_of_the_week()
RETURNS TABLE (
  post_id uuid,
  user_id uuid,
  course_id uuid,
  course_name text,
  caption text,
  thumbnail_url text,
  hls_url text,
  duration_seconds numeric,
  username text,
  display_name text,
  avatar_url text,
  is_verified boolean,
  like_count int,
  comment_count int,
  created_at timestamptz,
  why_ai text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH primary_media AS (
    SELECT
      pm.post_id,
      pm.duration_seconds,
      pm.poster_url,
      pm.hls_url,
      ROW_NUMBER() OVER (
        PARTITION BY pm.post_id
        ORDER BY pm.display_order ASC NULLS LAST, pm.created_at ASC
      ) AS rn
    FROM public.post_media pm
    WHERE pm.media_type = 'video'
  ),
  qualified_courses AS (
    SELECT cra.course_id FROM public.course_rating_aggregates cra WHERE cra.review_count >= 5
  ),
  candidates AS (
    SELECT
      p.id AS pid, p.user_id AS uid, p.course_id AS cid, p.content AS caption,
      pm.poster_url, pm.hls_url, pm.duration_seconds,
      COALESCE(p.like_count, 0) AS lc, COALESCE(p.comment_count, 0) AS cc,
      p.created_at,
      (
        (COALESCE(p.like_count, 0) * 1.5) + (COALESCE(p.comment_count, 0) * 3.0)
      ) / GREATEST(1, EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0) AS score
    FROM public.posts p
    JOIN primary_media pm ON pm.post_id = p.id AND pm.rn = 1
    JOIN qualified_courses qc ON qc.course_id = p.course_id
    WHERE p.created_at > now() - interval '14 days'
      AND p.status = 'published'
      AND COALESCE(p.like_count, 0) > 10
      AND pm.duration_seconds <= 90
  ),
  pick AS (SELECT * FROM candidates ORDER BY score DESC LIMIT 1)
  SELECT
    pk.pid, pk.uid, pk.cid, gc.name, pk.caption, pk.poster_url, pk.hls_url,
    pk.duration_seconds, up.username, up.display_name, up.avatar_url,
    COALESCE(up.is_verified, false), pk.lc, pk.cc, pk.created_at, mb.blurb
  FROM pick pk
  LEFT JOIN public.golf_courses gc ON gc.id = pk.cid
  LEFT JOIN public.user_profiles up ON up.id = pk.uid
  LEFT JOIN public.course_mood_blurbs mb
    ON mb.post_id = pk.pid AND mb.mood = 'clip_of_week' AND mb.expires_at > now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_clip_of_the_week() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. get_video_of_the_week (long-form >90s)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_video_of_the_week()
RETURNS TABLE (
  post_id uuid,
  user_id uuid,
  course_id uuid,
  course_name text,
  caption text,
  thumbnail_url text,
  hls_url text,
  duration_seconds numeric,
  username text,
  display_name text,
  avatar_url text,
  is_verified boolean,
  like_count int,
  comment_count int,
  created_at timestamptz,
  why_ai text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH primary_media AS (
    SELECT
      pm.post_id,
      pm.duration_seconds,
      pm.poster_url,
      pm.hls_url,
      ROW_NUMBER() OVER (
        PARTITION BY pm.post_id
        ORDER BY pm.display_order ASC NULLS LAST, pm.created_at ASC
      ) AS rn
    FROM public.post_media pm
    WHERE pm.media_type = 'video'
  ),
  qualified_courses AS (
    SELECT cra.course_id FROM public.course_rating_aggregates cra WHERE cra.review_count >= 5
  ),
  candidates AS (
    SELECT
      p.id AS pid, p.user_id AS uid, p.course_id AS cid, p.content AS caption,
      pm.poster_url, pm.hls_url, pm.duration_seconds,
      COALESCE(p.like_count, 0) AS lc, COALESCE(p.comment_count, 0) AS cc,
      p.created_at,
      (
        (COALESCE(p.like_count, 0) * 1.5) + (COALESCE(p.comment_count, 0) * 3.0)
      ) / GREATEST(1, EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0) AS score
    FROM public.posts p
    JOIN primary_media pm ON pm.post_id = p.id AND pm.rn = 1
    JOIN qualified_courses qc ON qc.course_id = p.course_id
    WHERE p.created_at > now() - interval '14 days'
      AND p.status = 'published'
      AND COALESCE(p.like_count, 0) > 10
      AND pm.duration_seconds > 90
  ),
  pick AS (SELECT * FROM candidates ORDER BY score DESC LIMIT 1)
  SELECT
    pk.pid, pk.uid, pk.cid, gc.name, pk.caption, pk.poster_url, pk.hls_url,
    pk.duration_seconds, up.username, up.display_name, up.avatar_url,
    COALESCE(up.is_verified, false), pk.lc, pk.cc, pk.created_at, mb.blurb
  FROM pick pk
  LEFT JOIN public.golf_courses gc ON gc.id = pk.cid
  LEFT JOIN public.user_profiles up ON up.id = pk.uid
  LEFT JOIN public.course_mood_blurbs mb
    ON mb.post_id = pk.pid AND mb.mood = 'video_of_week' AND mb.expires_at > now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_video_of_the_week() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Most-loved this week (mixed format, with diversity at app layer)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_watch_most_loved_this_week(p_limit int DEFAULT 12)
RETURNS TABLE (
  post_id uuid,
  user_id uuid,
  course_id uuid,
  course_name text,
  caption text,
  thumbnail_url text,
  hls_url text,
  duration_seconds numeric,
  format text,
  username text,
  display_name text,
  avatar_url text,
  is_verified boolean,
  like_count int,
  comment_count int,
  created_at timestamptz,
  engagement_score numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH primary_media AS (
    SELECT
      pm.post_id,
      pm.duration_seconds,
      pm.poster_url,
      pm.hls_url,
      ROW_NUMBER() OVER (
        PARTITION BY pm.post_id
        ORDER BY pm.display_order ASC NULLS LAST, pm.created_at ASC
      ) AS rn
    FROM public.post_media pm
    WHERE pm.media_type = 'video'
  )
  SELECT
    p.id, p.user_id, p.course_id, gc.name, p.content,
    pm.poster_url, pm.hls_url, pm.duration_seconds,
    CASE WHEN pm.duration_seconds <= 90 THEN 'clip' ELSE 'video' END,
    up.username, up.display_name, up.avatar_url, COALESCE(up.is_verified, false),
    COALESCE(p.like_count, 0), COALESCE(p.comment_count, 0), p.created_at,
    (COALESCE(p.like_count, 0)::numeric + COALESCE(p.comment_count, 0) * 2.0)
  FROM public.posts p
  JOIN primary_media pm ON pm.post_id = p.id AND pm.rn = 1
  LEFT JOIN public.golf_courses gc ON gc.id = p.course_id
  LEFT JOIN public.user_profiles up ON up.id = p.user_id
  WHERE p.created_at > now() - interval '7 days'
    AND p.status = 'published'
  ORDER BY (COALESCE(p.like_count, 0)::numeric + COALESCE(p.comment_count, 0) * 2.0) DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_watch_most_loved_this_week(int) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Weekly cron — refresh editorial picks + trigger blurb generation
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trigger_watch_editorial_blurb_refresh()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record record;
BEGIN
  -- Iterate over the three picks; queue blurb generation for any post that
  -- doesn't currently have a fresh post-scoped blurb.
  FOR v_record IN
    SELECT 'watch_of_week'::text AS mood, post_id, course_id FROM public.get_watch_of_the_week()
    UNION ALL
    SELECT 'clip_of_week'::text AS mood, post_id, course_id FROM public.get_clip_of_the_week()
    UNION ALL
    SELECT 'video_of_week'::text AS mood, post_id, course_id FROM public.get_video_of_the_week()
  LOOP
    IF v_record.post_id IS NULL OR v_record.course_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Only invoke the edge fn if no fresh blurb exists yet
    IF NOT EXISTS (
      SELECT 1 FROM public.course_mood_blurbs
      WHERE post_id = v_record.post_id
        AND mood = v_record.mood
        AND expires_at > now()
    ) THEN
      PERFORM net.http_post(
        url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/generate-course-mood-blurb',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw'
        ),
        body := jsonb_build_object(
          'course_id', v_record.course_id,
          'post_id', v_record.post_id,
          'mood', v_record.mood
        )
      );
    END IF;
  END LOOP;
END;
$$;

-- Schedule weekly Monday 03:00 UTC
SELECT cron.unschedule('refresh-watch-editorial-picks-weekly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-watch-editorial-picks-weekly');

SELECT cron.schedule(
  'refresh-watch-editorial-picks-weekly',
  '0 3 * * 1',
  $cron$ SELECT public.trigger_watch_editorial_blurb_refresh(); $cron$
);
