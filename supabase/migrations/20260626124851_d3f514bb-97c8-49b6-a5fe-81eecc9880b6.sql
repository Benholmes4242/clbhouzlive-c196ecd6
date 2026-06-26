DROP FUNCTION IF EXISTS public.get_course_media(uuid, uuid, text, integer, timestamp with time zone, uuid[]);
DROP FUNCTION IF EXISTS public.get_course_media(uuid, uuid, text, integer, timestamp with time zone, uuid[], text, uuid);

CREATE OR REPLACE FUNCTION public.get_course_media(
  p_user_id uuid,
  p_course_id uuid,
  p_filter text DEFAULT 'all'::text,
  p_page_size integer DEFAULT 30,
  p_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_seen_post_ids uuid[] DEFAULT '{}'::uuid[],
  p_viewer_actor_type text DEFAULT 'personal'::text,
  p_viewer_actor_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  post_id uuid, post_content text, post_created_at timestamp with time zone,
  post_user_id uuid, post_actor_type text, post_actor_id uuid,
  post_status text, source_review_id uuid,
  media_id uuid, media_type text, media_url text, poster_url text, stream_id text,
  duration_seconds numeric, width integer, height integer, display_order integer,
  creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean,
  business_name text, business_logo_url text, business_is_verified boolean,
  like_count bigint, comment_count bigint, share_count bigint,
  review_rating numeric, review_course_id uuid, review_course_name text, review_course_image text,
  course_region text, course_country text,
  creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric,
  review_design_score numeric, review_condition_score numeric,
  review_facilities_score numeric, review_clubhouse_score numeric
)
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  v_user_id UUID := p_user_id;
  v_course_id UUID := p_course_id;
  v_filter TEXT := p_filter;
  v_page_size INT := p_page_size;
  v_cursor TIMESTAMPTZ := p_cursor;
  v_seen_post_ids UUID[] := p_seen_post_ids;
  v_viewer_actor_type TEXT := COALESCE(p_viewer_actor_type, 'personal');
  v_viewer_actor_id UUID := COALESCE(p_viewer_actor_id, p_user_id);
