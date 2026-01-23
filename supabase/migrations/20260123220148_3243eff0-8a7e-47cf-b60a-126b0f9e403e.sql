-- Step 1: Create the trigger function
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
BEGIN
  -- Get current active season
  SELECT id, start_date, end_date 
  INTO v_season_id, v_season_start, v_season_end
  FROM championship_seasons
  WHERE status = 'active'
  LIMIT 1;

  -- If no active season, do nothing
  IF v_season_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if this course rating falls within the active season
  IF NEW.created_at::date >= v_season_start 
     AND NEW.created_at::date <= COALESCE(v_season_end, CURRENT_DATE + INTERVAL '1 year') THEN
    
    -- Upsert into user_season_stats
    INSERT INTO user_season_stats (
      user_id,
      season_id,
      courses_logged,
      current_rank,
      current_division,
      active_streak_days,
      best_rank
    )
    VALUES (
      NEW.user_id,
      v_season_id,
      1,
      0,
      'rookie',
      0,
      0
    )
    ON CONFLICT (user_id, season_id)
    DO UPDATE SET
      courses_logged = user_season_stats.courses_logged + 1;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 2: Create the trigger on course_ratings
DROP TRIGGER IF EXISTS trigger_update_season_stats_on_course_log ON course_ratings;
CREATE TRIGGER trigger_update_season_stats_on_course_log
  AFTER INSERT ON course_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_season_stats_on_course_log();

-- Step 3: Backfill existing course ratings into user_season_stats
DELETE FROM user_season_stats;

INSERT INTO user_season_stats (
  user_id,
  season_id,
  courses_logged,
  current_rank,
  current_division,
  active_streak_days,
  best_rank
)
SELECT 
  cr.user_id,
  cs.id as season_id,
  COUNT(*) as courses_logged,
  0 as current_rank,
  'rookie' as current_division,
  0 as active_streak_days,
  0 as best_rank
FROM course_ratings cr
CROSS JOIN championship_seasons cs
WHERE cs.status = 'active'
  AND cr.created_at::date >= cs.start_date
  AND cr.created_at::date <= COALESCE(cs.end_date, CURRENT_DATE + INTERVAL '1 year')
GROUP BY cr.user_id, cs.id;

-- Step 4: Refresh hall of fame all-time counts
INSERT INTO user_hall_of_fame (user_id, all_time_courses_logged, updated_at)
SELECT 
  cr.user_id,
  COUNT(*) as all_time_courses_logged,
  NOW()
FROM course_ratings cr
GROUP BY cr.user_id
ON CONFLICT (user_id) 
DO UPDATE SET
  all_time_courses_logged = EXCLUDED.all_time_courses_logged,
  updated_at = NOW();