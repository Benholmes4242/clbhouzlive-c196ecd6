
-- =====================================================================
-- 1) get_watch_shorts: add p_max_duration (NULL = unchanged behaviour)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_watch_shorts(
  p_user_id uuid,
  p_mode text DEFAULT 'trending'::text,
  p_page_size integer DEFAULT 30,
  p_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_seen_ids uuid[] DEFAULT '{}'::uuid[],
  p_search_query text DEFAULT NULL::text,
  p_user_lat double precision DEFAULT NULL::double precision,
  p_user_lng double precision DEFAULT NULL::double precision,
  p_category text DEFAULT NULL::text,
  p_max_duration integer DEFAULT NULL::integer
)
 RETURNS TABLE(post_id uuid, post_content text, post_created_at timestamp with time zone, post_user_id uuid, post_actor_type text, post_actor_id uuid, post_status text, source_review_id uuid, media_id uuid, media_type text, media_url text, poster_url text, stream_id text, duration_seconds numeric, width integer, height integer, display_order integer, creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean, business_name text, business_logo_url text, business_is_verified boolean, like_count bigint, comment_count bigint, share_count bigint, review_rating numeric, review_course_id uuid, review_course_name text, review_course_image text, course_region text, course_country text, creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_max_duration INT := COALESCE(p_max_duration, 180);
BEGIN
  RETURN QUERY
  WITH
  blocked_users AS (
    SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id = p_user_id
    UNION SELECT blocker_id AS uid FROM user_blocks WHERE blocked_id = p_user_id
  ),
  dismissed AS (
    SELECT pd.post_id AS pid FROM post_dismissals pd WHERE pd.user_id = p_user_id
  ),
  creator_dismissals AS (
    SELECT p2.user_id AS creator_uid, COUNT(*)::int AS dismiss_count
    FROM post_dismissals pd
    INNER JOIN posts p2 ON p2.id = pd.post_id
    WHERE pd.user_id = p_user_id
    GROUP BY p2.user_id
  ),
  my_follows AS (
    SELECT following_id AS uid FROM user_follows WHERE follower_id = p_user_id
  ),
  my_friends AS (
    SELECT friend_id AS uid FROM user_friends WHERE user_id = p_user_id AND status = 'accepted'
    UNION SELECT user_id AS uid FROM user_friends WHERE friend_id = p_user_id AND status = 'accepted'
  ),
  my_business_follows AS (
    SELECT business_id AS bid FROM business_follows WHERE follower_id = p_user_id
  ),
  candidates AS (
    SELECT
      p.id AS p_id, p.content AS p_content, p.created_at AS p_created_at,
      p.user_id AS p_user_id, p.actor_type AS p_actor_type, p.actor_id AS p_actor_id,
      p.status AS p_status, p.source_review_id AS p_source_review_id,
      pm.id AS pm_id, pm.media_type AS pm_media_type, pm.media_url AS pm_media_url,
      pm.poster_url AS pm_poster_url, pm.stream_id AS pm_stream_id,
      pm.duration_seconds AS pm_duration, pm.width AS pm_width, pm.height AS pm_height,
      pm.display_order AS pm_display_order,
      COALESCE(plc.cnt, 0) AS p_like_count,
      COALESCE(pcc.cnt, 0) AS p_comment_count,
      COALESCE(psc.cnt, 0) AS p_share_count,
      cr.rating AS p_review_rating, gc.id AS p_review_course_id,
      gc.name AS p_review_course_name, gc.thumbnail_image AS p_review_course_image,
      gc.region AS p_course_region, gc.country AS p_course_country,
      up.username AS p_creator_username, up.display_name AS p_creator_display_name,
      up.profile_photo_url AS p_creator_avatar,
      COALESCE(up.is_verified, FALSE) AS p_creator_verified,
      ba.name AS p_business_name, ba.logo_url AS p_business_logo,
      COALESCE(ba.is_verified, FALSE) AS p_business_verified,
      CASE
        WHEN mfr.uid IS NOT NULL THEN 'friend'
        WHEN mfl.uid IS NOT NULL THEN 'following'
        WHEN mbf.bid IS NOT NULL AND p.actor_type = 'business' THEN 'following'
        ELSE 'none'
      END AS p_relation,
      CASE WHEN ml.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS p_liked_by_me,
      CASE
        WHEN mfl.uid IS NOT NULL THEN TRUE
        WHEN mbf.bid IS NOT NULL AND p.actor_type = 'business' THEN TRUE
        ELSE FALSE
      END AS p_followed_by_me,
      GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600, 0.1) AS hours_old,
      CASE
        WHEN COALESCE(cd.dismiss_count, 0) >= 3 THEN 0.40
        WHEN COALESCE(cd.dismiss_count, 0) = 2  THEN 0.70
        ELSE 1.00
      END AS creator_deprio,
      (1.0 + 0.10 * (LEAST(GREATEST(COALESCE(cqs.quality_score, 0), 0), 50) / 50.0 - 0.5)) AS creator_quality_factor
    FROM posts p
    INNER JOIN post_media pm ON pm.post_id = p.id
    LEFT JOIN user_profiles up ON up.id = p.user_id
    LEFT JOIN business_accounts ba ON ba.id = p.actor_id AND p.actor_type = 'business'
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes lk WHERE lk.post_id = p.id) plc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments cm WHERE cm.post_id = p.id) pcc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares sh WHERE sh.post_id = p.id) psc ON TRUE
    LEFT JOIN my_friends mfr ON mfr.uid = p.user_id
    LEFT JOIN my_follows mfl ON mfl.uid = p.user_id
    LEFT JOIN my_business_follows mbf ON mbf.bid = p.actor_id AND p.actor_type = 'business'
    LEFT JOIN blocked_users bu ON bu.uid = p.user_id
    LEFT JOIN dismissed d ON d.pid = p.id
    LEFT JOIN post_likes ml ON ml.post_id = p.id AND ml.user_id = p_user_id
    LEFT JOIN course_ratings cr ON cr.id = p.source_review_id
    LEFT JOIN golf_courses gc ON gc.id = COALESCE(cr.course_id, p.course_id)
    LEFT JOIN creator_dismissals cd ON cd.creator_uid = p.user_id
    LEFT JOIN creator_quality_scores cqs ON cqs.user_id = p.user_id
    WHERE p.status = 'published'
      AND bu.uid IS NULL
      AND d.pid IS NULL
      AND pm.media_type = 'video'
      AND pm.duration_seconds IS NOT NULL
      AND pm.duration_seconds <= v_max_duration
      AND (p_cursor IS NULL OR p.created_at < p_cursor)
      AND NOT (p.id = ANY(p_seen_ids))
      AND (
        p_search_query IS NULL
        OR p.content ILIKE '%' || p_search_query || '%'
        OR gc.name ILIKE '%' || p_search_query || '%'
        OR up.display_name ILIKE '%' || p_search_query || '%'
        OR up.username ILIKE '%' || p_search_query || '%'
      )
      AND p.created_at > NOW() - INTERVAL '365 days'
      AND (
        p_mode != 'near'
        OR (
          p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL
          AND gc.latitude IS NOT NULL AND gc.longitude IS NOT NULL
          AND gc.latitude BETWEEN (p_user_lat - 0.45) AND (p_user_lat + 0.45)
          AND gc.longitude BETWEEN (p_user_lng - 0.6) AND (p_user_lng + 0.6)
        )
      )
      AND (p_category IS NULL OR p.post_categories @> ARRAY[p_category])
    ORDER BY p.created_at DESC
    LIMIT p_page_size * 3
  ),
  scored AS (
    SELECT c.*,
      CASE
        WHEN c.pm_duration BETWEEN 8 AND 180 THEN 1.00
        WHEN c.pm_duration BETWEEN 4 AND 7   THEN 0.50
        WHEN c.pm_duration BETWEEN 181 AND 300 THEN 0.50
        WHEN c.pm_duration < 4                THEN 0.20
        ELSE 0.20
      END AS duration_quality,
      CASE p_mode
        WHEN 'trending' THEN
          ((c.p_like_count * 1.0 + c.p_comment_count * 2.5 + c.p_share_count * 3.0) / c.hours_old)
          * CASE WHEN c.hours_old < 6 THEN 2.0 * (1.0 - c.hours_old / 6.0) ELSE 1.0 END
        WHEN 'latest' THEN EXTRACT(EPOCH FROM c.p_created_at)
        WHEN 'top' THEN
          (c.p_like_count * 1.0 + c.p_comment_count * 2.5 + c.p_share_count * 3.0)
          * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - c.p_created_at)) / 86400 / 30)
        WHEN 'near' THEN EXTRACT(EPOCH FROM c.p_created_at)
        ELSE 0
      END AS base_score
    FROM candidates c
  ),
  scored_final AS (
    SELECT s.*,
      CASE p_mode
        WHEN 'trending' THEN s.base_score * s.duration_quality * s.creator_deprio * s.creator_quality_factor
        WHEN 'top'      THEN s.base_score * s.duration_quality * s.creator_deprio * s.creator_quality_factor
        ELSE s.base_score * s.creator_deprio
      END AS score
    FROM scored s
  ),
  filtered AS (
    SELECT * FROM scored_final
    ORDER BY score DESC
    LIMIT p_page_size
  )
  SELECT
    f.p_id, f.p_content, f.p_created_at, f.p_user_id, f.p_actor_type, f.p_actor_id,
    f.p_status, f.p_source_review_id,
    f.pm_id, f.pm_media_type, f.pm_media_url, f.pm_poster_url, f.pm_stream_id,
    f.pm_duration, f.pm_width, f.pm_height, f.pm_display_order,
    f.p_creator_username, f.p_creator_display_name, f.p_creator_avatar, f.p_creator_verified,
    f.p_business_name, f.p_business_logo, f.p_business_verified,
    f.p_like_count, f.p_comment_count, f.p_share_count,
    f.p_review_rating, f.p_review_course_id, f.p_review_course_name, f.p_review_course_image,
    f.p_course_region, f.p_course_country,
    f.p_relation, f.p_liked_by_me, f.p_followed_by_me,
    f.score
  FROM filtered f
  ORDER BY f.score DESC;
