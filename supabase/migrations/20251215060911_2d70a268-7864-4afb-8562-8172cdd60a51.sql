-- =============================================================
-- REVERT: Progress counts should match previous behavior:
-- "Played" = has rating OR explicit played flag (legacy)
-- Top 100 Club = rated counts (ratings)
-- Also re-apply GRANTs after recreating views.
-- =============================================================

DROP VIEW IF EXISTS public.user_top100_progress_view CASCADE;
DROP VIEW IF EXISTS public.user_course_activity CASCADE;

-- Activity view: include both played flags + ratings
CREATE VIEW public.user_course_activity AS
SELECT
  u.user_id,
  u.course_id,
  u.first_played_at,
  u.last_played_at,
  u.rating_value,
  u.has_review,
  u.has_rating,
  u.has_played,
  u.in_top_ten,
  u.is_top100
FROM (
  -- played flag source
  SELECT
    utc.user_id,
    utc.course_id,
    utc.played_date::timestamptz AS first_played_at,
    utc.updated_at AS last_played_at,
    cr.rating AS rating_value,
    (cr.review IS NOT NULL AND cr.review <> '') AS has_review,
    (cr.rating IS NOT NULL) AS has_rating,
    utc.played AS has_played,
    false AS in_top_ten,
    true AS is_top100
  FROM public.user_top100_courses utc
  JOIN public.golf_courses gc ON gc.id = utc.course_id
  LEFT JOIN public.course_ratings cr
    ON cr.user_id = utc.user_id AND cr.course_id = utc.course_id
  WHERE utc.played = true

  UNION

  -- ratings source (counts as "played" in legacy behaviour)
  SELECT
    cr.user_id,
    cr.course_id,
    cr.created_at AS first_played_at,
    cr.updated_at AS last_played_at,
    cr.rating AS rating_value,
    (cr.review IS NOT NULL AND cr.review <> '') AS has_review,
    true AS has_rating,
    true AS has_played, -- LEGACY: rated implies played
    false AS in_top_ten,
    true AS is_top100
  FROM public.course_ratings cr
  JOIN public.golf_courses gc ON gc.id = cr.course_id
) u;

-- Progress view using user_profiles as base
CREATE VIEW public.user_top100_progress_view AS
WITH user_list AS (
  SELECT id AS user_id FROM public.user_profiles
)
SELECT
  ul.user_id,
  tl.id AS list_id,
  tl.slug AS list_slug,
  tl.name AS list_name,
  COUNT(DISTINCT ctm.course_id) AS total_courses_in_list,
  COUNT(DISTINCT CASE WHEN uca.has_played THEN ctm.course_id END) AS courses_played_in_list,
  COUNT(DISTINCT CASE WHEN uca.has_rating THEN ctm.course_id END) AS courses_rated_in_list
FROM user_list ul
CROSS JOIN public.top100_lists tl
LEFT JOIN public.course_top100_memberships ctm ON ctm.list_id = tl.id
LEFT JOIN public.user_course_activity uca
  ON uca.course_id = ctm.course_id AND uca.user_id = ul.user_id
WHERE tl.is_active = true
GROUP BY ul.user_id, tl.id, tl.slug, tl.name;

-- Re-apply permissions (critical after DROP/CREATE)
GRANT SELECT ON public.user_course_activity TO authenticated;
GRANT SELECT ON public.user_top100_progress_view TO authenticated;
GRANT SELECT ON public.user_course_activity TO anon;
GRANT SELECT ON public.user_top100_progress_view TO anon;