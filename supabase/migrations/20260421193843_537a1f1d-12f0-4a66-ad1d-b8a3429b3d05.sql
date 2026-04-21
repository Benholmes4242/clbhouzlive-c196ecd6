-- Friends tab Level 2: support per-course nudge dismissal + batched friend-course activity RPC

-- 1. Add nullable course_id (post_id stays NOT NULL since it's part of the PK; we still
--    write the originating post_id when a user dismisses a nudge — course_id is the lookup key)
ALTER TABLE public.user_content_preferences
  ADD COLUMN IF NOT EXISTS course_id uuid NULL;

-- Index for fast lookup of recent dismissals per (user, course)
CREATE INDEX IF NOT EXISTS idx_ucp_user_course_signal
  ON public.user_content_preferences (user_id, course_id, signal_type, last_interaction_at DESC)
  WHERE course_id IS NOT NULL;

-- 2. Batched RPC: friend-course activity for a feed page
CREATE OR REPLACE FUNCTION public.get_friend_course_activity(
  p_user_id uuid,
  p_course_ids uuid[]
)
RETURNS TABLE (
  course_id uuid,
  friend_played_count int,
  top_friend_names text[],
  top_friend_avatars text[],
  network_rating_avg numeric,
  network_rating_count int,
  self_has_played boolean,
  self_has_reviewed boolean,
  nudge_dismissed_recently boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH friends AS (
    -- Mirror get_friends_feed's connection set: mutual friends ∪ one-way follows (personal only)
    SELECT uf.friend_id AS fid
    FROM user_friends uf
    WHERE uf.user_id = p_user_id AND uf.status = 'accepted'
    UNION
    SELECT uf2.user_id
    FROM user_friends uf2
    WHERE uf2.friend_id = p_user_id AND uf2.status = 'accepted'
    UNION
    SELECT ufl.following_id
    FROM user_follows ufl
    WHERE ufl.follower_id = p_user_id
  ),
  played AS (
    SELECT uca.course_id AS cid, uca.user_id AS uid, uca.played_at
    FROM user_course_activity uca
    WHERE uca.has_played = true
      AND uca.course_id = ANY(p_course_ids)
      AND uca.user_id IN (SELECT fid FROM friends)
      AND uca.user_id <> p_user_id
  ),
  ranked AS (
    SELECT p.cid, up.display_name, up.profile_photo_url,
      ROW_NUMBER() OVER (PARTITION BY p.cid ORDER BY p.played_at DESC NULLS LAST) AS rn
    FROM played p
    JOIN user_profiles up ON up.id = p.uid
  ),
  top_friends AS (
    SELECT cid,
      ARRAY_AGG(display_name ORDER BY rn) FILTER (WHERE rn <= 3) AS names,
      ARRAY_AGG(profile_photo_url ORDER BY rn) FILTER (WHERE rn <= 3) AS avatars
    FROM ranked
    GROUP BY cid
  ),
  play_counts AS (
    SELECT cid, COUNT(DISTINCT uid)::int AS cnt
    FROM played
    GROUP BY cid
  ),
  network_ratings AS (
    SELECT cr.course_id AS cid,
      AVG(cr.rating)::numeric AS avg_r,
      COUNT(*)::int AS cnt_r
    FROM course_ratings cr
    WHERE cr.course_id = ANY(p_course_ids)
      AND cr.user_id IN (SELECT fid FROM friends)
      AND cr.user_id <> p_user_id
      AND cr.rating IS NOT NULL
      AND cr.is_mock IS NOT TRUE
    GROUP BY cr.course_id
  ),
  self_played AS (
    SELECT uca.course_id AS cid
    FROM user_course_activity uca
    WHERE uca.user_id = p_user_id
      AND uca.has_played = true
      AND uca.course_id = ANY(p_course_ids)
  ),
  self_reviewed AS (
    SELECT cr.course_id AS cid
    FROM course_ratings cr
    WHERE cr.user_id = p_user_id
      AND cr.course_id = ANY(p_course_ids)
  ),
  dismissed AS (
    SELECT DISTINCT ucp.course_id AS cid
    FROM user_content_preferences ucp
    WHERE ucp.user_id = p_user_id
      AND ucp.signal_type = 'nudge_dismissed'
      AND ucp.course_id = ANY(p_course_ids)
      AND ucp.last_interaction_at > NOW() - INTERVAL '7 days'
  )
  SELECT
    c.cid AS course_id,
    COALESCE(pc.cnt, 0) AS friend_played_count,
    COALESCE(tf.names, ARRAY[]::text[]) AS top_friend_names,
    COALESCE(tf.avatars, ARRAY[]::text[]) AS top_friend_avatars,
    CASE WHEN nr.cnt_r >= 2 THEN ROUND(nr.avg_r, 1) ELSE NULL END AS network_rating_avg,
    COALESCE(nr.cnt_r, 0) AS network_rating_count,
    (sp.cid IS NOT NULL) AS self_has_played,
    (sr.cid IS NOT NULL) AS self_has_reviewed,
    (d.cid IS NOT NULL) AS nudge_dismissed_recently
  FROM (SELECT UNNEST(p_course_ids) AS cid) c
  LEFT JOIN play_counts pc ON pc.cid = c.cid
  LEFT JOIN top_friends tf ON tf.cid = c.cid
  LEFT JOIN network_ratings nr ON nr.cid = c.cid
  LEFT JOIN self_played sp ON sp.cid = c.cid
  LEFT JOIN self_reviewed sr ON sr.cid = c.cid
  LEFT JOIN dismissed d ON d.cid = c.cid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_friend_course_activity(uuid, uuid[]) TO authenticated;