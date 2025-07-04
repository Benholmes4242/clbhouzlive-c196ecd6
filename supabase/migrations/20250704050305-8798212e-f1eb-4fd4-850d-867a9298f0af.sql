-- Fix the trigger_badge_check function to handle different table structures
CREATE OR REPLACE FUNCTION public.trigger_badge_check()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check badges for the affected user based on table type
  CASE TG_TABLE_NAME
    WHEN 'user_top100_courses' THEN
      PERFORM public.check_and_award_badges(NEW.user_id);
    WHEN 'posts' THEN
      PERFORM public.check_and_award_badges(NEW.user_id);
    WHEN 'course_ratings' THEN
      PERFORM public.check_and_award_badges(NEW.user_id);
    WHEN 'user_follows' THEN
      PERFORM public.check_and_award_badges(NEW.follower_id);
  END CASE;
  
  RETURN NEW;
END;
$$;