BEGIN
  RETURN QUERY
  WITH
  blocked_users AS (
    SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id = v_user_id
    UNION SELECT blocker_id AS uid FROM user_blocks WHERE blocked_id = v_user_id
  ),
  distinct_posts AS (
    SELECT DISTINCT ON (p.id)
      p.id AS p_id, p.content AS p_content, p.created_at AS p_created_at,
      p.user_id AS p_user_id, p.actor_type AS p_actor_type, p.actor_id AS p_actor_id,
      p.status AS p_status, p.source_review_id AS p_source_review_id,
      p.course_id AS p_course_id,
      pm.media_type AS pm_media_type
    FROM posts p
    INNER JOIN post_media pm ON pm.post_id = p.id
    LEFT JOIN blocked_users bu ON bu.uid = p.user_id
    WHERE p.status = 'published'
      AND bu.uid IS NULL
      AND (v_cursor IS NULL OR p.created_at < v_cursor)
      AND NOT (p.id = ANY(v_seen_post_ids))
      AND (
        p.course_id = v_course_id
        OR (p.source_review_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM course_ratings cr_check
          WHERE cr_check.id = p.source_review_id AND cr_check.course_id = v_course_id
        ))
      )
      AND (
        v_filter = 'all'
        OR (v_filter = 'photos' AND pm.media_type = 'image')
        OR (v_filter = 'videos' AND pm.media_type = 'video')
      )
    ORDER BY p.id, pm.display_order
  ),
  enriched AS (
    SELECT dp.*,
      COALESCE(plc.cnt, 0) AS p_like_count,
      COALESCE(pcc.cnt, 0) AS p_comment_count,
      COALESCE(psc.cnt, 0) AS p_share_count,
      EXISTS (
        SELECT 1 FROM post_likes pl
        WHERE pl.post_id = dp.p_id
          AND pl.actor_type = v_viewer_actor_type
          AND pl.actor_id = v_viewer_actor_id
      ) AS p_liked_by_me,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM user_friends uf
          WHERE (uf.user_id = v_user_id AND uf.friend_id = dp.p_user_id AND uf.status = 'accepted')
            OR (uf.friend_id = v_user_id AND uf.user_id = dp.p_user_id AND uf.status = 'accepted')
        ) THEN 'friend'
        WHEN EXISTS (
          SELECT 1 FROM user_follows ufl WHERE ufl.follower_id = v_user_id AND ufl.following_id = dp.p_user_id
        ) THEN 'following'
        ELSE 'none'
      END AS p_relation,
      EXISTS (
        SELECT 1 FROM user_follows uf3 WHERE uf3.follower_id = v_user_id AND uf3.following_id = dp.p_user_id
      ) AS p_followed_by_me,
      cr.rating AS p_review_rating,
      cr.design_score AS p_review_design_score,
      cr.condition_score AS p_review_condition_score,
      cr.facilities_score AS p_review_facilities_score,
      cr.clubhouse_score AS p_review_clubhouse_score,
      gc_review.id AS p_review_course_id, gc_review.name AS p_review_course_name,
      gc_review.thumbnail_image AS p_review_course_image,
      gc_course.region AS p_course_region, gc_course.country AS p_course_country,
      up.username AS p_creator_username, up.display_name AS p_creator_display_name,
      up.profile_photo_url AS p_creator_avatar,
      COALESCE(up.is_verified, FALSE) AS p_creator_verified,
      ba.name AS p_business_name, ba.logo_url AS p_business_logo,
      COALESCE(ba.is_verified, FALSE) AS p_business_verified
    FROM distinct_posts dp
    LEFT JOIN user_profiles up ON up.id = dp.p_user_id
    LEFT JOIN business_accounts ba ON ba.id = dp.p_actor_id AND dp.p_actor_type = 'business'
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes pl WHERE pl.post_id = dp.p_id) plc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments pc WHERE pc.post_id = dp.p_id) pcc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares ps WHERE ps.post_id = dp.p_id) psc ON TRUE
    LEFT JOIN course_ratings cr ON cr.id = dp.p_source_review_id
    LEFT JOIN golf_courses gc_review ON gc_review.id = cr.course_id
    LEFT JOIN golf_courses gc_course ON gc_course.id = dp.p_course_id
  ),
  posts_media AS (
    SELECT
      e.p_id, e.p_content, e.p_created_at, e.p_user_id, e.p_actor_type, e.p_actor_id,
      e.p_status, e.p_source_review_id,
      pm2.id AS pm_id, pm2.media_type AS pm_media_type, pm2.media_url AS pm_media_url,
      pm2.poster_url AS pm_poster_url, pm2.stream_id AS pm_stream_id,
      pm2.duration_seconds AS pm_duration, pm2.width AS pm_width, pm2.height AS pm_height,
      pm2.display_order AS pm_display_order,
      e.p_creator_username, e.p_creator_display_name, e.p_creator_avatar, e.p_creator_verified,
      e.p_business_name, e.p_business_logo, e.p_business_verified,
      e.p_like_count, e.p_comment_count, e.p_share_count,
      e.p_review_rating, e.p_review_course_id, e.p_review_course_name, e.p_review_course_image,
      e.p_course_region, e.p_course_country,
      e.p_relation, e.p_liked_by_me, e.p_followed_by_me,
      (e.p_like_count * 1.0 + e.p_comment_count * 2.5 + e.p_share_count * 3.0)::NUMERIC AS p_engagement,
      e.p_review_design_score, e.p_review_condition_score,
      e.p_review_facilities_score, e.p_review_clubhouse_score
    FROM enriched e
    JOIN post_media pm2 ON pm2.post_id = e.p_id
  ),
  posts_media_urls AS (
    SELECT pm_media_url FROM posts_media
  ),
  review_only_media AS (
    SELECT
      crm.id AS rm_id,
      crm.media_url AS rm_media_url,
      crm.media_type AS rm_media_type,
      crm.poster_url AS rm_poster_url,
      crm.stream_id AS rm_stream_id,
      crm.duration_seconds AS rm_duration,
      crm.width AS rm_width,
      crm.height AS rm_height,
      crm.created_at AS rm_created_at,
      crm.review_id AS rm_review_id,
      cr2.user_id AS rm_user_id,
      cr2.rating AS rm_rating,
      cr2.design_score AS rm_design_score,
      cr2.condition_score AS rm_condition_score,
      cr2.facilities_score AS rm_facilities_score,
      cr2.clubhouse_score AS rm_clubhouse_score,
      cr2.course_id AS rm_course_id,
      gc2.name AS rm_course_name,
      gc2.thumbnail_image AS rm_course_image,
      gc2.region AS rm_course_region,
      gc2.country AS rm_course_country,
      up2.username AS rm_creator_username,
      up2.display_name AS rm_creator_display_name,
      up2.profile_photo_url AS rm_creator_avatar,
      COALESCE(up2.is_verified, FALSE) AS rm_creator_verified
    FROM course_review_media crm
    INNER JOIN course_ratings cr2 ON cr2.id = crm.review_id
    INNER JOIN golf_courses gc2 ON gc2.id = cr2.course_id
    LEFT JOIN user_profiles up2 ON up2.id = cr2.user_id
    LEFT JOIN blocked_users bu2 ON bu2.uid = cr2.user_id
    WHERE cr2.course_id = v_course_id
      AND bu2.uid IS NULL
      AND crm.media_url NOT IN (SELECT pm_media_url FROM posts_media_urls)
      AND (v_cursor IS NULL OR crm.created_at < v_cursor)
      AND (
        v_filter = 'all'
        OR (v_filter = 'photos' AND crm.media_type = 'image')
        OR (v_filter = 'videos' AND crm.media_type = 'video')
      )
  )
  SELECT * FROM (
    SELECT
      pms.p_id, pms.p_content, pms.p_created_at, pms.p_user_id, pms.p_actor_type, pms.p_actor_id,
      pms.p_status, pms.p_source_review_id,
      pms.pm_id, pms.pm_media_type, pms.pm_media_url, pms.pm_poster_url, pms.pm_stream_id,
      pms.pm_duration, pms.pm_width, pms.pm_height, pms.pm_display_order,
      pms.p_creator_username, pms.p_creator_display_name, pms.p_creator_avatar, pms.p_creator_verified,
      pms.p_business_name, pms.p_business_logo, pms.p_business_verified,
      pms.p_like_count, pms.p_comment_count, pms.p_share_count,
      pms.p_review_rating, pms.p_review_course_id, pms.p_review_course_name, pms.p_review_course_image,
      pms.p_course_region, pms.p_course_country,
      pms.p_relation, pms.p_liked_by_me, pms.p_followed_by_me,
      pms.p_engagement,
      pms.p_review_design_score, pms.p_review_condition_score,
      pms.p_review_facilities_score, pms.p_review_clubhouse_score
    FROM posts_media pms

    UNION ALL

    SELECT
      rom.rm_review_id AS p_id,
      NULL::TEXT AS p_content,
      rom.rm_created_at AS p_created_at,
      rom.rm_user_id AS p_user_id,
      'personal'::TEXT AS p_actor_type,
      rom.rm_user_id AS p_actor_id,
      'published'::TEXT AS p_status,
      rom.rm_review_id AS p_source_review_id,
      rom.rm_id AS pm_id,
      rom.rm_media_type AS pm_media_type,
      rom.rm_media_url AS pm_media_url,
      rom.rm_poster_url AS pm_poster_url,
      rom.rm_stream_id AS pm_stream_id,
      rom.rm_duration AS pm_duration,
      rom.rm_width AS pm_width,
      rom.rm_height AS pm_height,
      0 AS pm_display_order,
      rom.rm_creator_username, rom.rm_creator_display_name, rom.rm_creator_avatar, rom.rm_creator_verified,
      NULL::TEXT AS p_business_name,
      NULL::TEXT AS p_business_logo,
      FALSE AS p_business_verified,
      0::BIGINT AS p_like_count,
      0::BIGINT AS p_comment_count,
      0::BIGINT AS p_share_count,
      rom.rm_rating AS p_review_rating,
      rom.rm_course_id AS p_review_course_id,
      rom.rm_course_name AS p_review_course_name,
      rom.rm_course_image AS p_review_course_image,
      rom.rm_course_region AS p_course_region,
      rom.rm_course_country AS p_course_country,
      'none'::TEXT AS p_relation,
      FALSE AS p_liked_by_me,
      FALSE AS p_followed_by_me,
      0::NUMERIC AS p_engagement,
      rom.rm_design_score, rom.rm_condition_score,
      rom.rm_facilities_score, rom.rm_clubhouse_score
    FROM review_only_media rom
  ) combined
  ORDER BY p_created_at DESC, pm_display_order
  LIMIT v_page_size;
END;
$function$;