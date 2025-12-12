
-- Delete all mock reviews from course_ratings
-- This removes 58 mock reviews across 35 courses that were created during testing
DELETE FROM course_ratings WHERE is_mock = true;
