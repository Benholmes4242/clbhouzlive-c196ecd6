CREATE OR REPLACE FUNCTION public.get_suggested_golfers(p_limit integer DEFAULT 24)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  username text,
  profile_photo_url text,
  reason_type text,
  reason_club_name text,
  reason_course_name text,
  mutual_count integer,
  recent_rounds integer,
  rounds_total integer,
  handicap_index numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH viewer AS (
  SELECT p.id, p.primary_club_id AS club_id
  FROM public.user_profiles p
  WHERE p.id = auth.uid()
),
followed AS (
  SELECT f.following_actor_id AS id
  FROM public.follows f, viewer v
  WHERE f.follower_actor_type = 'personal'
    AND f.follower_actor_id = v.id
    AND f.following_actor_type = 'personal'
),
viewer_courses AS (
  SELECT DISTINCT r.course_id
  FROM public.gam_round_stats r, viewer v
  WHERE r.user_id = v.id AND r.course_id IS NOT NULL
),
cand AS (
  SELECT p.id, p.display_name, p.username, p.profile_photo_url, p.primary_club_id,
         COALESCE(p.eg_handicap_index, p.manual_handicap_index) AS hcp
  FROM public.user_profiles p, viewer v
  WHERE p.id <> v.id
    AND p.deleted_at IS NULL
    AND COALESCE(p.is_test, false) = false
    AND NOT EXISTS (SELECT 1 FROM followed fo WHERE fo.id = p.id)
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_actors b
      WHERE (b.blocker_actor_id = v.id AND b.blocked_actor_id = p.id)
         OR (b.blocker_actor_id = p.id AND b.blocked_actor_id = v.id)
    )
),
stats AS (
  SELECT c.*,
    (SELECT count(*) FROM public.gam_round_stats r WHERE r.user_id = c.id) AS rounds_total,
    (SELECT count(*) FROM public.gam_round_stats r
       WHERE r.user_id = c.id AND r.play_date >= current_date - 14) AS recent_rounds,
    (SELECT count(*) FROM public.follows f
       JOIN followed fo ON fo.id = f.follower_actor_id
      WHERE f.follower_actor_type = 'personal'
        AND f.following_actor_type = 'personal'
        AND f.following_actor_id = c.id) AS mutuals,
    (SELECT gc.name FROM public.golf_clubs gc, viewer v
      WHERE gc.id = c.primary_club_id
        AND v.club_id IS NOT NULL
        AND c.primary_club_id = v.club_id) AS club_name,
    (SELECT g.name FROM public.gam_round_stats r
       JOIN public.golf_courses g ON g.id = r.course_id
      WHERE r.user_id = c.id
        AND r.course_id IN (SELECT course_id FROM viewer_courses)
      ORDER BY r.play_date DESC NULLS LAST
      LIMIT 1) AS course_name
  FROM cand c
)
SELECT s.id,
       s.display_name,
       s.username,
       s.profile_photo_url,
       CASE
         WHEN s.club_name IS NOT NULL THEN 'club'
         WHEN s.course_name IS NOT NULL THEN 'course'
         WHEN s.mutuals > 0 THEN 'mutual'
         ELSE 'active'
       END AS reason_type,
       CASE WHEN s.club_name IS NOT NULL THEN s.club_name END AS reason_club_name,
       CASE WHEN s.club_name IS NULL THEN s.course_name END AS reason_course_name,
       s.mutuals::int,
       s.recent_rounds::int,
       s.rounds_total::int,
       s.hcp
FROM stats s
WHERE s.club_name IS NOT NULL
   OR s.course_name IS NOT NULL
   OR s.mutuals > 0
   OR s.recent_rounds > 0
ORDER BY
  CASE
    WHEN s.club_name IS NOT NULL THEN 0
    WHEN s.course_name IS NOT NULL THEN 1
    WHEN s.mutuals > 0 THEN 2
    ELSE 3
  END,
  s.mutuals DESC,
  s.recent_rounds DESC,
  s.rounds_total DESC,
  s.id
LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 24), 60));
$$;

REVOKE ALL ON FUNCTION public.get_suggested_golfers(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_suggested_golfers(integer) TO authenticated;
