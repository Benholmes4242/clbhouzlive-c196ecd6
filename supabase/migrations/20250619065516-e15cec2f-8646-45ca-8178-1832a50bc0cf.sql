
-- Remove all user course tracking data first (due to foreign key constraints)
DELETE FROM public.user_top100_courses;
DELETE FROM public.user_courses;
DELETE FROM public.user_course_tracker;

-- Remove all golf courses
DELETE FROM public.golf_courses;