END;
$function$;


-- =====================================================================
-- 2) get_user_course_anchored_content: add p_format ('clip'|'video'|NULL)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_user_course_anchored_content(
  p_user_id uuid,
  p_limit_per_course integer DEFAULT 4,
  p_mood text DEFAULT 'for_you'::text,
  p_format text DEFAULT NULL::text
)
 RETURNS TABLE(course_id uuid, course_name text, course_country text, content_count integer, recent_post_ids uuid[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mood text := COALESCE(NULLIF(p_mood, ''), 'for_you');
  v_format text := NULLIF(p_format, '');
BEGIN
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
      AND (
        v_format IS NULL
        OR (v_format = 'clip'  AND pm.duration_seconds <= 90)
        OR (v_format = 'video' AND pm.duration_seconds >  90)
      )
  ),
  agg AS (
    SELECT
      cp.course_id,
      COUNT(*)::int AS total,
      array_agg(cp.post_id ORDER BY cp.created_at DESC) FILTER (WHERE cp.post_rn <= p_limit_per_course) AS post_ids
    FROM course_posts cp
    GROUP BY cp.course_id
    HAVING COUNT(*) >= 2
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


-- =====================================================================
-- 3) get_watch_most_loved_this_week: add p_format + p_window
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_watch_most_loved_this_week(
  p_limit integer DEFAULT 12,
  p_user_id uuid DEFAULT NULL::uuid,
  p_mood text DEFAULT 'for_you'::text,
  p_format text DEFAULT NULL::text,
  p_window text DEFAULT 'week'::text
)
 RETURNS TABLE(post_id uuid, user_id uuid, course_id uuid, course_name text, caption text, thumbnail_url text, hls_url text, duration_seconds numeric, format text, username text, display_name text, avatar_url text, is_verified boolean, like_count integer, comment_count integer, created_at timestamp with time zone, engagement_score numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mood text := COALESCE(NULLIF(p_mood, ''), 'for_you');
  v_format text := NULLIF(p_format, '');
  v_interval interval := CASE WHEN COALESCE(p_window, 'week') = 'month' THEN interval '30 days' ELSE interval '7 days' END;
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
  WHERE p.created_at > now() - v_interval
    AND p.status = 'published'
    AND (
      v_format IS NULL
      OR (v_format = 'clip'  AND pm.duration_seconds <= 90)
      OR (v_format = 'video' AND pm.duration_seconds >  90)
    )
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
