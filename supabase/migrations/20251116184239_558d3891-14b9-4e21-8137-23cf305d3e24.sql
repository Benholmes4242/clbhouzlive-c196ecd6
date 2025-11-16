-- Create performance view for user Top 100 progress
-- This eliminates N+1 queries by pre-aggregating progress per user per list
CREATE OR REPLACE VIEW user_top100_progress_view AS
WITH user_list AS (
  SELECT DISTINCT user_id
  FROM user_course_activity
)
SELECT
  ul.user_id,
  tl.id AS list_id,
  tl.slug AS list_slug,
  tl.name AS list_name,
  COUNT(DISTINCT ctm.course_id) AS total_courses_in_list,
  COUNT(DISTINCT CASE WHEN uca.course_id IS NOT NULL THEN ctm.course_id END) AS courses_played_in_list
FROM user_list ul
CROSS JOIN top100_lists tl
LEFT JOIN course_top100_memberships ctm ON ctm.list_id = tl.id
LEFT JOIN user_course_activity uca 
  ON uca.course_id = ctm.course_id 
  AND uca.user_id = ul.user_id
WHERE tl.is_active = true
GROUP BY ul.user_id, tl.id, tl.slug, tl.name;

-- Grant read access to authenticated users
GRANT SELECT ON user_top100_progress_view TO authenticated;