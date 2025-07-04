-- Test adding some top 100 courses to verify badge system
INSERT INTO user_top100_courses (user_id, course_id, played, played_date)
VALUES 
  ('cbd1fc7d-6794-4692-8535-2087f49f4bd2', 'fc188eb5-74b5-488b-8843-6d73673e74b5', true, '2024-01-15'),
  ('cbd1fc7d-6794-4692-8535-2087f49f4bd2', '24322f61-753d-49e8-a59c-e3ef138cb4d3', true, '2024-02-20'),
  ('cbd1fc7d-6794-4692-8535-2087f49f4bd2', '1a1ced55-ad63-48c3-8c15-f38bf61c3f25', true, '2024-03-10'),
  ('cbd1fc7d-6794-4692-8535-2087f49f4bd2', 'bc4a9ccb-1660-46f9-92f8-f3f0af474182', true, '2024-04-05'),
  ('cbd1fc7d-6794-4692-8535-2087f49f4bd2', '1bdac75c-2d94-417f-bad8-1891620997a5', true, '2024-05-15');

-- Get 15 more courses to reach 20 total
INSERT INTO user_top100_courses (user_id, course_id, played, played_date)
SELECT 
  'cbd1fc7d-6794-4692-8535-2087f49f4bd2',
  id,
  true,
  '2024-06-01'
FROM golf_courses 
WHERE (global_rank IS NOT NULL OR regional_rank IS NOT NULL OR usa_rank IS NOT NULL)
  AND id NOT IN (
    'fc188eb5-74b5-488b-8843-6d73673e74b5',
    '24322f61-753d-49e8-a59c-e3ef138cb4d3',
    '1a1ced55-ad63-48c3-8c15-f38bf61c3f25',
    'bc4a9ccb-1660-46f9-92f8-f3f0af474182',
    '1bdac75c-2d94-417f-bad8-1891620997a5'
  )
LIMIT 15;