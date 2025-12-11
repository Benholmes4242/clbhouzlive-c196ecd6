-- Phase 3: Update course_rating_stats view to exclude mock data
-- This ensures it matches course_rating_aggregates and prevents future drift

-- Drop and recreate the view to exclude mock reviews
DROP VIEW IF EXISTS public.course_rating_stats;

CREATE VIEW public.course_rating_stats AS
SELECT
  course_id,
  AVG(rating) AS average_rating,
  COUNT(*) AS total_ratings,
  COUNT(CASE WHEN review IS NOT NULL AND review != '' THEN 1 END) AS total_reviews
FROM course_ratings
WHERE is_mock = false
GROUP BY course_id;

-- Add comment to document this is now real-only
COMMENT ON VIEW public.course_rating_stats IS 'Course rating statistics excluding mock/test data. Aligned with course_rating_aggregates.';