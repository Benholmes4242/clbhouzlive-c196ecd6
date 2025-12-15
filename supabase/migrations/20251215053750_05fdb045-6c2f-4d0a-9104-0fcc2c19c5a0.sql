-- =============================================================
-- CANONICAL PLAYED DEFINITION: played = user_top100_courses.played flag
-- rated = course_ratings entry (separate concept)
-- =============================================================

-- Drop and recreate user_course_activity to include played flag as primary source
DROP VIEW IF EXISTS user_top100_progress_view CASCADE;
DROP VIEW IF EXISTS user_course_activity CASCADE;

-- Create user_course_activity that unions played + rated + shortlisted
-- Each activity type is tracked separately for clear semantics
CREATE VIEW public.user_course_activity AS
SELECT
  utc.user_id,
  utc.course_id,
  utc.played_date::timestamp with time zone AS first_played_at,
  utc.updated_at AS last_played_at,
  cr.rating AS rating_value,
  CASE WHEN cr.review IS NOT NULL AND cr.review <> '' THEN true ELSE false END AS has_review,
  CASE WHEN cr.rating IS NOT NULL THEN true ELSE false END AS has_rating,
  utc.played AS has_played,  -- CANONICAL played flag
  false AS in_top_ten,
  CASE
    WHEN gc.global_rank IS NOT NULL AND gc.global_rank >= 1 AND gc.global_rank <= 100 THEN true
    WHEN EXISTS (SELECT 1 FROM course_top100_memberships ctm WHERE ctm.course_id = gc.id) THEN true
    ELSE false
  END AS is_top100
FROM public.user_top100_courses utc
JOIN public.golf_courses gc ON gc.id = utc.course_id
LEFT JOIN public.course_ratings cr ON cr.user_id = utc.user_id AND cr.course_id = utc.course_id
WHERE utc.played = true

UNION

-- Also include users who have rated courses but not explicitly marked played
-- (for backwards compatibility, but has_played will be false)
SELECT
  cr.user_id,
  cr.course_id,
  cr.created_at AS first_played_at,
  cr.updated_at AS last_played_at,
  cr.rating AS rating_value,
  CASE WHEN cr.review IS NOT NULL AND cr.review <> '' THEN true ELSE false END AS has_review,
  true AS has_rating,
  COALESCE(utc.played, false) AS has_played,  -- May not have explicit played flag
  false AS in_top_ten,
  CASE
    WHEN gc.global_rank IS NOT NULL AND gc.global_rank >= 1 AND gc.global_rank <= 100 THEN true
    WHEN EXISTS (SELECT 1 FROM course_top100_memberships ctm WHERE ctm.course_id = gc.id) THEN true
    ELSE false
  END AS is_top100
FROM public.course_ratings cr
JOIN public.golf_courses gc ON gc.id = cr.course_id
LEFT JOIN public.user_top100_courses utc ON utc.user_id = cr.user_id AND utc.course_id = cr.course_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_top100_courses utc2
  WHERE utc2.user_id = cr.user_id AND utc2.course_id = cr.course_id AND utc2.played = true
);

-- Recreate user_top100_progress_view to use CANONICAL played definition
CREATE VIEW public.user_top100_progress_view AS
WITH user_list AS (
  SELECT DISTINCT user_id FROM user_course_activity
)
SELECT
  ul.user_id,
  tl.id AS list_id,
  tl.slug AS list_slug,
  tl.name AS list_name,
  COUNT(DISTINCT ctm.course_id) AS total_courses_in_list,
  -- CANONICAL: count only courses with has_played = true
  COUNT(DISTINCT CASE WHEN uca.has_played = true THEN ctm.course_id ELSE NULL END) AS courses_played_in_list,
  -- Separate count for rated courses (for Top 100 Club)
  COUNT(DISTINCT CASE WHEN uca.has_rating = true THEN ctm.course_id ELSE NULL END) AS courses_rated_in_list
FROM user_list ul
CROSS JOIN public.top100_lists tl
LEFT JOIN public.course_top100_memberships ctm ON ctm.list_id = tl.id
LEFT JOIN public.user_course_activity uca ON uca.course_id = ctm.course_id AND uca.user_id = ul.user_id
WHERE tl.is_active = true
GROUP BY ul.user_id, tl.id, tl.slug, tl.name;