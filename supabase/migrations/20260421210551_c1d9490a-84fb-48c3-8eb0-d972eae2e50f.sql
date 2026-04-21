
CREATE OR REPLACE FUNCTION public.get_global_course_videos(
  p_user_id uuid,
  p_limit int DEFAULT 12,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  post_id uuid,
  media_id uuid,
  course_id uuid,
  course_name text,
  poster_url text,
  hls_url text,
  duration_ms int,
  creator_name text,
  creator_avatar_url text,
  like_count int,
  created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH watched AS (
    SELECT DISTINCT ucp.post_id AS watched_post_id
    FROM user_content_preferences ucp
    WHERE ucp.user_id = p_user_id
      AND ucp.signal_type IN ('watched_partial','watched_complete')
      AND ucp.post_id IS NOT NULL
  ),
  resolved AS (
    SELECT
      p.id AS pid,
      pm.id AS mid,
      COALESCE(p.course_id, pc.course_id) AS cid,
      pm.poster_url,
      pm.hls_url,
      pm.duration_ms,
      p.user_id AS creator_uid,
      p.like_count AS lc,
      p.created_at AS ca
    FROM posts p
    JOIN post_media pm ON pm.post_id = p.id AND pm.media_type = 'video'
    LEFT JOIN LATERAL (
      SELECT pc.course_id FROM post_courses pc
      WHERE pc.post_id = p.id ORDER BY pc.display_order ASC LIMIT 1
    ) pc ON true
    WHERE p.status = 'published'
      AND COALESCE(p.course_id, pc.course_id) IS NOT NULL
      AND p.id NOT IN (SELECT w.watched_post_id FROM watched w)
  )
  SELECT
    r.pid,
    r.mid,
    r.cid,
    gc.name,
    r.poster_url,
    r.hls_url,
    r.duration_ms::int,
    up.display_name,
    up.profile_photo_url,
    COALESCE(r.lc, 0),
    r.ca
  FROM resolved r
  JOIN golf_courses gc ON gc.id = r.cid
  LEFT JOIN user_profiles up ON up.id = r.creator_uid
  ORDER BY (COALESCE(r.lc,0) * 2 + GREATEST(0, 30 - EXTRACT(DAY FROM (now() - r.ca))::int)) DESC,
           r.ca DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
