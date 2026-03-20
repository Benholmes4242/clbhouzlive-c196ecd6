
CREATE OR REPLACE FUNCTION public.get_long_form_videos(
  p_user_id uuid,
  p_mode text DEFAULT 'latest',
  p_page_size integer DEFAULT 10,
  p_cursor timestamp with time zone DEFAULT NULL,
  p_seen_post_ids uuid[] DEFAULT '{}'::uuid[],
  p_search_query text DEFAULT NULL
)
RETURNS TABLE(
  post_id uuid, post_content text, post_created_at timestamptz,
  post_user_id uuid, post_actor_type text, post_actor_id uuid,
  post_status text, source_review_id uuid,
  media_id uuid, media_type text, media_url text, poster_url text,
  stream_id text, duration_seconds integer, width integer, height integer,
  display_order integer,
  creator_username text, creator_display_name text, creator_avatar_url text,
  creator_is_verified boolean,
  business_name text, business_logo_url text, business_is_verified boolean,
  like_count bigint, comment_count bigint, share_count bigint,
  review_rating numeric, review_course_id uuid, review_course_name text,
  review_course_image text, course_region text, course_country text,
  course_sub_country text,
  creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean,
  engagement_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_recency_halflife_hours NUMERIC := 48;
  v_creator_cap INT := 3;
  v_fetch_multiplier INT := 4;
  v_min_duration INT := 180;
  v_user_id UUID := p_user_id;
  v_mode TEXT := p_mode;
  v_page_size INT := p_page_size;
  v_cursor TIMESTAMPTZ := p_cursor;
  v_seen_post_ids UUID[] := p_seen_post_ids;
  v_search_query TEXT := p_search_query;
BEGIN
  RETURN QUERY
  WITH
  my_friends AS (
    SELECT friend_id AS uid FROM user_friends WHERE user_id = v_user_id AND status = 'accepted'
    UNION SELECT uf.user_id AS uid FROM user_friends uf WHERE uf.friend_id = v_user_id AND uf.status = 'accepted'
  ),
  my_follows AS (
    SELECT following_id AS uid FROM user_follows WHERE follower_id = v_user_id
  ),
  my_business_follows AS (
    SELECT business_id AS bid FROM business_follows WHERE follower_id = v_user_id
  ),
  blocked_users AS (
    SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id = v_user_id
    UNION SELECT blocker_id AS uid FROM user_blocks WHERE blocked_id = v_user_id
  ),
  distinct_posts AS (
    SELECT DISTINCT ON (p.id)
      p.id AS p_id, p.content AS p_content, p.created_at AS p_created_at,
      p.user_id AS p_user_id, p.actor_type AS p_actor_type, p.actor_id AS p_actor_id,
      p.status AS p_status, p.source_review_id AS p_source_review_id,
      pm.duration_seconds AS pm_duration
    FROM posts p
    INNER JOIN post_media pm ON pm.post_id = p.id
    LEFT JOIN blocked_users bu ON bu.uid = p.user_id
    WHERE p.status = 'published'
      AND bu.uid IS NULL
      AND pm.media_type = 'video'
      AND pm.duration_seconds IS NOT NULL
      AND pm.duration_seconds >= v_min_duration
      AND (v_cursor IS NULL OR p.created_at < v_cursor)
      AND NOT (p.id = ANY(v_seen_post_ids))
      AND (v_search_query IS NULL OR p.content ILIKE '%' || v_search_query || '%')
      AND (
        v_mode <> 'following' OR
        p.user_id IN (SELECT uid FROM my_follows) OR
        p.user_id IN (SELECT uid FROM my_friends) OR
        (p.actor_type = 'business' AND p.actor_id IN (SELECT bid FROM my_business_follows))
      )
    ORDER BY p.id, pm.display_order
  ),
  enriched AS (
    SELECT dp.*,
      COALESCE(plc.cnt, 0) AS p_like_count,
      COALESCE(pcc.cnt, 0) AS p_comment_count,
      COALESCE(psc.cnt, 0) AS p_share_count,
      CASE
        WHEN mf.uid IS NOT NULL THEN 'friend'
        WHEN mfl.uid IS NOT NULL THEN 'following'
        WHEN mbf.bid IS NOT NULL AND dp.p_actor_type = 'business' THEN 'following'
        ELSE 'none'
      END AS p_relation,
      CASE WHEN ml.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS p_liked_by_me,
      CASE
        WHEN mfl.uid IS NOT NULL THEN TRUE
        WHEN mbf.bid IS NOT NULL AND dp.p_actor_type = 'business' THEN TRUE
        ELSE FALSE
      END AS p_followed_by_me,
      cr.rating AS p_review_rating,
      gc.id AS p_review_course_id, gc.name AS p_review_course_name,
      gc.thumbnail_image AS p_review_course_image,
      gc.region AS p_review_course_region, gc.country AS p_review_course_country,
      gc.sub_country AS p_review_course_sub_country,
      up.username AS p_creator_username, up.display_name AS p_creator_display_name,
      up.profile_photo_url AS p_creator_avatar,
      COALESCE(up.is_verified, FALSE) AS p_creator_verified,
      ba.name AS p_business_name, ba.logo_url AS p_business_logo_url,
      COALESCE(ba.is_verified, FALSE) AS p_business_verified
    FROM distinct_posts dp
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes WHERE post_id = dp.p_id) plc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments WHERE post_id = dp.p_id AND deleted_at IS NULL) pcc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares WHERE post_id = dp.p_id) psc ON TRUE
    LEFT JOIN my_friends mf ON mf.uid = dp.p_user_id
    LEFT JOIN my_follows mfl ON mfl.uid = dp.p_user_id
    LEFT JOIN my_business_follows mbf ON mbf.bid = dp.p_actor_id AND dp.p_actor_type = 'business'
    LEFT JOIN LATERAL (SELECT user_id FROM post_likes WHERE post_id = dp.p_id AND user_id = v_user_id LIMIT 1) ml ON TRUE
    LEFT JOIN course_ratings cr ON cr.id = dp.p_source_review_id
    LEFT JOIN golf_courses gc ON gc.id = cr.course_id
    LEFT JOIN user_profiles up ON up.id = dp.p_user_id
    LEFT JOIN business_accounts ba ON ba.id = dp.p_actor_id AND dp.p_actor_type = 'business'
  ),
  capped AS (
    SELECT e.*,
      ROW_NUMBER() OVER (PARTITION BY e.p_user_id ORDER BY e.p_created_at DESC) AS rn
    FROM enriched e
  ),
  scored AS (
    SELECT c.*,
      (
        COALESCE(c.p_like_count, 0) * 1.0
        + COALESCE(c.p_comment_count, 0) * 2.0
        + COALESCE(c.p_share_count, 0) * 3.0
      )
      * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - c.p_created_at)) / 3600.0 / v_recency_halflife_hours)
      AS p_engagement_score
    FROM capped c
    WHERE c.rn <= v_creator_cap
  ),
  final_posts AS (
    SELECT s.p_id
    FROM scored s
    ORDER BY
      CASE v_mode
        WHEN 'popular' THEN s.p_engagement_score
        ELSE NULL
      END DESC NULLS LAST,
      s.p_created_at DESC
    LIMIT v_page_size * v_fetch_multiplier
  )
  SELECT
    pm2.post_id,
    s2.p_content, s2.p_created_at, s2.p_user_id,
    s2.p_actor_type, s2.p_actor_id, s2.p_status, s2.p_source_review_id,
    pm2.id, pm2.media_type, pm2.media_url, pm2.poster_url, pm2.stream_id,
    pm2.duration_seconds, pm2.width, pm2.height, pm2.display_order,
    s2.p_creator_username, s2.p_creator_display_name, s2.p_creator_avatar,
    s2.p_creator_verified,
    s2.p_business_name, s2.p_business_logo_url, s2.p_business_verified,
    s2.p_like_count, s2.p_comment_count, s2.p_share_count,
    s2.p_review_rating, s2.p_review_course_id, s2.p_review_course_name,
    s2.p_review_course_image,
    s2.p_review_course_region, s2.p_review_course_country, s2.p_review_course_sub_country,
    s2.p_relation, s2.p_liked_by_me, s2.p_followed_by_me,
    s2.p_engagement_score
  FROM final_posts fp
  JOIN scored s2 ON s2.p_id = fp.p_id
  JOIN post_media pm2 ON pm2.post_id = fp.p_id
  ORDER BY
    CASE v_mode
      WHEN 'popular' THEN s2.p_engagement_score
      ELSE NULL
    END DESC NULLS LAST,
    s2.p_created_at DESC,
    pm2.display_order ASC;
END;
$function$;
