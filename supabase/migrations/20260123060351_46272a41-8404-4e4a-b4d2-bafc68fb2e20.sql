-- RPC: record_course_log_impact
-- Called after a user logs a course to calculate the rank impact for the celebration modal
-- Returns before/after rank, division changes, rivals passed, etc.

CREATE OR REPLACE FUNCTION public.record_course_log_impact(
  p_user_id UUID,
  p_course_id UUID DEFAULT NULL
)
RETURNS TABLE (
  rank_before INT,
  rank_after INT,
  rank_change INT,
  division_before TEXT,
  division_after TEXT,
  division_changed BOOLEAN,
  promoted BOOLEAN,
  courses_before INT,
  courses_after INT,
  rivals_passed TEXT[],
  new_streak INT,
  season_name TEXT,
  days_remaining INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id UUID;
  v_rank_before INT;
  v_rank_after INT;
  v_division_before TEXT;
  v_division_after TEXT;
  v_courses_before INT;
  v_courses_after INT;
  v_rivals_passed TEXT[] := ARRAY[]::TEXT[];
  v_season_name TEXT;
  v_days_remaining INT;
  v_new_streak INT;
BEGIN
  -- Get active season
  SELECT id, name, 
         GREATEST(0, EXTRACT(DAY FROM (end_date::timestamp - NOW()::timestamp))::INT)
  INTO v_season_id, v_season_name, v_days_remaining
  FROM championship_seasons
  WHERE status = 'active'
  LIMIT 1;
  
  IF v_season_id IS NULL THEN
    -- No active season, return empty result
    RETURN QUERY SELECT 
      0::INT, 0::INT, 0::INT, 
      'Rookie Club'::TEXT, 'Rookie Club'::TEXT, 
      FALSE, FALSE, 
      0::INT, 0::INT, 
      ARRAY[]::TEXT[], 
      0::INT, 
      'No Season'::TEXT, 
      0::INT;
    RETURN;
  END IF;

  -- Get current stats (before the log is counted)
  SELECT 
    COALESCE(current_rank, 9999),
    current_division,
    courses_logged,
    COALESCE(active_streak_days, 0)
  INTO v_rank_before, v_division_before, v_courses_before, v_new_streak
  FROM user_season_stats
  WHERE user_id = p_user_id AND season_id = v_season_id;
  
  -- If no stats exist, initialize defaults
  IF v_rank_before IS NULL THEN
    v_rank_before := 9999;
    v_division_before := 'Rookie Club';
    v_courses_before := 0;
    v_new_streak := 0;
  END IF;
  
  -- Calculate new courses count
  v_courses_after := v_courses_before + 1;
  
  -- Determine new division based on courses
  v_division_after := CASE 
    WHEN v_courses_after >= 50 THEN 'Champion Club'
    WHEN v_courses_after >= 30 THEN 'Masters Club'
    WHEN v_courses_after >= 20 THEN 'Elite Club'
    WHEN v_courses_after >= 10 THEN 'Contender Club'
    WHEN v_courses_after >= 5 THEN 'Rising Club'
    ELSE 'Rookie Club'
  END;
  
  -- Calculate new rank (count users with more courses)
  SELECT COUNT(*) + 1 INTO v_rank_after
  FROM user_season_stats
  WHERE season_id = v_season_id
    AND courses_logged > v_courses_after
    AND user_id != p_user_id;
  
  -- Find rivals we passed (users we just overtook)
  SELECT ARRAY_AGG(up.display_name)
  INTO v_rivals_passed
  FROM user_season_stats uss
  JOIN user_profiles up ON up.id = uss.user_id
  WHERE uss.season_id = v_season_id
    AND uss.user_id != p_user_id
    AND uss.courses_logged = v_courses_after  -- They have same as our new count
    AND uss.current_rank IS NOT NULL
    AND uss.current_rank >= v_rank_before  -- They were at or below our old rank
  LIMIT 3;
  
  -- Increment streak (simplified - assumes called on log day)
  v_new_streak := v_new_streak + 1;
  
  -- Update the user's season stats
  INSERT INTO user_season_stats (
    user_id, season_id, courses_logged, current_rank, 
    current_division, highest_division_reached,
    active_streak_days, longest_streak_days, last_activity_at
  ) VALUES (
    p_user_id, v_season_id, v_courses_after, v_rank_after,
    v_division_after, v_division_after,
    v_new_streak, v_new_streak, NOW()
  )
  ON CONFLICT (user_id, season_id) DO UPDATE SET
    courses_logged = v_courses_after,
    current_rank = v_rank_after,
    current_division = v_division_after,
    highest_division_reached = CASE 
      WHEN EXCLUDED.current_division IN ('Champion Club', 'Masters Club', 'Elite Club') 
           AND user_season_stats.highest_division_reached NOT IN ('Champion Club', 'Masters Club', 'Elite Club')
      THEN EXCLUDED.current_division
      ELSE user_season_stats.highest_division_reached
    END,
    active_streak_days = v_new_streak,
    longest_streak_days = GREATEST(user_season_stats.longest_streak_days, v_new_streak),
    last_activity_at = NOW(),
    updated_at = NOW();

  -- Return the impact summary
  RETURN QUERY SELECT
    v_rank_before,
    v_rank_after,
    v_rank_before - v_rank_after,  -- Positive = climbed
    v_division_before,
    v_division_after,
    v_division_before != v_division_after,
    v_division_before != v_division_after AND 
      (SELECT sort_order FROM division_config WHERE slug = LOWER(REPLACE(v_division_after, ' ', '-'))) >
      (SELECT sort_order FROM division_config WHERE slug = LOWER(REPLACE(v_division_before, ' ', '-'))),
    v_courses_before,
    v_courses_after,
    COALESCE(v_rivals_passed, ARRAY[]::TEXT[]),
    v_new_streak,
    v_season_name,
    v_days_remaining;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.record_course_log_impact TO authenticated;

-- RPC: snapshot_daily_ranks
-- Called by cron job to capture daily rank snapshots for movement tracking

CREATE OR REPLACE FUNCTION public.snapshot_daily_ranks()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id UUID;
  v_today DATE := CURRENT_DATE;
  v_count INT := 0;
BEGIN
  -- Get active season
  SELECT id INTO v_season_id
  FROM championship_seasons
  WHERE status = 'active'
  LIMIT 1;
  
  IF v_season_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Delete any existing snapshot for today (idempotent)
  DELETE FROM user_rank_snapshots
  WHERE season_id = v_season_id AND snapshot_date = v_today;
  
  -- Insert new snapshots for all users with season stats
  INSERT INTO user_rank_snapshots (user_id, season_id, snapshot_date, rank_at_snapshot, courses_at_snapshot)
  SELECT 
    user_id,
    season_id,
    v_today,
    current_rank,
    courses_logged
  FROM user_season_stats
  WHERE season_id = v_season_id
    AND current_rank IS NOT NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- Grant execute (will be called by service role via cron)
GRANT EXECUTE ON FUNCTION public.snapshot_daily_ranks TO service_role;