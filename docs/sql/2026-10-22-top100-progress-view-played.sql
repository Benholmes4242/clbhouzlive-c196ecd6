-- BRIEF_TOP100_PROGRESS_VIEW_PLAYED_MIGRATION (2026-10-22)
--
-- The view was counting RATED courses as played (both count columns used
-- course_ratings only), so the profile's "Four lists, one life" showed members
-- far fewer Top 100s than the Explore page. Ben ran this fix directly on the
-- database; this file records the exact applied definition in the repo so a
-- later migration cannot silently revert it. Per project rule, SQL is run by
-- hand — this file is the record, not a migration. Do not change the SQL.

CREATE OR REPLACE VIEW public.user_top100_progress_view AS
WITH list_totals AS (
  SELECT tl.id, tl.slug, tl.name, count(DISTINCT ctm.course_id) AS total_courses
  FROM public.top100_lists tl
  JOIN public.course_top100_memberships ctm ON ctm.list_id = tl.id
  WHERE tl.is_active = true
  GROUP BY tl.id, tl.slug, tl.name
)
SELECT
  up.id AS user_id,
  lt.id AS list_id,
  lt.slug AS list_slug,
  lt.name AS list_name,
  lt.total_courses AS total_courses_in_list,
  (
    SELECT count(DISTINCT cr.course_id)
    FROM public.course_ratings cr
    JOIN public.course_top100_memberships m ON m.course_id = cr.course_id AND m.list_id = lt.id
    WHERE cr.user_id = up.id AND cr.rating IS NOT NULL
  ) AS courses_rated_in_list,
  (
    SELECT count(DISTINCT p.course_id)
    FROM (
      SELECT cr.course_id
      FROM public.course_ratings cr
      WHERE cr.user_id = up.id AND cr.rating IS NOT NULL
      UNION
      SELECT w.course_id
      FROM public.user_whs_played_golf_course_ids(up.id) w
    ) p
    JOIN public.course_top100_memberships m ON m.course_id = p.course_id AND m.list_id = lt.id
  ) AS courses_played_in_list
FROM public.user_profiles up
CROSS JOIN list_totals lt
WHERE public.can_view_top100(up.id, auth.uid());

COMMENT ON VIEW public.user_top100_progress_view IS
  'Per member, per active Top 100 list. PLAYED = a rating OR a logged WHS round (user_whs_played_golf_course_ids), the same definition as get_top100_list_progress and get_career_leaderboard. RATED = a rating only. One row per list for every member, zeros included. Gated by can_view_top100(owner, auth.uid()). Read it filtered by user_id.';
