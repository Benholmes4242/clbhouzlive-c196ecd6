-- Drop the old 6-parameter version that doesn't have country support
DROP FUNCTION IF EXISTS public.get_top100_course_leaderboard(text, text, text, integer, integer, uuid);