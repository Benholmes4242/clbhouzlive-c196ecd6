
DROP FUNCTION IF EXISTS public.get_watch_mixed_grid(uuid, text, integer, timestamp with time zone, uuid[], text, uuid);

CREATE OR REPLACE FUNCTION public.get_watch_mixed_grid(
  p_user_id uuid,
  p_filter text DEFAULT 'all'::text,
  p_page_size integer DEFAULT 20,
  p_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_seen_ids uuid[] DEFAULT '{}'::uuid[],
  p_viewer_actor_type text DEFAULT 'personal'::text,
  p_viewer_actor_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  post_id uuid, post_content text, post_created_at timestamp with time zone,
  derived_format text, media_url text, poster_url text, hls_url text, stream_id text,
  duration_seconds numeric, width integer, height integer,
  creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean,
  business_name text, business_logo_url text,
  like_count bigint, comment_count bigint,
  course_id uuid, course_name text,
  is_liked_by_me boolean,
  post_user_id uuid, post_actor_type text, post_actor_id uuid,
  is_followed_by_me boolean,
  source_review_id uuid,
  review_rating numeric,
  review_course_id uuid, review_course_name text, review_course_image text,
  review_course_region text, review_course_country text, review_course_sub_country text,
  review_text text,
  review_design_score numeric, review_condition_score numeric,
  review_facilities_score numeric, review_clubhouse_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_viewer_actor_type TEXT := COALESCE(p_viewer_actor_type, 'personal');
  v_viewer_actor_id UUID := COALESCE(p_viewer_actor_id, p_user_id);
  v_filter TEXT := COALESCE(NULLIF(p_filter, ''), 'all');
  v_video_quota INT := GREATEST(1, p_page_size / 5);
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
  my_played_courses AS (
    SELECT DISTINCT uca.course_id AS cid
    FROM user_course_activity uca
    WHERE uca.user_id = p_user_id AND uca.has_played = true
  ),
  my_bucket_courses AS (
    SELECT DISTINCT cs.course_id AS cid
    FROM course_shortlists cs
    WHERE cs.user_id = p_user_id AND cs.list_key = 'want_to_play'
  ),
  base AS (
    SELECT
      p.id AS c_post_id,
      p.content AS c_content,
      p.created_at AS c_created_at,
      pm1.derived_format AS c_format,
      pm1.media_url AS c_media_url,
      pm1.poster_url AS c_poster_url,
      pm1.hls_url AS c_hls_url,
      pm1.stream_id AS c_stream_id,
      pm1.duration_seconds AS c_duration,
      pm1.width AS c_width,
      pm1.height AS c_height,
      up.username AS c_username,
      up.display_name AS c_display_name,
      up.profile_photo_url AS c_avatar,
      COALESCE(up.is_verified, FALSE) AS c_verified,
      ba.name AS c_business_name,
      ba.logo_url AS c_business_logo,
      COALESCE(plc.cnt, 0) AS c_like_count,
      COALESCE(pcc.cnt, 0) AS c_comment_count,
      gc.id AS c_course_id,
      gc.name AS c_course_name,
      CASE WHEN ml.actor_id IS NOT NULL THEN TRUE ELSE FALSE END AS c_liked_by_me,
      p.user_id AS c_user_id,
      COALESCE(p.actor_type, 'personal') AS c_actor_type,
      COALESCE(p.actor_id, p.user_id) AS c_actor_id,
      p.source_review_id AS c_source_review_id,
      cr.rating AS c_review_rating,
      cr.course_id AS c_review_course_id,
      gc_review.name AS c_review_course_name,
      gc_review.thumbnail_image AS c_review_course_image,
      gc_review.region AS c_review_course_region,
      gc_review.country AS c_review_course_country,
      gc_review.sub_country AS c_review_course_sub_country,
      cr.review AS c_review_text,
      cr.design_score AS c_review_design_score,
      cr.condition_score AS c_review_condition_score,
      cr.facilities_score AS c_review_facilities_score,
      cr.clubhouse_score AS c_review_clubhouse_score,
      GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600, 0.1) AS hours_old
    FROM posts p
    INNER JOIN LATERAL (
      SELECT pm.derived_format, pm.media_url, pm.poster_url, pm.hls_url,
             pm.stream_id, pm.duration_seconds, pm.width, pm.height
      FROM post_media pm
      WHERE pm.post_id = p.id
        AND pm.media_type = 'video'
        AND pm.processing_status = 'complete'
        AND pm.derived_format IN ('clip', 'video')
      ORDER BY pm.display_order ASC
      LIMIT 1
    ) pm1 ON TRUE
    LEFT JOIN user_profiles up ON up.id = p.user_id
    LEFT JOIN business_accounts ba ON ba.id = p.actor_id AND p.actor_type = 'business'
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes lk WHERE lk.post_id = p.id) plc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM comments_v2 cm WHERE cm.target_type = 'post' AND cm.target_id = p.id) pcc ON TRUE
    LEFT JOIN blocked_users bu ON bu.uid = p.user_id
    LEFT JOIN dismissed d ON d.pid = p.id
    LEFT JOIN post_likes ml ON ml.post_id = p.id AND ml.actor_type = v_viewer_actor_type AND ml.actor_id = v_viewer_actor_id
    LEFT JOIN course_ratings cr ON cr.id = p.source_review_id
    LEFT JOIN golf_courses gc_review ON gc_review.id = cr.course_id
    LEFT JOIN golf_courses gc ON gc.id = COALESCE(cr.course_id, p.course_id)
    WHERE p.status = 'published'
      AND bu.uid IS NULL
      AND d.pid IS NULL
      AND (p_cursor IS NULL OR p.created_at < p_cursor)
      AND NOT (p.id = ANY(p_seen_ids))
      AND (
        v_filter = 'all'
        OR v_filter = 'trending'
        OR (v_filter = 'played' AND COALESCE(cr.course_id, p.course_id) IN (SELECT cid FROM my_played_courses))
        OR (v_filter = 'bucket_list' AND COALESCE(cr.course_id, p.course_id) IN (SELECT cid FROM my_bucket_courses))
      )
  ),
  clip_window AS (
    SELECT * FROM base WHERE c_format = 'clip'
    ORDER BY c_created_at DESC
    LIMIT p_page_size * 3
  ),
  video_window AS (
    SELECT * FROM base WHERE c_format = 'video'
    ORDER BY c_created_at DESC
    LIMIT p_page_size
  ),
  scored AS (
    SELECT c.*,
      CASE
        WHEN v_filter = 'trending' THEN
          ((c.c_like_count * 1.0 + c.c_comment_count * 2.5) / c.hours_old)
          * CASE WHEN c.hours_old < 6 THEN 2.0 * (1.0 - c.hours_old / 6.0) ELSE 1.0 END
        ELSE EXTRACT(EPOCH FROM c.c_created_at)
      END AS score
    FROM (SELECT * FROM clip_window UNION ALL SELECT * FROM video_window) c
  ),
  ranked AS (
    SELECT s.*,
      ROW_NUMBER() OVER (PARTITION BY s.c_format ORDER BY s.score DESC) AS fmt_rank
    FROM scored s
  ),
  picked_videos AS (
    SELECT * FROM ranked WHERE c_format = 'video' AND fmt_rank <= v_video_quota
  ),
  picked_clips AS (
    SELECT * FROM ranked WHERE c_format = 'clip'
      AND fmt_rank <= p_page_size - (SELECT COUNT(*) FROM picked_videos)
  ),
  page AS (
    SELECT pc.*,
      (pc.fmt_rank + ((pc.fmt_rank - 1) / 4))::int AS display_slot
    FROM picked_clips pc
    UNION ALL
    SELECT pv.*,
      (pv.fmt_rank * 5)::int AS display_slot
    FROM picked_videos pv
  )
  SELECT
    pg.c_post_id, pg.c_content, pg.c_created_at,
    pg.c_format, pg.c_media_url, pg.c_poster_url, pg.c_hls_url, pg.c_stream_id,
    pg.c_duration, pg.c_width, pg.c_height,
    pg.c_username, pg.c_display_name, pg.c_avatar, pg.c_verified,
    pg.c_business_name, pg.c_business_logo,
    pg.c_like_count, pg.c_comment_count,
    pg.c_course_id, pg.c_course_name,
    pg.c_liked_by_me,
    pg.c_user_id,
    pg.c_actor_type,
    pg.c_actor_id,
    public.is_following_actor_v2(v_viewer_actor_type, v_viewer_actor_id,
      pg.c_actor_type, pg.c_actor_id, pg.c_user_id) AS is_followed_by_me,
    pg.c_source_review_id,
    pg.c_review_rating,
    pg.c_review_course_id,
    pg.c_review_course_name,
    pg.c_review_course_image,
    pg.c_review_course_region,
    pg.c_review_course_country,
    pg.c_review_course_sub_country,
    pg.c_review_text,
    pg.c_review_design_score,
    pg.c_review_condition_score,
    pg.c_review_facilities_score,
    pg.c_review_clubhouse_score
  FROM page pg
  ORDER BY pg.display_slot ASC, pg.c_format ASC;
END;
$function$;
