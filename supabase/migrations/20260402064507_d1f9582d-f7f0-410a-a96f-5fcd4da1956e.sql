
DROP FUNCTION IF EXISTS public.get_suggested_feed(uuid, integer, text, uuid[], text);

CREATE OR REPLACE FUNCTION public.get_suggested_feed(
  p_user_id uuid,
  p_page_size integer DEFAULT 10,
  p_cursor text DEFAULT NULL,
  p_seen_post_ids uuid[] DEFAULT '{}',
  p_mode text DEFAULT 'suggested'
)
RETURNS TABLE(
  post_id uuid,
  post_content text,
  post_created_at timestamptz,
  post_user_id uuid,
  post_actor_type text,
  post_actor_id uuid,
  post_status text,
  source_review_id uuid,
  media_id uuid,
  media_type text,
  media_url text,
  poster_url text,
  stream_id text,
  duration_seconds numeric,
  width integer,
  height integer,
  display_order integer,
  creator_username text,
  creator_display_name text,
  creator_avatar_url text,
  creator_is_verified boolean,
  business_name text,
  business_logo_url text,
  business_is_verified boolean,
  like_count bigint,
  comment_count bigint,
  share_count bigint,
  review_rating numeric,
  review_course_id uuid,
  review_course_name text,
  review_course_image text,
  review_course_region text,
  review_course_country text,
  review_course_sub_country text,
  creator_relation text,
  is_liked_by_me boolean,
  is_followed_by_me boolean,
  engagement_score numeric,
  post_type text,
  tournament_meta jsonb,
  review_text text,
  post_tags jsonb,
  course_id uuid,
  course_name text
)
LANGUAGE plpgsql STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  v_cursor_ts timestamptz;
  v_mode text := COALESCE(p_mode, 'suggested');
  v_page_size integer := LEAST(COALESCE(p_page_size, 10), 100);
