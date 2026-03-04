-- Drop existing functions first (return type changed)
DROP FUNCTION IF EXISTS get_suggested_feed(UUID, INT, TIMESTAMPTZ, UUID[]);
DROP FUNCTION IF EXISTS get_friends_feed(UUID, INT, TIMESTAMPTZ, UUID[]);

-- Recreate get_suggested_feed with course region columns
CREATE OR REPLACE FUNCTION get_suggested_feed(
  p_user_id UUID,
  p_page_size INT DEFAULT 10,
  p_cursor TIMESTAMPTZ DEFAULT NULL,
  p_seen_post_ids UUID[] DEFAULT '{}'
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
  v_recency_halflife_hours NUMERIC := 24;
  v_max_post_age_days INT := 14;
  v_max_duration_seconds INT := 180;
  v_creator_cap INT := 2;
  v_fetch_multiplier INT := 3;
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
  candidates AS (
    SELECT
      p.id AS p_id,
      p.content AS p_content,
      p.created_at AS p_created_at,
      p.user_id AS p_user_id,
      p.actor_type AS p_actor_type,
      p.actor_id AS p_actor_id,
      p.status AS p_status,
      p.source_review_id AS p_source_review_id,
      pm.id AS pm_id,
      pm.media_type AS pm_media_type,
      pm.media_url AS pm_media_url,
      pm.poster_url AS pm_poster_url,
      pm.stream_id AS pm_stream_id,
      pm.duration_seconds AS pm_duration,
      pm.width AS pm_width,
      pm.height AS pm_height,
      pm.display_order AS pm_display_order,
      COALESCE(lc.cnt, 0) AS p_like_count,
      COALESCE(cc.cnt, 0) AS p_comment_count,
      COALESCE(sc.cnt, 0) AS p_share_count,
      CASE
        WHEN mf.uid IS NOT NULL THEN 'friend'
        WHEN mfl.uid IS NOT NULL THEN 'following'
        WHEN mbf.bid IS NOT NULL AND p.actor_type = 'business' THEN 'following'
        ELSE 'none'
      END AS p_relation,
      CASE WHEN ml.post_id IS NOT NULL THEN TRUE ELSE FALSE END AS p_liked_by_me,
      CASE
        WHEN mfl.uid IS NOT NULL THEN TRUE
        WHEN mbf.bid IS NOT NULL AND p.actor_type = 'business' THEN TRUE
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
    FROM posts p
    INNER JOIN post_media pm ON pm.post_id = p.id
    LEFT JOIN user_profiles up ON up.id = p.user_id
    LEFT JOIN business_accounts ba ON ba.id = p.actor_id AND p.actor_type = 'business'
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes WHERE post_id = p.id) lc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments WHERE post_id = p.id) cc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares WHERE post_id = p.id) sc ON TRUE
    LEFT JOIN my_friends mf ON mf.uid = p.user_id
    LEFT JOIN my_follows mfl ON mfl.uid = p.user_id
    LEFT JOIN my_business_follows mbf ON mbf.bid = p.actor_id AND p.actor_type = 'business'
    LEFT JOIN blocked_users bu ON bu.uid = p.user_id
    LEFT JOIN post_likes ml ON ml.post_id = p.id AND ml.user_id = p_user_id
    LEFT JOIN course_ratings cr ON cr.id = p.source_review_id
    LEFT JOIN golf_courses gc ON gc.id = cr.course_id
    WHERE p.status = 'published'
      AND bu.uid IS NULL
      AND p.created_at > NOW() - INTERVAL '14 days'
      AND (p_cursor IS NULL OR p.created_at < p_cursor)
      AND NOT (p.id = ANY(p_seen_post_ids))
      AND (
        (p.source_review_id IS NULL AND pm.media_type = 'video'
         AND pm.duration_seconds IS NOT NULL AND pm.duration_seconds <= v_max_duration_seconds)
        OR
        (p.source_review_id IS NOT NULL)
      )
    ORDER BY p.created_at DESC
    LIMIT p_page_size * v_fetch_multiplier
  ),
  scored AS (
    SELECT
      c.*,
      GREATEST(
        (c.p_like_count * 1.0 + c.p_comment_count * 2.5 + c.p_share_count * 3.0)
        * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - c.p_created_at)) / 3600 / v_recency_halflife_hours)
        * CASE c.p_relation
            WHEN 'friend' THEN 2.0
            WHEN 'following' THEN 1.5
            ELSE 1.0
          END,
        CASE WHEN c.p_created_at > NOW() - INTERVAL '1 hour'
          THEN 1.0 * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - c.p_created_at)) / 3600)
          ELSE 0
        END
      ) AS score,
      ROW_NUMBER() OVER (
        PARTITION BY c.p_user_id
        ORDER BY
          GREATEST(
            (c.p_like_count * 1.0 + c.p_comment_count * 2.5 + c.p_share_count * 3.0)
            * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - c.p_created_at)) / 3600 / v_recency_halflife_hours),
            CASE WHEN c.p_created_at > NOW() - INTERVAL '1 hour'
              THEN 1.0 * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - c.p_created_at)) / 3600)
              ELSE 0
            END
          ) DESC
      ) AS creator_rank
    FROM candidates c
  ),
  filtered AS (
    SELECT * FROM scored
    WHERE creator_rank <= v_creator_cap
    ORDER BY score DESC
    LIMIT p_page_size
  )
  SELECT
    f.p_id,
    f.p_content,
    f.p_created_at,
    f.p_user_id,
    f.p_actor_type,
    f.p_actor_id,
    f.p_status,
    f.p_source_review_id,
    f.pm_id,
    f.pm_media_type,
    f.pm_media_url,
    f.pm_poster_url,
    f.pm_stream_id,
    f.pm_duration,
    f.pm_width,
    f.pm_height,
    f.pm_display_order,
    f.p_creator_username,
    f.p_creator_display_name,
    f.p_creator_avatar,
    f.p_creator_verified,
    f.p_business_name,
    f.p_business_logo,
    f.p_business_verified,
    f.p_like_count,
    f.p_comment_count,
    f.p_share_count,
    f.p_review_rating,
    f.p_review_course_id,
    f.p_review_course_name,
    f.p_review_course_image,
    f.p_review_course_region,
    f.p_review_course_country,
    f.p_review_course_sub_country,
    f.p_relation,
    f.p_liked_by_me,
    f.p_followed_by_me,
    f.score
  FROM filtered f
  ORDER BY f.score DESC;
