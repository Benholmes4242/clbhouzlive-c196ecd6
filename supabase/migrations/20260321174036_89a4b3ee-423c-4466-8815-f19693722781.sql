DROP FUNCTION IF EXISTS public.get_suggested_feed(uuid, integer, text, uuid[], text);

CREATE OR REPLACE FUNCTION public.get_suggested_feed(
  p_user_id uuid,
  p_page_size integer DEFAULT 10,
  p_cursor text DEFAULT NULL,
  p_seen_post_ids uuid[] DEFAULT '{}'::uuid[],
  p_mode text DEFAULT 'suggested'
)
RETURNS TABLE (
  post_id uuid,
  post_type text,
  post_created_at timestamptz,
  post_caption text,
  post_location text,
  post_like_count integer,
  post_comment_count integer,
  post_share_count integer,
  post_is_pinned boolean,
  post_hashtags text[],
  user_id uuid,
  user_name text,
  user_username text,
  user_avatar_url text,
  user_handicap numeric,
  user_home_club text,
  user_is_verified boolean,
  actor_type text,
  actor_id text,
  business_name text,
  business_logo_url text,
  business_slug text,
  business_is_verified boolean,
  media_id uuid,
  media_url text,
  media_type text,
  media_width integer,
  media_height integer,
  media_display_order integer,
  media_thumbnail_url text,
  media_duration_ms integer,
  source_review_id uuid,
  review_rating numeric,
  review_course_name text,
  review_course_id uuid,
  review_course_image text,
  review_course_region text,
  review_course_country text,
  review_course_sub_country text,
  review_text text,
  course_id uuid,
  course_name text,
  course_club_name text,
  score numeric,
  post_tags jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $function$
DECLARE
  v_cursor_ts timestamptz;
  v_mode text := COALESCE(p_mode, 'suggested');
  v_page_size integer := LEAST(COALESCE(p_page_size, 10), 50);
BEGIN
  IF p_cursor IS NOT NULL THEN
    v_cursor_ts := p_cursor::timestamptz;
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT
      p.id,
      p.created_at,
      p.caption,
      p.location,
      p.like_count,
      p.comment_count,
      p.share_count,
      p.is_pinned,
      p.hashtags,
      p.user_id AS p_uid,
      p.actor_type,
      p.actor_id,
      p.source_review_id,
      p.course_id
    FROM posts p
    WHERE p.visibility = 'public'
      AND p.is_deleted = false
      AND (v_cursor_ts IS NULL OR p.created_at < v_cursor_ts)
      AND p.id <> ALL(p_seen_post_ids)
    ORDER BY p.created_at DESC
    LIMIT v_page_size * 15
  ),
  scored AS (
    SELECT
      c.*,
      CASE
        WHEN v_mode = 'popular' THEN
          (
            COALESCE(c.like_count, 0) * 1.0
            + COALESCE(c.comment_count, 0) * 2.5
            + COALESCE(c.share_count, 0) * 3.0
          ) / (
            1.0 + EXTRACT(EPOCH FROM (now() - c.created_at)) / 86400.0
          )
        ELSE 0
      END AS calc_score,
      ROW_NUMBER() OVER (PARTITION BY c.p_uid ORDER BY c.created_at DESC) AS creator_rank
    FROM candidates c
  ),
  with_media AS (
    SELECT
      s.id AS wm_post_id,
      CASE
        WHEN s.source_review_id IS NOT NULL THEN 'review'
        ELSE 'post'
      END AS wm_post_type,
      s.created_at AS wm_post_created_at,
      s.caption AS wm_post_caption,
      s.location AS wm_post_location,
      s.like_count AS wm_post_like_count,
      s.comment_count AS wm_post_comment_count,
      s.share_count AS wm_post_share_count,
      s.is_pinned AS wm_post_is_pinned,
      s.hashtags AS wm_post_hashtags,
      s.p_uid AS wm_user_id,
      up.display_name AS wm_user_name,
      up.username AS wm_user_username,
      up.avatar_url AS wm_user_avatar_url,
      up.handicap_index AS wm_user_handicap,
      up.home_club AS wm_user_home_club,
      up.is_verified AS wm_user_is_verified,
      s.actor_type AS wm_actor_type,
      s.actor_id AS wm_actor_id,
      ba.name AS wm_business_name,
      ba.logo_url AS wm_business_logo_url,
      ba.slug AS wm_business_slug,
      ba.is_verified AS wm_business_is_verified,
      pm.id AS wm_media_id,
      pm.url AS wm_media_url,
      pm.media_type AS wm_media_type,
      pm.width AS wm_media_width,
      pm.height AS wm_media_height,
      pm.display_order AS wm_media_display_order,
      pm.thumbnail_url AS wm_media_thumbnail_url,
      pm.duration_ms AS wm_media_duration_ms,
      s.source_review_id AS wm_source_review_id,
      cr.rating AS wm_review_rating,
      COALESCE(gc_review.name, gc_course.name) AS wm_review_course_name,
      COALESCE(cr.course_id, s.course_id) AS wm_review_course_id,
      COALESCE(gc_review.image_url, gc_course.image_url) AS wm_review_course_image,
      COALESCE(gc_review.region, gc_course.region) AS wm_review_course_region,
      COALESCE(gc_review.country, gc_course.country) AS wm_review_course_country,
      COALESCE(gc_review.sub_country, gc_course.sub_country) AS wm_review_course_sub_country,
      cr.review_text AS wm_review_text,
      s.course_id AS wm_course_id,
      gc_course.name AS wm_course_name,
      gc_course.club_name AS wm_course_club_name,
      s.calc_score AS wm_score,
      s.creator_rank,
      (
        SELECT jsonb_agg(jsonb_build_object(
          'tagged_entity_id', pt.tagged_entity_id,
          'tagged_entity_type', pt.tagged_entity_type,
          'display_name', CASE
            WHEN pt.tagged_entity_type = 'business' THEN (SELECT ba2.name FROM business_accounts ba2 WHERE ba2.id = pt.tagged_entity_id)
            WHEN pt.tagged_entity_type = 'user' THEN (SELECT up2.display_name FROM user_profiles up2 WHERE up2.id = pt.tagged_entity_id)
            ELSE NULL
          END,
          'slug', CASE
            WHEN pt.tagged_entity_type = 'business' THEN (SELECT ba3.slug FROM business_accounts ba3 WHERE ba3.id = pt.tagged_entity_id)
            ELSE NULL
          END,
          'username', CASE
            WHEN pt.tagged_entity_type = 'user' THEN (SELECT up3.username FROM user_profiles up3 WHERE up3.id = pt.tagged_entity_id)
            ELSE NULL
          END
        ))
        FROM post_tags pt
        WHERE pt.post_id = s.id
      ) AS wm_post_tags
    FROM scored s
    LEFT JOIN user_profiles up ON up.id = s.p_uid
    LEFT JOIN business_accounts ba ON s.actor_type = 'business' AND ba.id = s.actor_id
    LEFT JOIN post_media pm ON pm.post_id = s.id
    LEFT JOIN course_ratings cr ON s.source_review_id IS NOT NULL AND cr.id = s.source_review_id
    LEFT JOIN golf_courses gc_review ON cr.course_id IS NOT NULL AND gc_review.id = cr.course_id
    LEFT JOIN golf_courses gc_course ON s.course_id IS NOT NULL AND gc_course.id = s.course_id
    WHERE (v_mode <> 'popular' OR s.creator_rank <= 3)
  )
  SELECT
    wm.wm_post_id, wm.wm_post_type, wm.wm_post_created_at, wm.wm_post_caption,
    wm.wm_post_location, wm.wm_post_like_count, wm.wm_post_comment_count,
    wm.wm_post_share_count, wm.wm_post_is_pinned, wm.wm_post_hashtags,
    wm.wm_user_id, wm.wm_user_name, wm.wm_user_username, wm.wm_user_avatar_url,
    wm.wm_user_handicap, wm.wm_user_home_club, wm.wm_user_is_verified,
    wm.wm_actor_type, wm.wm_actor_id, wm.wm_business_name, wm.wm_business_logo_url,
    wm.wm_business_slug, wm.wm_business_is_verified,
    wm.wm_media_id, wm.wm_media_url, wm.wm_media_type, wm.wm_media_width,
    wm.wm_media_height, wm.wm_media_display_order, wm.wm_media_thumbnail_url,
    wm.wm_media_duration_ms, wm.wm_source_review_id, wm.wm_review_rating,
    wm.wm_review_course_name, wm.wm_review_course_id,
    wm.wm_review_course_image, wm.wm_review_course_region,
    wm.wm_review_course_country, wm.wm_review_course_sub_country,
    wm.wm_review_text,
    wm.wm_course_id, wm.wm_course_name, wm.wm_course_club_name,
    wm.wm_score, wm.wm_post_tags
  FROM with_media wm
  ORDER BY
    CASE WHEN v_mode = 'popular' THEN (wm.wm_score * (0.85 + random() * 0.30)) END DESC NULLS LAST,
    wm.wm_post_created_at DESC
  LIMIT v_page_size;
END;
$function$;