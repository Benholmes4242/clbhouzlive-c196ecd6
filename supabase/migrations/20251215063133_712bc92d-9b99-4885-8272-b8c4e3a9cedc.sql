-- 1) Normalize to 1 decimal place (preserves 9.7, just trims 9.74 -> 9.7)
UPDATE public.course_ratings
SET rating = round(rating::numeric, 1)
WHERE rating <> round(rating::numeric, 1);

-- 2) Enforce NOT NULL
ALTER TABLE public.course_ratings
ALTER COLUMN rating SET NOT NULL;

-- 3) Drop old constraint if exists
ALTER TABLE public.course_ratings
DROP CONSTRAINT IF EXISTS course_ratings_rating_1_to_10;

-- 4) Enforce rating range 0.0–10.0 AND max 1 decimal place
ALTER TABLE public.course_ratings
ADD CONSTRAINT course_ratings_rating_0_to_10_one_decimal
CHECK (
  rating >= 0
  AND rating <= 10
  AND rating = round(rating::numeric, 1)
);

-- 5) Prevent duplicates (one rating per user per course)
CREATE UNIQUE INDEX IF NOT EXISTS course_ratings_user_course_unique
ON public.course_ratings (user_id, course_id);

-- 6) Drop existing views first
DROP VIEW IF EXISTS public.user_top100_progress_view;
DROP VIEW IF EXISTS public.user_course_activity;

-- 7) Make user_course_activity ratings-only
CREATE VIEW public.user_course_activity AS
SELECT
  cr.user_id,
  cr.course_id,
  cr.created_at AS first_activity_at,
  cr.updated_at AS last_activity_at,
  cr.rating AS rating_value,
  (cr.review IS NOT NULL AND cr.review <> '') AS has_review,
  true AS has_rating,
  true AS has_played
FROM public.course_ratings cr;

-- 8) Make progress counts ratings-only
CREATE VIEW public.user_top100_progress_view AS
WITH user_list AS (
  SELECT id AS user_id FROM public.user_profiles
)
SELECT
  ul.user_id,
  tl.id AS list_id,
  tl.slug AS list_slug,
  tl.name AS list_name,
  count(DISTINCT ctm.course_id) AS total_courses_in_list,
  count(DISTINCT CASE WHEN uca.has_played THEN ctm.course_id END) AS courses_played_in_list,
  count(DISTINCT CASE WHEN uca.has_rating THEN ctm.course_id END) AS courses_rated_in_list
FROM user_list ul
CROSS JOIN public.top100_lists tl
LEFT JOIN public.course_top100_memberships ctm ON ctm.list_id = tl.id
LEFT JOIN public.user_course_activity uca
  ON uca.course_id = ctm.course_id AND uca.user_id = ul.user_id
WHERE tl.is_active = true
GROUP BY ul.user_id, tl.id, tl.slug, tl.name;

-- 9) Re-apply GRANTs
GRANT SELECT ON public.user_course_activity TO authenticated;
GRANT SELECT ON public.user_top100_progress_view TO authenticated;
GRANT SELECT ON public.user_course_activity TO anon;
GRANT SELECT ON public.user_top100_progress_view TO anon;