END;
$$;

-- Recreate get_friends_feed with course region columns
CREATE OR REPLACE FUNCTION get_friends_feed(
  p_user_id UUID,
  p_page_size INT DEFAULT 10,
  p_cursor TIMESTAMPTZ DEFAULT NULL,
  p_seen_post_ids UUID[] DEFAULT '{}'
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
BEGIN
  RETURN QUERY
  WITH
  my_follows AS (
    SELECT following_id AS uid FROM user_follows
    WHERE follower_id = p_user_id
  ),
  my_business_follows AS (
    SELECT business_id AS bid FROM business_follows
    WHERE follower_id = p_user_id
  ),
  my_friends AS (
    SELECT friend_id AS uid FROM user_friends
    WHERE user_id = p_user_id AND status = 'accepted'
    UNION
    SELECT uf.user_id AS uid FROM user_friends uf
    WHERE uf.friend_id = p_user_id AND uf.status = 'accepted'
  ),
  blocked_users AS (
    SELECT blocked_user_id AS uid FROM user_blocks
    WHERE blocker_user_id = p_user_id
    UNION
    SELECT blocker_user_id AS uid FROM user_blocks
    WHERE blocked_user_id = p_user_id
  )
  SELECT
    p.id,
    p.content,
    p.created_at,
    p.user_id,
    p.actor_type,
    p.actor_id,
    p.status,
    p.source_review_id,
    pm.id,
    pm.media_type,
    pm.media_url,
    pm.poster_url,
    pm.stream_id,
    pm.duration_seconds,
    pm.width,
    pm.height,
    pm.display_order,
    up.username,
    up.display_name,
    up.profile_photo_url,
    COALESCE(up.is_verified, FALSE),
    ba.name,
    ba.logo_url,
    COALESCE(ba.is_verified, FALSE),
    COALESCE(lc.cnt, 0),
    COALESCE(cc.cnt, 0),
    COALESCE(sc.cnt, 0),
    cr.rating,
    gc.id,
    gc.name,
    gc.thumbnail_image,
    gc.region,
    gc.country,
    gc.sub_country,
    CASE
      WHEN mfr.uid IS NOT NULL THEN 'friend'
      ELSE 'following'
    END,
    CASE WHEN ml.post_id IS NOT NULL THEN TRUE ELSE FALSE END,
    TRUE,
    0::NUMERIC
  FROM posts p
  INNER JOIN post_media pm ON pm.post_id = p.id
  LEFT JOIN user_profiles up ON up.id = p.user_id
  LEFT JOIN business_accounts ba ON ba.id = p.actor_id AND p.actor_type = 'business'
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes WHERE post_id = p.id) lc ON TRUE
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments WHERE post_id = p.id) cc ON TRUE
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares WHERE post_id = p.id) sc ON TRUE
  LEFT JOIN my_friends mfr ON mfr.uid = p.user_id
  LEFT JOIN blocked_users bu ON bu.uid = p.user_id
  LEFT JOIN post_likes ml ON ml.post_id = p.id AND ml.user_id = p_user_id
  LEFT JOIN course_ratings cr ON cr.id = p.source_review_id
  LEFT JOIN golf_courses gc ON gc.id = cr.course_id
  WHERE p.status = 'published'
    AND bu.uid IS NULL
    AND (p_cursor IS NULL OR p.created_at < p_cursor)
    AND NOT (p.id = ANY(p_seen_post_ids))
    AND (
      p.user_id IN (SELECT uid FROM my_follows)
      OR
      (p.actor_type = 'business' AND p.actor_id IN (SELECT bid FROM my_business_follows))
    )
    AND (
      (p.source_review_id IS NULL AND pm.media_type = 'video'
       AND pm.duration_seconds IS NOT NULL AND pm.duration_seconds <= 180)
      OR
      (p.source_review_id IS NOT NULL)
    )
  ORDER BY p.created_at DESC
  LIMIT p_page_size;
END;
$$;