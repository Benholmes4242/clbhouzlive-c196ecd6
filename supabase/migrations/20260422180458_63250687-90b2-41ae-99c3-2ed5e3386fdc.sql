-- Phase 1.5: Extend Pro Shop RPCs with optional p_mood param.
-- Moods: for_you (default), played_courses, follows, trending, tour_week (defer → for_you).

-- 1. get_watch_of_the_week
CREATE OR REPLACE FUNCTION public.get_watch_of_the_week(p_user_id uuid DEFAULT NULL, p_mood text DEFAULT 'for_you')
 RETURNS TABLE(post_id uuid, user_id uuid, course_id uuid, course_name text, caption text, thumbnail_url text, hls_url text, duration_seconds numeric, format text, username text, display_name text, avatar_url text, is_verified boolean, like_count integer, comment_count integer, created_at timestamp with time zone, why_ai text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mood text := COALESCE(NULLIF(p_mood, ''), 'for_you');
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
  played AS (
    SELECT DISTINCT uca.course_id
    FROM public.user_course_activity uca
    WHERE p_user_id IS NOT NULL
      AND uca.user_id = p_user_id
      AND uca.has_played = true
      AND uca.course_id IS NOT NULL
  ),
  follows AS (
    SELECT uf.following_id
    FROM public.user_follows uf
    WHERE p_user_id IS NOT NULL AND uf.follower_id = p_user_id
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
      p.created_at,
      (
        (COALESCE(p.like_count, 0) * 1.5)
        + (COALESCE(p.comment_count, 0) * 3.0)
      ) / GREATEST(1, EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0) AS score,
      (COALESCE(p.like_count, 0)::numeric + COALESCE(p.comment_count, 0) * 2.0) AS engagement_7d
    FROM public.posts p
    JOIN primary_media pm ON pm.post_id = p.id AND pm.rn = 1
    JOIN qualified_courses qc ON qc.course_id = p.course_id
    WHERE p.created_at > now() - interval '14 days'
      AND p.status = 'published'
      AND COALESCE(p.like_count, 0) > 10
      AND (
        v_mood NOT IN ('played_courses')
        OR p.course_id IN (SELECT course_id FROM played)
      )
      AND (
        v_mood NOT IN ('follows')
        OR p.user_id IN (SELECT following_id FROM follows)
      )
  ),
  pick AS (
    SELECT * FROM candidates
    ORDER BY
      CASE WHEN v_mood = 'trending' THEN engagement_7d ELSE score END DESC
    LIMIT 1
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
$function$;

-- 2. get_user_course_anchored_content
CREATE OR REPLACE FUNCTION public.get_user_course_anchored_content(p_user_id uuid, p_limit_per_course integer DEFAULT 4, p_mood text DEFAULT 'for_you')
 RETURNS TABLE(course_id uuid, course_name text, course_country text, content_count integer, recent_post_ids uuid[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mood text := COALESCE(NULLIF(p_mood, ''), 'for_you');
BEGIN
  -- This rail is intrinsically about played courses. Hide for moods that
  -- don't make sense (follows, trending, tour_week) by returning empty.
  IF v_mood IN ('follows', 'trending', 'tour_week') THEN
    RETURN;
  END IF;

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
$function$;

-- 3. get_watch_most_loved_this_week
CREATE OR REPLACE FUNCTION public.get_watch_most_loved_this_week(p_limit integer DEFAULT 12, p_user_id uuid DEFAULT NULL, p_mood text DEFAULT 'for_you')
 RETURNS TABLE(post_id uuid, user_id uuid, course_id uuid, course_name text, caption text, thumbnail_url text, hls_url text, duration_seconds numeric, format text, username text, display_name text, avatar_url text, is_verified boolean, like_count integer, comment_count integer, created_at timestamp with time zone, engagement_score numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mood text := COALESCE(NULLIF(p_mood, ''), 'for_you');
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
  played AS (
    SELECT DISTINCT uca.course_id
    FROM public.user_course_activity uca
    WHERE p_user_id IS NOT NULL
      AND uca.user_id = p_user_id
      AND uca.has_played = true
      AND uca.course_id IS NOT NULL
  ),
  follows AS (
    SELECT uf.following_id
    FROM public.user_follows uf
    WHERE p_user_id IS NOT NULL AND uf.follower_id = p_user_id
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
    AND (
      v_mood NOT IN ('played_courses')
      OR p.course_id IN (SELECT course_id FROM played)
    )
    AND (
      v_mood NOT IN ('follows')
      OR p.user_id IN (SELECT following_id FROM follows)
    )
  ORDER BY (COALESCE(p.like_count, 0)::numeric + COALESCE(p.comment_count, 0) * 2.0) DESC
  LIMIT p_limit;
END;
$function$;