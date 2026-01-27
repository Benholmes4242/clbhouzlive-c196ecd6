-- Create function to decrement courses_logged on rating delete
CREATE OR REPLACE FUNCTION decrement_season_stats_on_rating_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_season_id uuid;
  v_is_top100 boolean;
BEGIN
  -- Check if this was a Top 100 course
  SELECT EXISTS (
    SELECT 1 FROM course_top100_memberships WHERE course_id = OLD.course_id
  ) INTO v_is_top100;
  
  -- Only decrement if it was a Top 100 course
  IF v_is_top100 THEN
    -- Get current season
    SELECT id INTO v_season_id
    FROM championship_seasons
    WHERE status = 'active'
    LIMIT 1;
    
    IF v_season_id IS NOT NULL THEN
      -- Decrement courses_logged, but don't go below 0
      UPDATE user_season_stats
      SET 
        courses_logged = GREATEST(0, courses_logged - 1),
        updated_at = now()
      WHERE user_id = OLD.user_id
        AND season_id = v_season_id
        -- Only decrement if user has no other ratings for this course
        AND NOT EXISTS (
          SELECT 1 FROM course_ratings 
          WHERE user_id = OLD.user_id 
            AND course_id = OLD.course_id
            AND id != OLD.id
        );
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the DELETE trigger
DROP TRIGGER IF EXISTS trigger_decrement_season_stats_on_rating_delete ON course_ratings;
CREATE TRIGGER trigger_decrement_season_stats_on_rating_delete
  AFTER DELETE ON course_ratings
  FOR EACH ROW
  EXECUTE FUNCTION decrement_season_stats_on_rating_delete();

-- Global recalculation: Fix courses_logged for ALL users
UPDATE user_season_stats uss
SET 
  courses_logged = COALESCE((
    SELECT COUNT(DISTINCT cr.course_id)
    FROM course_ratings cr
    JOIN course_top100_memberships ctm ON ctm.course_id = cr.course_id
    WHERE cr.user_id = uss.user_id
  ), 0),
  updated_at = now();