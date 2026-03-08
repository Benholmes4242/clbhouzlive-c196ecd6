
CREATE OR REPLACE FUNCTION public.get_course_media(
  p_user_id UUID,
  p_course_id UUID,
  p_filter TEXT DEFAULT 'all',
  p_page_size INT DEFAULT 30,
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
  course_region TEXT,
  course_country TEXT,
  creator_relation TEXT,
  is_liked_by_me BOOLEAN,
  is_followed_by_me BOOLEAN,
  engagement_score NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := p_user_id;
  v_course_id UUID := p_course_id;
  v_filter TEXT := p_filter;
  v_page_size INT := p_page_size;
  v_cursor TIMESTAMPTZ := p_cursor;
  v_seen_post_ids UUID[] := p_seen_post_ids;
BEGIN
  RETURN QUERY
  WITH blocked_users AS (
    SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id = v_user_id
    UNION
    SELECT blocker_id AS uid FROM user_blocks WHERE blocked_id = v_user_id
  ),
  raw_posts AS (
    SELECT DISTINCT ON (p.id, pm.id)
      p.id,
      p.content,
      p.created_at,
      p.user_id,
      p.actor_type,
      p.actor_id,
      p.status,
      p.source_review_id,
      p.course_id,
      pm.id AS pm_id,
      pm.media_type AS pm_media_type,
      pm.media_url AS pm_media_url,
      pm.poster_url AS pm_poster_url,
      pm.stream_id AS pm_stream_id,
      pm.duration_seconds AS pm_duration,
      pm.width AS pm_width,
      pm.height AS pm_height,
      pm.display_order AS pm_display_order
    FROM posts p
    INNER JOIN post_media pm ON pm.post_id = p.id
    WHERE p.status = 'published'
      AND p.user_id NOT IN (SELECT uid FROM blocked_users)
      AND (v_cursor IS NULL OR p.created_at < v_cursor)
      AND (cardinality(v_seen_post_ids) = 0 OR p.id != ALL(v_seen_post_ids))
      AND (
        -- Direct course_id match
        p.course_id = v_course_id
        OR
        -- Review posts for this course
        (p.source_review_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM course_ratings cr_check
          WHERE cr_check.id = p.source_review_id
            AND cr_check.course_id = v_course_id
        ))
      )
      AND (
        v_filter = 'all'
        OR (v_filter = 'photos' AND pm.media_type = 'image')
        OR (v_filter = 'videos' AND pm.media_type = 'video')
      )
    ORDER BY p.id, pm.id, pm.display_order
  )
  SELECT
    rp.id AS post_id,
    rp.content AS post_content,
    rp.created_at AS post_created_at,
    rp.user_id AS post_user_id,
    COALESCE(rp.actor_type, 'personal') AS post_actor_type,
    rp.actor_id AS post_actor_id,
    rp.status AS post_status,
    rp.source_review_id,
    rp.pm_id AS media_id,
    rp.pm_media_type AS media_type,
    rp.pm_media_url AS media_url,
    rp.pm_poster_url AS poster_url,
    rp.pm_stream_id AS stream_id,
    rp.pm_duration AS duration_seconds,
    rp.pm_width AS width,
    rp.pm_height AS height,
    rp.pm_display_order AS display_order,
    -- Creator info
    up.username AS creator_username,
    up.display_name AS creator_display_name,
    up.avatar_url AS creator_avatar_url,
    COALESCE(up.is_verified, false) AS creator_is_verified,
    -- Business info
    ba.name AS business_name,
    ba.logo_url AS business_logo_url,
    COALESCE(ba.is_verified, false) AS business_is_verified,
    -- Engagement via lateral subqueries
    (SELECT count(*) FROM post_likes plc WHERE plc.post_id = rp.id) AS like_count,
    (SELECT count(*) FROM post_comments pcc WHERE pcc.post_id = rp.id) AS comment_count,
    (SELECT count(*) FROM post_shares psc WHERE psc.post_id = rp.id) AS share_count,
    -- Review data
    cr.rating AS review_rating,
    gc_review.id AS review_course_id,
    gc_review.name AS review_course_name,
    gc_review.image_url AS review_course_image,
    gc_review.region AS review_course_region,
    gc_review.country AS review_course_country,
    gc_review.sub_country AS review_course_sub_country,
    -- Course data (from posts.course_id)
    gc_course.region AS course_region,
    gc_course.country AS course_country,
    -- Creator relation
    COALESCE(
      CASE
        WHEN EXISTS (
          SELECT 1 FROM user_friends uf
          WHERE (uf.user_id = v_user_id AND uf.friend_id = rp.user_id AND uf.status = 'accepted')
             OR (uf.friend_id = v_user_id AND uf.user_id = rp.user_id AND uf.status = 'accepted')
        ) THEN 'friend'
        WHEN EXISTS (
          SELECT 1 FROM user_follows ufl WHERE ufl.follower_id = v_user_id AND ufl.following_id = rp.user_id
        ) THEN 'following'
        ELSE 'none'
      END,
      'none'
    ) AS creator_relation,
    -- Liked by me
    EXISTS (SELECT 1 FROM post_likes pl2 WHERE pl2.post_id = rp.id AND pl2.user_id = v_user_id) AS is_liked_by_me,
    -- Followed by me
    EXISTS (SELECT 1 FROM user_follows uf3 WHERE uf3.follower_id = v_user_id AND uf3.following_id = rp.user_id) AS is_followed_by_me,
    -- Engagement score
    (
      (SELECT count(*) FROM post_likes plc2 WHERE plc2.post_id = rp.id) * 1.0
      + (SELECT count(*) FROM post_comments pcc2 WHERE pcc2.post_id = rp.id) * 2.5
      + (SELECT count(*) FROM post_shares psc2 WHERE psc2.post_id = rp.id) * 3.0
    ) AS engagement_score
  FROM raw_posts rp
  LEFT JOIN user_profiles up ON up.id = rp.user_id
  LEFT JOIN business_accounts ba ON rp.actor_type = 'business' AND ba.id = rp.actor_id
  LEFT JOIN course_ratings cr ON rp.source_review_id IS NOT NULL AND cr.id = rp.source_review_id
  LEFT JOIN golf_courses gc_review ON cr.course_id IS NOT NULL AND gc_review.id = cr.course_id
  LEFT JOIN golf_courses gc_course ON rp.course_id IS NOT NULL AND gc_course.id = rp.course_id
  ORDER BY rp.created_at DESC
  LIMIT v_page_size;
END;
$$;
