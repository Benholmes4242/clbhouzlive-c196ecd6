
DROP FUNCTION IF EXISTS public.get_explore_feed(uuid, text, integer, timestamp with time zone, uuid[], text);

CREATE OR REPLACE FUNCTION public.get_explore_feed(
  p_user_id uuid,
  p_region text DEFAULT NULL::text,
  p_page_size integer DEFAULT 30,
  p_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_seen_post_ids uuid[] DEFAULT '{}'::uuid[],
  p_search_query text DEFAULT NULL::text
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
  review_course_region text, review_course_country text, review_course_sub_country text,
  review_text text,
  creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric,
  review_design_score numeric, review_condition_score numeric,
  review_facilities_score numeric, review_clubhouse_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID := p_user_id;
  v_region TEXT := p_region;
  v_page_size INT := p_page_size;
  v_cursor TIMESTAMPTZ := p_cursor;
  v_seen_post_ids UUID[] := p_seen_post_ids;
  v_search_query TEXT := p_search_query;
  v_recency_halflife_hours NUMERIC := 24;
  v_max_post_age_days INT := 365;
  v_creator_cap INT := 3;
BEGIN
  RETURN QUERY
  WITH
  blocked_users AS (
    SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id = v_user_id
    UNION SELECT blocker_id AS uid FROM user_blocks WHERE blocked_id = v_user_id
  ),
  my_follows AS (
    SELECT following_id AS uid FROM user_follows WHERE follower_id = v_user_id
  ),
  my_friends AS (
    SELECT friend_id AS uid FROM user_friends WHERE user_id = v_user_id AND status = 'accepted'
    UNION SELECT uf.user_id AS uid FROM user_friends uf WHERE uf.friend_id = v_user_id AND uf.status = 'accepted'
  ),
  my_business_follows AS (
    SELECT business_id AS bid FROM business_follows WHERE follower_id = v_user_id
  ),
  region_countries AS (
    SELECT erm.country FROM explore_region_members erm
    INNER JOIN explore_regions er ON er.id = erm.region_id
    WHERE er.slug = v_region
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
    INNER JOIN golf_courses gc ON gc.id = p.course_id
    LEFT JOIN blocked_users bu ON bu.uid = p.user_id
    WHERE p.status = 'published'
      AND p.course_id IS NOT NULL
      AND pm.media_type IN ('video', 'image')
      AND bu.uid IS NULL
      AND p.created_at > NOW() - (v_max_post_age_days || ' days')::INTERVAL
      AND (v_cursor IS NULL OR p.created_at < v_cursor)
      AND NOT (p.id = ANY(v_seen_post_ids))
      AND (v_region IS NULL OR gc.country IN (SELECT country FROM region_countries))
      AND (v_search_query IS NULL
        OR p.content ILIKE '%' || v_search_query || '%'
        OR gc.name ILIKE '%' || v_search_query || '%')
    ORDER BY p.id, pm.display_order
  ),
  enriched AS (
    SELECT dp.*,
      gc.name AS p_course_name,
      gc.thumbnail_image AS p_course_image,
      gc.region AS p_course_region,
      gc.country AS p_course_country,
      gc.sub_country AS p_course_sub_country,
      cr.rating AS p_review_rating,
      cr.review AS p_review_text,
      cr.design_score AS p_review_design_score,
      cr.condition_score AS p_review_condition_score,
      cr.facilities_score AS p_review_facilities_score,
      cr.clubhouse_score AS p_review_clubhouse_score,
      COALESCE(plc.cnt, 0) AS p_like_count,
      COALESCE(pcc.cnt, 0) AS p_comment_count,
      COALESCE(psc.cnt, 0) AS p_share_count,
      CASE
        WHEN mfr.uid IS NOT NULL THEN 'friend'
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
      up.username AS p_creator_username, up.display_name AS p_creator_display_name,
      up.profile_photo_url AS p_creator_avatar,
      COALESCE(up.is_verified, FALSE) AS p_creator_verified,
      ba.name AS p_business_name, ba.logo_url AS p_business_logo,
      COALESCE(ba.is_verified, FALSE) AS p_business_verified
    FROM distinct_posts dp
    INNER JOIN golf_courses gc ON gc.id = dp.p_course_id
    LEFT JOIN course_ratings cr ON cr.id = dp.p_source_review_id
    LEFT JOIN user_profiles up ON up.id = dp.p_user_id
    LEFT JOIN business_accounts ba ON ba.id = dp.p_actor_id AND dp.p_actor_type = 'business'
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes pl WHERE pl.post_id = dp.p_id) plc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments pc WHERE pc.post_id = dp.p_id) pcc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares ps WHERE ps.post_id = dp.p_id) psc ON TRUE
    LEFT JOIN my_friends mfr ON mfr.uid = dp.p_user_id
    LEFT JOIN my_follows mfl ON mfl.uid = dp.p_user_id
    LEFT JOIN my_business_follows mbf ON mbf.bid = dp.p_actor_id AND dp.p_actor_type = 'business'
    LEFT JOIN post_likes ml ON ml.post_id = dp.p_id AND ml.user_id = v_user_id
  ),
  scored AS (
    SELECT e.*,
      GREATEST(
        (e.p_like_count * 1.0 + e.p_comment_count * 2.5 + e.p_share_count * 3.0)
        * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - e.p_created_at)) / 3600 / v_recency_halflife_hours)
        * CASE
            WHEN e.pm_media_type = 'video' THEN 3.0
            WHEN e.p_source_review_id IS NOT NULL THEN 2.0
            ELSE 1.0
          END,
        CASE
          WHEN e.pm_media_type = 'video' THEN 0.1
          WHEN e.p_source_review_id IS NOT NULL THEN 0.05
          ELSE 0.001
        END
      ) AS score,
      ROW_NUMBER() OVER (
        PARTITION BY e.p_user_id
        ORDER BY
          GREATEST(
            (e.p_like_count * 1.0 + e.p_comment_count * 2.5 + e.p_share_count * 3.0)
            * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - e.p_created_at)) / 3600 / v_recency_halflife_hours)
            * CASE WHEN e.pm_media_type = 'video' THEN 3.0 WHEN e.p_source_review_id IS NOT NULL THEN 2.0 ELSE 1.0 END,
            CASE WHEN e.pm_media_type = 'video' THEN 0.1 WHEN e.p_source_review_id IS NOT NULL THEN 0.05 ELSE 0.001 END
          ) DESC
      ) AS creator_rank
    FROM enriched e
  ),
  selected AS (
    SELECT s.p_id FROM scored s
    WHERE s.creator_rank <= v_creator_cap
    ORDER BY s.score DESC
    LIMIT v_page_size
  )
  SELECT
    sel.p_id, sc.p_content, sc.p_created_at, sc.p_user_id, sc.p_actor_type, sc.p_actor_id,
    sc.p_status, sc.p_source_review_id,
    pm2.id, pm2.media_type, pm2.media_url, pm2.poster_url, pm2.stream_id,
    pm2.duration_seconds, pm2.width, pm2.height, pm2.display_order,
    sc.p_creator_username, sc.p_creator_display_name, sc.p_creator_avatar, sc.p_creator_verified,
    sc.p_business_name, sc.p_business_logo, sc.p_business_verified,
    sc.p_like_count, sc.p_comment_count, sc.p_share_count,
    sc.p_review_rating, sc.p_course_id, sc.p_course_name, sc.p_course_image,
    sc.p_course_region, sc.p_course_country,
    sc.p_course_region, sc.p_course_country, sc.p_course_sub_country,
    sc.p_review_text,
    sc.p_relation, sc.p_liked_by_me, sc.p_followed_by_me, sc.score,
    sc.p_review_design_score, sc.p_review_condition_score,
    sc.p_review_facilities_score, sc.p_review_clubhouse_score
  FROM selected sel
  JOIN scored sc ON sc.p_id = sel.p_id
  JOIN post_media pm2 ON pm2.post_id = sel.p_id
  ORDER BY sc.score DESC, pm2.display_order;
END;
$function$;
