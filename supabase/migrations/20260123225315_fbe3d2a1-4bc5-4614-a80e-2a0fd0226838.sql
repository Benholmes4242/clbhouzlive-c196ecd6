-- Drop existing function with different return type
DROP FUNCTION IF EXISTS snapshot_daily_ranks();

-- Function to snapshot ranks daily (called by pg_cron)
CREATE FUNCTION snapshot_daily_ranks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_rank_snapshots (user_id, season_id, snapshot_date, global_rank, courses_logged)
  SELECT 
    uss.user_id,
    uss.season_id,
    CURRENT_DATE,
    ROW_NUMBER() OVER (ORDER BY uss.courses_logged DESC)::INTEGER as global_rank,
    uss.courses_logged
  FROM user_season_stats uss
  JOIN championship_seasons cs ON cs.id = uss.season_id AND cs.status = 'active'
  ON CONFLICT (user_id, season_id, snapshot_date) 
  DO UPDATE SET
    global_rank = EXCLUDED.global_rank,
    courses_logged = EXCLUDED.courses_logged;
END;
$$;

-- RPC to get user's position change (positive = moved up, negative = moved down)
CREATE OR REPLACE FUNCTION get_user_position_change(
  p_user_id UUID,
  p_days_back INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_rank INTEGER;
  v_previous_rank INTEGER;
  v_active_season_id UUID;
BEGIN
  -- Get active season
  SELECT id INTO v_active_season_id
  FROM championship_seasons
  WHERE status = 'active'
  LIMIT 1;

  IF v_active_season_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Get current rank
  SELECT global_rank INTO v_current_rank
  FROM user_rank_snapshots
  WHERE user_id = p_user_id
    AND season_id = v_active_season_id
    AND snapshot_date = CURRENT_DATE;

  -- Get previous rank
  SELECT global_rank INTO v_previous_rank
  FROM user_rank_snapshots
  WHERE user_id = p_user_id
    AND season_id = v_active_season_id
    AND snapshot_date = CURRENT_DATE - p_days_back;

  -- Return change (positive = improved, negative = dropped)
  IF v_previous_rank IS NULL OR v_current_rank IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN v_previous_rank - v_current_rank;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_position_change TO authenticated;
GRANT EXECUTE ON FUNCTION snapshot_daily_ranks TO service_role;