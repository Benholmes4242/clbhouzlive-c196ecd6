-- Add 2 more courses for Benjamin Holmes to reach 20 total for rookie badge
INSERT INTO user_top100_courses (user_id, course_id, played, played_date)
SELECT 
  '6a5bcbb9-c22c-4655-ad8e-088b2858ca3e',
  id,
  true,
  '2024-07-01'
FROM golf_courses 
WHERE (global_rank IS NOT NULL OR regional_rank IS NOT NULL OR usa_rank IS NOT NULL)
  AND id NOT IN (
    SELECT course_id FROM user_top100_courses WHERE user_id = '6a5bcbb9-c22c-4655-ad8e-088b2858ca3e'
  )
LIMIT 2;