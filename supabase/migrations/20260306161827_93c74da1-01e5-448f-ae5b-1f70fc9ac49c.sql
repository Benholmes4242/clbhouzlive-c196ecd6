
CREATE OR REPLACE FUNCTION get_long_form_videos(
  p_user_id UUID,
  p_mode TEXT DEFAULT 'latest',
  p_page_size INT DEFAULT 10,
  p_cursor TIMESTAMPTZ DEFAULT NULL,
  p_seen_post_ids UUID[] DEFAULT '{}',
  p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  post_id UUID,
  post_content TEXT,
  post_created_at TIMESTAMPTZ,
  post_user_id UUID,
  post_actor_type TEXT,
  post_actor_id UUID,
  post_status TEXT,
  source_review_id UUID,
  media_id UUID,
  media_type TEXT,
  media_url TEXT,
  poster_url TEXT,
  stream_id TEXT,
  duration_seconds NUMERIC,
  width INT,
  height INT,
  display_order INT,
  creator_username TEXT,
  creator_display_name TEXT,
  creator_avatar_url TEXT,
  creator_is_verified BOOLEAN,
  business_name TEXT,
  business_logo_url TEXT,
  business_is_verified BOOLEAN,
  like_count BIGINT,
  comment_count BIGINT,
  share_count BIGINT,
  review_rating NUMERIC,
  review_course_id UUID,
  review_course_name TEXT,
  review_course_image TEXT,
  review_course_region TEXT,
  review_course_country TEXT,
  review_course_sub_country TEXT,
  creator_relation TEXT,
  is_liked_by_me BOOLEAN,
  is_followed_by_me BOOLEAN,
  engagement_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recency_halflife_hours NUMERIC := 48;
  v_creator_cap INT := 3;
  v_fetch_multiplier INT := 4;
  v_min_duration INT := 240;
BEGIN
  RETURN QUERY
  WITH
  my_friends AS (
    SELECT friend_id AS uid FROM user_friends
    WHERE user_id = p_user_id AND status = 'accepted'
    UNION
    SELECT uf.user_id AS uid FROM user_friends uf
    WHERE uf.friend_id = p_user_id AND uf.status = 'accepted'
  ),
  my_follows AS (
    SELECT following_id AS uid FROM user_follows
    WHERE follower_id = p_user_id
  ),
  my_business_follows AS (
    SELECT business_id AS bid FROM business_follows
    WHERE follower_id = p_user_id
  ),
  blocked_users AS (
    SELECT blocked_user_id AS uid FROM user_blocks
    WHERE blocker_user_id = p_user_id
    UNION
    SELECT blocker_user_id AS uid FROM user_blocks
    WHERE blocked_user_id = p_user_id
  ),
  -- Step 1: Deduplicate at post level, pick one representative media row
  distinct_posts AS (
    SELECT DISTINCT ON (p.id)
      p.id AS p_id,
      p.content AS p_content,
      p.created_at AS p_created_at,
      p.user_id AS p_user_id,
      p.actor_type AS p_actor_type,
      p.actor_id AS p_actor_id,
      p.status AS p_status,
      p.source_review_id AS p_source_review_id,
      pm.duration_seconds AS pm_duration
    FROM posts p
    INNER JOIN post_media pm ON pm.post_id = p.id
    LEFT JOIN blocked_users bu ON bu.uid = p.user_id
    WHERE p.status = 'published'
      AND bu.uid IS NULL
      AND pm.media_type = 'video'
      AND pm.duration_seconds IS NOT NULL
      AND pm.duration_seconds >= v_min_duration
      AND (p_cursor IS NULL OR p.created_at < p_cursor)
      AND NOT (p.id = ANY(p_seen_post_ids))
      AND (p_search_query IS NULL OR p.content ILIKE '%' || p_search_query || '%')
    ORDER BY p.id, pm.display_order
  ),
  -- Step 2: Enrich with social/engagement data
  enriched AS (
    SELECT
      dp.*,
      COALESCE(lc.cnt, 0) AS p_like_count,
      COALESCE(cc.cnt, 0) AS p_comment_count,
      COALESCE(sc.cnt, 0) AS p_share_count,
      CASE
        WHEN mf.uid IS NOT NULL THEN 'friend'
        WHEN mfl.uid IS NOT NULL THEN 'following'
        WHEN mbf.bid IS NOT NULL AND dp.p_actor_type = 'business' THEN 'following'
        ELSE 'none'
      END AS p_relation,
      CASE WHEN ml.post_id IS NOT NULL THEN TRUE ELSE FALSE END AS p_liked_by_me,
      CASE
        WHEN mfl.uid IS NOT NULL THEN TRUE
        WHEN mbf.bid IS NOT NULL AND dp.p_actor_type = 'business' THEN TRUE
        ELSE FALSE
      END AS p_followed_by_me,
      cr.rating AS p_review_rating,
      gc.id AS p_review_course_id,
      gc.name AS p_review_course_name,
      gc.thumbnail_image AS p_review_course_image,
      gc.region AS p_review_course_region,
      gc.country AS p_review_course_country,
      gc.sub_country AS p_review_course_sub_country,
      up.username AS p_creator_username,
      up.display_name AS p_creator_display_name,
      up.profile_photo_url AS p_creator_avatar,
      COALESCE(up.is_verified, FALSE) AS p_creator_verified,
      ba.name AS p_business_name,
      ba.logo_url AS p_business_logo,
      COALESCE(ba.is_verified, FALSE) AS p_business_verified
    FROM distinct_posts dp
    LEFT JOIN user_profiles up ON up.id = dp.p_user_id
    LEFT JOIN business_accounts ba ON ba.id = dp.p_actor_id AND dp.p_actor_type = 'business'
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes WHERE post_id = dp.p_id) lc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments WHERE post_id = dp.p_id) cc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares WHERE post_id = dp.p_id) sc ON TRUE
    LEFT JOIN my_friends mf ON mf.uid = dp.p_user_id
    LEFT JOIN my_follows mfl ON mfl.uid = dp.p_user_id
    LEFT JOIN my_business_follows mbf ON mbf.bid = dp.p_actor_id AND dp.p_actor_type = 'business'
    LEFT JOIN post_likes ml ON ml.post_id = dp.p_id AND ml.user_id = p_user_id
    LEFT JOIN course_ratings cr ON cr.id = dp.p_source_review_id
    LEFT JOIN golf_courses gc ON gc.id = cr.course_id
  ),
  -- Step 3: Score and filter by mode
  scored AS (
    SELECT
      e.*,
      CASE
        WHEN p_mode = 'popular' THEN
          (e.p_like_count * 1.0 + e.p_comment_count * 2.5 + e.p_share_count * 3.0)
          * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - e.p_created_at)) / 3600 / v_recency_halflife_hours)
        ELSE 0
      END AS score,
      CASE
        WHEN p_mode = 'popular' THEN
          ROW_NUMBER() OVER (
            PARTITION BY e.p_user_id
            ORDER BY
              (e.p_like_count * 1.0 + e.p_comment_count * 2.5 + e.p_share_count * 3.0)
              * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - e.p_created_at)) / 3600 / v_recency_halflife_hours) DESC
          )
        ELSE 1
      END AS creator_rank
    FROM enriched e
    WHERE
      CASE
        WHEN p_mode = 'following' THEN
          e.p_relation IN ('friend', 'following')
        ELSE TRUE
      END
  ),
  -- Step 4: Apply creator cap and limit
  selected AS (
    SELECT s.p_id FROM scored s
    WHERE s.creator_rank <= v_creator_cap
    ORDER BY
      CASE WHEN p_mode = 'popular' THEN s.score END DESC NULLS LAST,
      CASE WHEN p_mode != 'popular' THEN s.p_created_at END DESC NULLS LAST
    LIMIT p_page_size
  )
  -- Step 5: Re-join post_media for ALL media rows of selected posts
  SELECT
    sel.p_id,
    e.p_content,
    e.p_created_at,
    e.p_user_id,
    e.p_actor_type,
    e.p_actor_id,
    e.p_status,
    e.p_source_review_id,
    pm2.id,
    pm2.media_type,
    pm2.media_url,
    pm2.poster_url,
    pm2.stream_id,
    pm2.duration_seconds,
    pm2.width,
    pm2.height,
    pm2.display_order,
    e.p_creator_username,
    e.p_creator_display_name,
    e.p_creator_avatar,
    e.p_creator_verified,
    e.p_business_name,
    e.p_business_logo,
    e.p_business_verified,
    e.p_like_count,
    e.p_comment_count,
    e.p_share_count,
    e.p_review_rating,
    e.p_review_course_id,
    e.p_review_course_name,
    e.p_review_course_image,
    e.p_review_course_region,
    e.p_review_course_country,
    e.p_review_course_sub_country,
    e.p_relation,
    e.p_liked_by_me,
    e.p_followed_by_me,
    e.score
  FROM selected sel
  JOIN enriched e ON e.p_id = sel.p_id
  JOIN post_media pm2 ON pm2.post_id = sel.p_id
  ORDER BY
    CASE WHEN p_mode = 'popular' THEN e.score END DESC NULLS LAST,
    CASE WHEN p_mode != 'popular' THEN e.p_created_at END DESC NULLS LAST,
    pm2.display_order;
END;
$$;
