CREATE OR REPLACE FUNCTION public.get_suggested_golfers(p_limit integer DEFAULT 24)
 RETURNS TABLE(user_id uuid, display_name text, username text, profile_photo_url text, reason_type text, reason_club_name text, reason_course_name text, mutual_count integer, recent_rounds integer, rounds_total integer, handicap_index numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
-- Reason priority: club, reciprocal, course, clubmate_mutual, mutual, active,
-- recently_joined. First match wins; a person is never shown without a reason.
-- A PENDING home club (home_club_pending_name) is never a club or clubmate reason.
-- INTENDED EIGHTH REASON: location proximity. golf_clubs carries latitude and
-- longitude, so once primary_club_id is widely filled, "golfers within 20 miles"
-- becomes derivable. Deliberately not built yet - it would fire for almost nobody.
WITH consts AS (
  SELECT 30 AS new_member_days, 14 AS active_days
),
viewer AS (
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
followers AS (
  SELECT f.follower_actor_id AS id
  FROM public.follows f, viewer v
  WHERE f.following_actor_type = 'personal'
    AND f.following_actor_id = v.id
    AND f.follower_actor_type = 'personal'
),
clubmates AS (
  SELECT p.id
  FROM public.user_profiles p, viewer v
  WHERE v.club_id IS NOT NULL
    AND p.primary_club_id = v.club_id
    AND p.id <> v.id
    AND p.deleted_at IS NULL
),
viewer_courses AS (
  SELECT DISTINCT r.course_id
  FROM public.gam_round_stats r, viewer v
  WHERE r.user_id = v.id AND r.course_id IS NOT NULL
),
cand AS (
  SELECT p.id, p.display_name, p.username, p.profile_photo_url, p.primary_club_id,
         p.created_at,
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
    (SELECT count(*) FROM public.gam_round_stats r, consts k
       WHERE r.user_id = c.id AND r.play_date >= current_date - k.active_days) AS recent_rounds,
    EXISTS (SELECT 1 FROM followers fr WHERE fr.id = c.id) AS follows_viewer,
    (SELECT count(*) FROM public.follows f
       JOIN followed fo ON fo.id = f.follower_actor_id
      WHERE f.follower_actor_type = 'personal'
        AND f.following_actor_type = 'personal'
        AND f.following_actor_id = c.id) AS mutuals,
    (SELECT count(*) FROM public.follows f
       JOIN clubmates cm ON cm.id = f.follower_actor_id
      WHERE f.follower_actor_type = 'personal'
        AND f.following_actor_type = 'personal'
        AND f.following_actor_id = c.id) AS clubmate_mutuals,
    (SELECT gc.name FROM public.golf_clubs gc, viewer v
      WHERE gc.id = c.primary_club_id
        AND v.club_id IS NOT NULL
        AND c.primary_club_id = v.club_id) AS club_name,
    (SELECT gc.name FROM public.golf_clubs gc, viewer v
      WHERE gc.id = v.club_id) AS viewer_club_name,
    (SELECT g.name FROM public.gam_round_stats r
       JOIN public.golf_courses g ON g.id = r.course_id
      WHERE r.user_id = c.id
        AND r.course_id IN (SELECT course_id FROM viewer_courses)
      ORDER BY r.play_date DESC NULLS LAST
      LIMIT 1) AS course_name,
    (c.created_at >= now() - ((SELECT new_member_days FROM consts) || ' days')::interval) AS is_new_member
  FROM cand c
),
ranked AS (
  SELECT s.*,
    CASE
      WHEN s.club_name IS NOT NULL THEN 'club'
      WHEN s.follows_viewer THEN 'reciprocal'
      WHEN s.course_name IS NOT NULL THEN 'course'
      WHEN s.clubmate_mutuals > 0 THEN 'clubmate_mutual'
      WHEN s.mutuals > 0 THEN 'mutual'
      WHEN s.recent_rounds > 0 THEN 'active'
      WHEN s.is_new_member THEN 'recently_joined'
      ELSE NULL
    END AS reason
  FROM stats s
)
SELECT r.id,
       r.display_name,
       r.username,
       r.profile_photo_url,
       r.reason,
       CASE
         WHEN r.reason = 'club' THEN r.club_name
         WHEN r.reason = 'clubmate_mutual' THEN r.viewer_club_name
       END AS reason_club_name,
       CASE WHEN r.reason = 'course' THEN r.course_name END AS reason_course_name,
       CASE WHEN r.reason = 'clubmate_mutual' THEN r.clubmate_mutuals::int
            ELSE r.mutuals::int END AS mutual_count,
       r.recent_rounds::int,
       r.rounds_total::int,
       r.hcp
FROM ranked r
WHERE r.reason IS NOT NULL
ORDER BY
  CASE r.reason
    WHEN 'club' THEN 0
    WHEN 'reciprocal' THEN 1
    WHEN 'course' THEN 2
    WHEN 'clubmate_mutual' THEN 3
    WHEN 'mutual' THEN 4
    WHEN 'active' THEN 5
    ELSE 6
  END,
  r.mutuals DESC,
  r.recent_rounds DESC,
  r.rounds_total DESC,
  r.id
LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 24), 60));
$function$;