BEGIN
  IF p_cursor IS NOT NULL THEN
    v_cursor_ts := p_cursor::timestamptz;
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT
      p.id, p.created_at, p.content, p.course_id,
      p.like_count, p.comment_count, p.is_pinned,
      p.user_id AS p_uid, p.actor_type, p.actor_id,
      p.source_review_id, p.post_type, p.status
    FROM posts p
    WHERE p.visibility = 'anyone'
      AND p.status = 'published'
      AND p.user_id <> p_user_id
      AND p.created_at > NOW() - INTERVAL '60 days'
      AND (v_cursor_ts IS NULL OR p.created_at < v_cursor_ts)
      AND p.id <> ALL(p_seen_post_ids)
      AND (
        p.source_review_id IS NULL
        OR EXISTS (SELECT 1 FROM post_media pm2 WHERE pm2.post_id = p.id)
      )
    ORDER BY RANDOM()
    LIMIT v_page_size * 6
  ),
  scored AS (
    SELECT
      c.*,
      CASE
        WHEN v_mode = 'popular' THEN
          (COALESCE(c.like_count, 0) * 1.0 + COALESCE(c.comment_count, 0) * 2.5)
          / (1.0 + EXTRACT(EPOCH FROM (now() - c.created_at)) / 86400.0)
        ELSE
          (COALESCE(c.like_count, 0) * 3.0 + COALESCE(c.comment_count, 0) * 5.0)
          * EXP(-0.08 * EXTRACT(EPOCH FROM (now() - c.created_at)) / 86400.0)
      END AS calc_score
    FROM candidates c
  ),
  filtered AS (
    SELECT * FROM scored
    ORDER BY calc_score DESC
    LIMIT v_page_size * 4
  ),
  top_post_ids AS (
    SELECT f.id
    FROM filtered f
    ORDER BY f.calc_score DESC
    LIMIT v_page_size
  ),
  with_media AS (
    SELECT
      s.id                                                          AS wm_post_id,
      s.content                                                     AS wm_post_content,
      s.created_at                                                  AS wm_post_created_at,
      s.p_uid                                                       AS wm_post_user_id,
      s.actor_type                                                  AS wm_post_actor_type,
      s.actor_id                                                    AS wm_post_actor_id,
      s.status                                                      AS wm_post_status,
      s.source_review_id                                            AS wm_source_review_id,
      pm.id                                                         AS wm_media_id,
      pm.media_type                                                 AS wm_media_type,
      pm.media_url                                                  AS wm_media_url,
      pm.poster_url                                                 AS wm_poster_url,
      NULL::text                                                    AS wm_stream_id,
      pm.duration_ms::numeric / 1000.0                             AS wm_duration_seconds,
      pm.width                                                      AS wm_width,
      pm.height                                                     AS wm_height,
      pm.display_order                                              AS wm_display_order,
      up.username                                                   AS wm_creator_username,
      up.display_name                                               AS wm_creator_display_name,
      up.profile_photo_url                                          AS wm_creator_avatar_url,
      COALESCE(up.is_verified, FALSE)                               AS wm_creator_is_verified,
      ba.name                                                       AS wm_business_name,
      ba.logo_url                                                   AS wm_business_logo_url,
      COALESCE(ba.is_verified, FALSE)                               AS wm_business_is_verified,
      COALESCE(s.like_count, 0)::bigint                             AS wm_like_count,
      COALESCE(s.comment_count, 0)::bigint                          AS wm_comment_count,
      0::bigint                                                     AS wm_share_count,
      cr.rating                                                     AS wm_review_rating,
      cr.course_id                                                  AS wm_review_course_id,
      COALESCE(gc_review.name, gc_course.name)                      AS wm_review_course_name,
      COALESCE(gc_review.thumbnail_image, gc_course.thumbnail_image) AS wm_review_course_image,
      COALESCE(gc_review.region, gc_course.region)                  AS wm_review_course_region,
      COALESCE(gc_review.country, gc_course.country)                AS wm_review_course_country,
      COALESCE(gc_review.sub_country, gc_course.sub_country)        AS wm_review_course_sub_country,
      CASE
        WHEN EXISTS (SELECT 1 FROM user_friends uf WHERE
          (uf.user_id = p_user_id AND uf.friend_id = s.p_uid) OR
          (uf.friend_id = p_user_id AND uf.user_id = s.p_uid)
        ) THEN 'friend'
        WHEN EXISTS (SELECT 1 FROM user_follows ufo WHERE ufo.follower_id = p_user_id AND ufo.following_id = s.p_uid) THEN 'following'
        ELSE 'none'
      END::text                                                     AS wm_creator_relation,
      EXISTS (
        SELECT 1 FROM post_likes pl
        WHERE pl.post_id = s.id AND pl.user_id = p_user_id
      )                                                             AS wm_is_liked_by_me,
      EXISTS (
        SELECT 1 FROM user_follows uf
        WHERE uf.follower_id = p_user_id AND uf.following_id = s.p_uid
      )                                                             AS wm_is_followed_by_me,
      s.calc_score                                                  AS wm_engagement_score,
      COALESCE(s.post_type, 'post')                                 AS wm_post_type,
      NULL::jsonb                                                   AS wm_tournament_meta,
      cr.review                                                     AS wm_review_text,
      (
        SELECT jsonb_agg(jsonb_build_object(
          'tagged_entity_id', pt.tagged_entity_id,
          'tagged_entity_type', te.entity_type,
          'display_name', te.name,
          'slug', te.slug,
          'username', te.username
        ))
        FROM post_tags pt
        JOIN taggable_entities te ON te.id = pt.tagged_entity_id
        WHERE pt.post_id = s.id
          AND te.entity_type IN ('user', 'business', 'golf_club')
      )                                                             AS wm_post_tags,
      gc_course.id                                                  AS wm_course_id,
      gc_course.name                                                AS wm_course_name
    FROM scored s
    INNER JOIN top_post_ids tpi ON tpi.id = s.id
    LEFT JOIN user_profiles up ON up.id = s.p_uid
    LEFT JOIN business_accounts ba ON s.actor_type = 'business' AND ba.id = s.actor_id
    LEFT JOIN post_media pm ON pm.post_id = s.id
    LEFT JOIN course_ratings cr ON s.source_review_id IS NOT NULL AND cr.id = s.source_review_id
    LEFT JOIN golf_courses gc_review ON cr.course_id IS NOT NULL AND gc_review.id = cr.course_id
    LEFT JOIN golf_courses gc_course ON s.course_id IS NOT NULL AND gc_course.id = s.course_id
  )
  SELECT
    wm.wm_post_id, wm.wm_post_content, wm.wm_post_created_at,
    wm.wm_post_user_id, wm.wm_post_actor_type, wm.wm_post_actor_id,
    wm.wm_post_status, wm.wm_source_review_id, wm.wm_media_id,
    wm.wm_media_type, wm.wm_media_url, wm.wm_poster_url, wm.wm_stream_id,
    wm.wm_duration_seconds, wm.wm_width, wm.wm_height, wm.wm_display_order,
    wm.wm_creator_username, wm.wm_creator_display_name, wm.wm_creator_avatar_url,
    wm.wm_creator_is_verified, wm.wm_business_name, wm.wm_business_logo_url,
    wm.wm_business_is_verified, wm.wm_like_count, wm.wm_comment_count,
    wm.wm_share_count, wm.wm_review_rating, wm.wm_review_course_id,
    wm.wm_review_course_name, wm.wm_review_course_image, wm.wm_review_course_region,
    wm.wm_review_course_country, wm.wm_review_course_sub_country,
    wm.wm_creator_relation, wm.wm_is_liked_by_me, wm.wm_is_followed_by_me,
    wm.wm_engagement_score, wm.wm_post_type, wm.wm_tournament_meta,
    wm.wm_review_text, wm.wm_post_tags,
    wm.wm_course_id, wm.wm_course_name
  FROM with_media wm
  ORDER BY
    wm.wm_engagement_score DESC NULLS LAST,
    wm.wm_display_order ASC;
END;
$function$;
