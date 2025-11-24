-- Drop the old achievement logging trigger and functions that reference non-existent achievement_data column

-- Drop trigger on user_top100_courses
DROP TRIGGER IF EXISTS trigger_course_achievement ON public.user_top100_courses;

-- Drop trigger on course_ratings  
DROP TRIGGER IF EXISTS log_top100_achievements ON public.course_ratings;

-- Drop the log_course_achievement function
DROP FUNCTION IF EXISTS public.log_course_achievement() CASCADE;

-- Drop the log_user_achievement function
DROP FUNCTION IF EXISTS public.log_user_achievement(UUID, TEXT, JSONB) CASCADE;

-- Note: The check_and_award_badges function is still valid and uses the correct user_badges table