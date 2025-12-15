-- Fix user_top100_progress_view to not depend on user_profiles
-- This ensures any user with at least 1 Top 100 rating appears correctly

DROP VIEW IF EXISTS public.user_top100_progress_view;

CREATE VIEW public.user_top100_progress_view AS
SELECT
  cr.user_id,
  tl.id   AS list_id,
  tl.slug AS list_slug,
  tl.name AS list_name,
  COUNT(DISTINCT ctm.course_id) AS total_courses_in_list,
  COUNT(DISTINCT cr.course_id)  AS courses_rated_in_list,
  COUNT(DISTINCT cr.course_id)  AS courses_played_in_list
FROM public.top100_lists tl
JOIN public.course_top100_memberships ctm
  ON ctm.list_id = tl.id
JOIN public.course_ratings cr
  ON cr.course_id = ctm.course_id
WHERE tl.is_active = true
  AND cr.rating IS NOT NULL
GROUP BY cr.user_id, tl.id, tl.slug, tl.name;

GRANT SELECT ON public.user_top100_progress_view TO authenticated;
GRANT SELECT ON public.user_top100_progress_view TO anon;