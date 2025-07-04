-- Add 2 more courses for Benjamin Holmes to reach 20 total for rookie badge
INSERT INTO user_top100_courses (user_id, course_id, played, played_date)
SELECT 
  'bf9f4a17-c61b-4e78-b9e9-b23e8c0ad92b',
  id,
  true,
  '2024-07-01'
FROM golf_courses 
WHERE (global_rank IS NOT NULL OR regional_rank IS NOT NULL OR usa_rank IS NOT NULL)
  AND id NOT IN (
    SELECT course_id FROM user_top100_courses WHERE user_id = 'bf9f4a17-c61b-4e78-b9e9-b23e8c0ad92b'
  )
LIMIT 2;