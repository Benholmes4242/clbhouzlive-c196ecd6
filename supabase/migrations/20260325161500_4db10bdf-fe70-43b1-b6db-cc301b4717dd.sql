DROP FUNCTION IF EXISTS get_suggested_creators(UUID, INT);

CREATE OR REPLACE FUNCTION get_suggested_creators(
  p_user_id UUID,
  p_limit INT DEFAULT 8
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN,
  handicap NUMERIC,
  home_course TEXT,
  total_engagement BIGINT,
  video_count BIGINT,
  is_followed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH
  already_followed AS (
    SELECT following_id AS uid FROM user_follows WHERE follower_id = p_user_id
  ),
  blocked AS (
    SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id = p_user_id
    UNION
    SELECT blocker_id AS uid FROM user_blocks WHERE blocked_id = p_user_id
  ),
  candidate_stats AS (
    SELECT
      up.id AS c_user_id,
      COALESCE(SUM(COALESCE(lk.cnt, 0) + COALESCE(cm.cnt, 0) * 2.5 + COALESCE(sh.cnt, 0) * 3), 0)::BIGINT AS total_eng,
      COUNT(DISTINCT p.id) AS vid_count
    FROM user_profiles up
    LEFT JOIN posts p ON p.user_id = up.id AND p.status = 'published'
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes l WHERE l.post_id = p.id) lk ON p.id IS NOT NULL
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments c WHERE c.post_id = p.id) cm ON p.id IS NOT NULL
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares s WHERE s.post_id = p.id) sh ON p.id IS NOT NULL
    WHERE up.id != p_user_id
      AND up.is_public = TRUE
      AND up.deleted_at IS NULL
      AND up.profile_photo_url IS NOT NULL
      AND up.profile_photo_url != ''
    GROUP BY up.id
  )
  SELECT
    cs.c_user_id,
    up.username,
    up.display_name,
    up.profile_photo_url,
    COALESCE(up.is_verified, FALSE),
    up.handicap,
    gc.name AS home_course,
    cs.total_eng,
    cs.vid_count,
    CASE WHEN af.uid IS NOT NULL THEN TRUE ELSE FALSE END
  FROM candidate_stats cs
  INNER JOIN user_profiles up ON up.id = cs.c_user_id
  LEFT JOIN already_followed af ON af.uid = cs.c_user_id
  LEFT JOIN blocked b ON b.uid = cs.c_user_id
  LEFT JOIN golf_courses gc ON gc.id = up.home_course_id
  WHERE b.uid IS NULL
    AND af.uid IS NULL
  ORDER BY cs.total_eng DESC, up.created_at DESC
  LIMIT p_limit;
END;
$$;