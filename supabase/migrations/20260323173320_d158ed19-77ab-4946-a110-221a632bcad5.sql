-- Fix existing season stats trigger to handle DELETE and use COUNT(DISTINCT)
CREATE OR REPLACE FUNCTION update_season_stats_on_course_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_season_stats
    SET courses_logged = (
      SELECT COUNT(DISTINCT course_id)
      FROM course_ratings
      WHERE user_id = NEW.user_id
      AND is_mock = false
    )
    WHERE user_id = NEW.user_id
    AND season_year = EXTRACT(YEAR FROM NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_season_stats
    SET courses_logged = (
      SELECT COUNT(DISTINCT course_id)
      FROM course_ratings
      WHERE user_id = OLD.user_id
      AND is_mock = false
    )
    WHERE user_id = OLD.user_id
    AND season_year = EXTRACT(YEAR FROM NOW());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing trigger to also fire on DELETE
DROP TRIGGER IF EXISTS trigger_update_season_stats_on_course_log ON course_ratings;
CREATE TRIGGER trigger_update_season_stats_on_course_log
  AFTER INSERT OR DELETE ON course_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_season_stats_on_course_rating();

-- Also maintain all_time_courses_logged on user_hall_of_fame
CREATE OR REPLACE FUNCTION update_hall_of_fame_courses_logged()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_hall_of_fame
    SET all_time_courses_logged = (
      SELECT COUNT(DISTINCT course_id)
      FROM course_ratings
      WHERE user_id = NEW.user_id
      AND is_mock = false
    )
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_hall_of_fame
    SET all_time_courses_logged = (
      SELECT COUNT(DISTINCT course_id)
      FROM course_ratings
      WHERE user_id = OLD.user_id
      AND is_mock = false
    )
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_hall_of_fame_courses_logged
  AFTER INSERT OR DELETE ON course_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_hall_of_fame_courses_logged();