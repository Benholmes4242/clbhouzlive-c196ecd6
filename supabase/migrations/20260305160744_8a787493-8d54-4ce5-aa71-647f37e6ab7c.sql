
CREATE OR REPLACE FUNCTION get_watch_shorts(
  p_user_id UUID,
  p_mode TEXT DEFAULT 'trending',
  p_page_size INT DEFAULT 30,
  p_cursor TIMESTAMPTZ DEFAULT NULL,
  p_seen_ids UUID[] DEFAULT '{}',
  p_search_query TEXT DEFAULT NULL,
  p_user_lat FLOAT DEFAULT NULL,
  p_user_lng FLOAT DEFAULT NULL
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
  duration_seconds INTEGER,
  width INTEGER,
  height INTEGER,
  display_order INTEGER,
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
  course_region TEXT,
  course_country TEXT,
  creator_relation TEXT,
  is_liked_by_me BOOLEAN,
  is_followed_by_me BOOLEAN,
  engagement_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_duration INT := 180;
BEGIN
  RETURN QUERY
  WITH
  blocked_users AS (
    SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id = p_user_id
    UNION
    SELECT blocker_id AS uid FROM user_blocks WHERE blocked_id = p_user_id
  ),
  dismissed AS (
    SELECT post_id AS pid FROM post_dismissals WHERE user_id = p_user_id
  ),
  my_follows AS (
    SELECT following_id AS uid FROM user_follows WHERE follower_id = p_user_id
  ),
  my_friends AS (
    SELECT friend_id AS uid FROM user_friends WHERE user_id = p_user_id AND status = 'accepted'
    UNION
    SELECT user_id AS uid FROM user_friends WHERE friend_id = p_user_id AND status = 'accepted'
  ),
  my_business_follows AS (
    SELECT business_id AS bid FROM business_follows WHERE follower_id = p_user_id
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
      COALESCE(pl.cnt, 0) AS p_like_count,
      COALESCE(pc.cnt, 0) AS p_comment_count,
      COALESCE(ps.cnt, 0) AS p_share_count,
      cr.rating AS p_review_rating,
      gc.id AS p_review_course_id,
      gc.name AS p_review_course_name,
      gc.thumbnail_image AS p_review_course_image,
      gc.region AS p_course_region,
      gc.country AS p_course_country,
      up.username AS p_creator_username,
      up.display_name AS p_creator_display_name,
      up.profile_photo_url AS p_creator_avatar,
      COALESCE(up.is_verified, FALSE) AS p_creator_verified,
      ba.name AS p_business_name,
      ba.logo_url AS p_business_logo,
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
      GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600, 0.1) AS hours_old
    FROM posts p
    INNER JOIN post_media pm ON pm.post_id = p.id
    LEFT JOIN user_profiles up ON up.id = p.user_id
    LEFT JOIN business_accounts ba ON ba.id = p.actor_id AND p.actor_type = 'business'
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes pl WHERE pl.post_id = p.id) pl ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments pc WHERE pc.post_id = p.id) pc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares ps WHERE ps.post_id = p.id) ps ON TRUE
    LEFT JOIN my_friends mfr ON mfr.uid = p.user_id
    LEFT JOIN my_follows mfl ON mfl.uid = p.user_id
    LEFT JOIN my_business_follows mbf ON mbf.bid = p.actor_id AND p.actor_type = 'business'
    LEFT JOIN blocked_users bu ON bu.uid = p.user_id
    LEFT JOIN dismissed d ON d.pid = p.id
    LEFT JOIN post_likes ml ON ml.post_id = p.id AND ml.user_id = p_user_id
    LEFT JOIN course_ratings cr ON cr.id = p.source_review_id
    LEFT JOIN golf_courses gc ON gc.id = COALESCE(cr.course_id, p.course_id)
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
      AND (
        CASE p_mode
          WHEN 'trending' THEN p.created_at > NOW() - INTERVAL '7 days'
          WHEN 'latest' THEN p.created_at > NOW() - INTERVAL '30 days'
          WHEN 'top' THEN p.created_at > NOW() - INTERVAL '365 days'
          WHEN 'near' THEN p.created_at > NOW() - INTERVAL '30 days'
          ELSE TRUE
        END
      )
      AND (
        p_mode != 'near'
        OR (
          p_user_lat IS NOT NULL
          AND p_user_lng IS NOT NULL
          AND gc.latitude IS NOT NULL
          AND gc.longitude IS NOT NULL
          AND gc.latitude BETWEEN (p_user_lat - 0.45) AND (p_user_lat + 0.45)
          AND gc.longitude BETWEEN (p_user_lng - 0.6) AND (p_user_lng + 0.6)
        )
      )
    ORDER BY p.created_at DESC
    LIMIT p_page_size * 3
  ),
  scored AS (
    SELECT c.*,
      CASE p_mode
        WHEN 'trending' THEN
          ((c.p_like_count * 1.0 + c.p_comment_count * 2.5 + c.p_share_count * 3.0) / c.hours_old)
          * CASE WHEN c.hours_old < 6 THEN 2.0 * (1.0 - c.hours_old / 6.0) ELSE 1.0 END
        WHEN 'latest' THEN
          EXTRACT(EPOCH FROM c.p_created_at)
        WHEN 'top' THEN
          (c.p_like_count * 1.0 + c.p_comment_count * 2.5 + c.p_share_count * 3.0)
          * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - c.p_created_at)) / 86400 / 30)
        WHEN 'near' THEN
          EXTRACT(EPOCH FROM c.p_created_at)
        ELSE 0
      END AS score
    FROM candidates c
  ),
  filtered AS (
    SELECT * FROM scored
    WHERE (
      p_mode != 'top'
      OR (p_like_count + p_comment_count + p_share_count) >= 5
    )
    ORDER BY score DESC
    LIMIT p_page_size
  )
  SELECT
    f.p_id, f.p_content, f.p_created_at, f.p_user_id, f.p_actor_type::TEXT, f.p_actor_id,
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
$$;
