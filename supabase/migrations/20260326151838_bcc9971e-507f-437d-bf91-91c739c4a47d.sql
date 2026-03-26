DROP FUNCTION IF EXISTS public.get_profile_posts(UUID, TEXT, UUID, INT, TIMESTAMPTZ, UUID[]);

CREATE OR REPLACE FUNCTION public.get_profile_posts(
  p_user_id    UUID,
  p_actor_type TEXT,
  p_actor_id   UUID,
  p_page_size  INT DEFAULT 24,
  p_cursor     TIMESTAMPTZ DEFAULT NULL,
  p_seen_post_ids UUID[] DEFAULT '{}'
)
RETURNS TABLE (
  post_id              UUID,
  post_content         TEXT,
  post_created_at      TIMESTAMPTZ,
  post_user_id         UUID,
  post_actor_type      TEXT,
  post_actor_id        UUID,
  post_status          TEXT,
  source_review_id     UUID,
  media_id             UUID,
  media_type           TEXT,
  media_url            TEXT,
  poster_url           TEXT,
  stream_id            TEXT,
  duration_seconds     NUMERIC,
  width                INT,
  height               INT,
  display_order        INT,
  creator_username     TEXT,
  creator_display_name TEXT,
  creator_avatar_url   TEXT,
  creator_is_verified  BOOLEAN,
  business_name        TEXT,
  business_logo_url    TEXT,
  business_is_verified BOOLEAN,
  like_count           BIGINT,
  comment_count        BIGINT,
  share_count          BIGINT,
  review_rating        NUMERIC,
  review_course_id     UUID,
  review_course_name   TEXT,
  review_course_image  TEXT,
  review_course_region TEXT,
  review_course_country TEXT,
  review_course_sub_country TEXT,
  course_region        TEXT,
  course_country       TEXT,
  creator_relation     TEXT,
  is_liked_by_me       BOOLEAN,
  is_followed_by_me    BOOLEAN,
  engagement_score     NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        UUID := p_user_id;
  v_actor_type     TEXT := p_actor_type;
  v_actor_id       UUID := p_actor_id;
  v_page_size      INT  := LEAST(COALESCE(p_page_size, 24), 60);
  v_cursor         TIMESTAMPTZ := p_cursor;
  v_seen_post_ids  UUID[] := COALESCE(p_seen_post_ids, '{}');
BEGIN
  RETURN QUERY
  SELECT
    p.id                                   AS post_id,
    p.content                              AS post_content,
    p.created_at                           AS post_created_at,
    p.user_id                              AS post_user_id,
    p.actor_type                           AS post_actor_type,
    p.actor_id                             AS post_actor_id,
    p.status                               AS post_status,
    p.source_review_id                     AS source_review_id,
    pm.id                                  AS media_id,
    pm.media_type                          AS media_type,
    pm.media_url                           AS media_url,
    pm.poster_url                          AS poster_url,
    pm.stream_id                           AS stream_id,
    pm.duration_seconds                    AS duration_seconds,
    pm.width                               AS width,
    pm.height                              AS height,
    pm.display_order                       AS display_order,
    up.username                            AS creator_username,
    up.display_name                        AS creator_display_name,
    up.profile_photo_url                   AS creator_avatar_url,
    COALESCE(up.is_verified, FALSE)        AS creator_is_verified,
    ba.name                                AS business_name,
    ba.logo_url                            AS business_logo_url,
    COALESCE(ba.is_verified, FALSE)        AS business_is_verified,
    COALESCE(p.like_count, 0)              AS like_count,
    COALESCE(p.comment_count, 0)           AS comment_count,
    COALESCE(psc.cnt, 0)                   AS share_count,
    cr.rating                              AS review_rating,
    cr.course_id                           AS review_course_id,
    gc.name                                AS review_course_name,
    gc.thumbnail_image                     AS review_course_image,
    gc.region                              AS review_course_region,
    gc.country                             AS review_course_country,
    gc.sub_country                         AS review_course_sub_country,
    gc.region                              AS course_region,
    gc.country                             AS course_country,
    CASE
      WHEN v_user_id IS NULL THEN 'none'
      WHEN EXISTS (
        SELECT 1 FROM friendships f
        WHERE (f.user_id = v_user_id AND f.friend_id = p.user_id)
           OR (f.friend_id = v_user_id AND f.user_id = p.user_id)
      ) THEN 'friend'
      WHEN EXISTS (
        SELECT 1 FROM follows fo
        WHERE fo.follower_id = v_user_id AND fo.following_id = p.user_id
      ) THEN 'following'
      ELSE 'none'
    END                                    AS creator_relation,
    EXISTS (
      SELECT 1 FROM post_likes pl
      WHERE pl.post_id = p.id AND pl.user_id = v_user_id
    )                                      AS is_liked_by_me,
    CASE
      WHEN p.actor_type = 'business' THEN EXISTS (
        SELECT 1 FROM business_follows bf
        WHERE bf.business_id = p.actor_id AND bf.follower_id = v_user_id
      )
      ELSE EXISTS (
        SELECT 1 FROM follows fo
        WHERE fo.following_id = p.user_id AND fo.follower_id = v_user_id
      )
    END                                    AS is_followed_by_me,
    0::NUMERIC                             AS engagement_score
  FROM posts p
  INNER JOIN post_media pm ON pm.post_id = p.id
  LEFT JOIN user_profiles up ON up.id = p.user_id
  LEFT JOIN business_accounts ba ON ba.id = p.actor_id AND p.actor_type = 'business'
  LEFT JOIN course_reviews cr ON cr.id = p.source_review_id
  LEFT JOIN golf_courses gc ON gc.id = cr.course_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT AS cnt FROM post_shares ps WHERE ps.post_id = p.id
  ) psc ON TRUE
  WHERE p.status = 'published'
    AND (
      (v_actor_type = 'personal' AND p.user_id = v_actor_id AND (p.actor_type = 'personal' OR p.actor_type IS NULL))
      OR
      (v_actor_type = 'business' AND p.actor_type = 'business' AND p.actor_id = v_actor_id)
    )
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users bu
      WHERE (bu.blocker_id = v_user_id AND bu.blocked_id = p.user_id)
         OR (bu.blocked_id = v_user_id AND bu.blocker_id = p.user_id)
    )
    AND (v_cursor IS NULL OR p.created_at < v_cursor)
    AND NOT (p.id = ANY(v_seen_post_ids))
  ORDER BY p.created_at DESC, pm.display_order ASC
  LIMIT v_page_size;
END;
$$;