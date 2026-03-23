-- 1. Drop the conflicting decrement trigger
DROP TRIGGER IF EXISTS trigger_decrement_season_stats_on_rating_delete ON course_ratings;

-- 2. Restore the correct season stats function with INSERT/DELETE support
--    Uses championship_seasons (not season_year) and INSERT ON CONFLICT for upsert
CREATE OR REPLACE FUNCTION update_user_season_stats_on_course_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id UUID;
  v_season_start DATE;
  v_season_end DATE;
  v_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_user_id := NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  END IF;

  -- Get current active season
  SELECT id, start_date, end_date
  INTO v_season_id, v_season_start, v_season_end
  FROM championship_seasons
  WHERE status = 'active'
  LIMIT 1;

  IF v_season_id IS NULL THEN
    IF TG_OP = 'INSERT' THEN RETURN NEW; ELSE RETURN OLD; END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Upsert: create row if missing, then set absolute count
    INSERT INTO user_season_stats (
      user_id, season_id, courses_logged,
      current_rank, current_division, active_streak_days, best_rank
    ) VALUES (
      v_user_id, v_season_id, 0, 0, 'rookie', 0, 0
    )
    ON CONFLICT (user_id, season_id) DO NOTHING;
  END IF;

  -- Set absolute count (works for both INSERT and DELETE)
  UPDATE user_season_stats
  SET courses_logged = (
    SELECT COUNT(DISTINCT cr.course_id)
    FROM course_ratings cr
    WHERE cr.user_id = v_user_id
      AND cr.is_mock = false
      AND cr.created_at::date >= v_season_start
      AND cr.created_at::date <= COALESCE(v_season_end, CURRENT_DATE + INTERVAL '1 year')
  )
  WHERE user_id = v_user_id
    AND season_id = v_season_id;

  IF TG_OP = 'INSERT' THEN RETURN NEW; ELSE RETURN OLD; END IF;
END;
$$;

-- 3. Re-create the trigger to fire on both INSERT and DELETE
DROP TRIGGER IF EXISTS trigger_update_season_stats_on_course_log ON course_ratings;
CREATE TRIGGER trigger_update_season_stats_on_course_log
  AFTER INSERT OR DELETE ON course_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_season_stats_on_course_log();

-- 4. Backfill courses_logged for all users in the active season
UPDATE user_season_stats uss
SET courses_logged = (
  SELECT COUNT(DISTINCT cr.course_id)
  FROM course_ratings cr
  JOIN championship_seasons cs ON cs.id = uss.season_id
  WHERE cr.user_id = uss.user_id
    AND cr.is_mock = false
    AND cr.created_at::date >= cs.start_date
    AND cr.created_at::date <= COALESCE(cs.end_date, CURRENT_DATE + INTERVAL '1 year')
)
WHERE uss.season_id IN (SELECT id FROM championship_seasons WHERE status = 'active');