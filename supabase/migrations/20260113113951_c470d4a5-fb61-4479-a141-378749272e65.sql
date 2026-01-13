
-- =====================================================
-- FAST CLIMBERS FEATURE: PHASED IMPLEMENTATION
-- =====================================================

-- =====================================================
-- PHASE 1: Activity-based "Most Active This Month"
-- Creates an RPC to get players who logged the most Top 100 courses recently
-- =====================================================

CREATE OR REPLACE FUNCTION get_fast_climbers(
  days_param INTEGER DEFAULT 30,
  limit_param INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  username TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  courses_logged_recently INTEGER,
  total_top100_played BIGINT,
  global_rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_activity AS (
    -- Count distinct Top 100 courses logged in the specified time period
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id)::INTEGER as courses_logged
    FROM course_ratings cr
    JOIN course_top100_memberships ctm ON cr.course_id = ctm.course_id
    WHERE cr.created_at >= NOW() - (days_param || ' days')::INTERVAL
      AND cr.is_mock = false
      AND cr.user_id IS NOT NULL
    GROUP BY cr.user_id
    HAVING COUNT(DISTINCT cr.course_id) > 0
  ),
  player_totals AS (
    -- Get total Top 100 courses for each player (all time)
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id) as total_courses
    FROM course_ratings cr
    JOIN course_top100_memberships ctm ON cr.course_id = ctm.course_id
    WHERE cr.is_mock = false
      AND cr.user_id IS NOT NULL
    GROUP BY cr.user_id
  ),
  ranked_players AS (
    SELECT 
      pt.user_id,
      pt.total_courses,
      RANK() OVER (ORDER BY pt.total_courses DESC) as player_rank
    FROM player_totals pt
  )
  SELECT 
    up.id as user_id,
    up.display_name,
    up.username,
    up.profile_photo_url,
    up.home_club,
    ra.courses_logged as courses_logged_recently,
    rp.total_courses as total_top100_played,
    rp.player_rank as global_rank
  FROM recent_activity ra
  JOIN user_profiles up ON up.id = ra.user_id
  JOIN ranked_players rp ON rp.user_id = ra.user_id
  ORDER BY ra.courses_logged DESC, rp.total_courses DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_fast_climbers(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_fast_climbers(INTEGER, INTEGER) TO anon;

-- =====================================================
-- PHASE 2: Rank Snapshots Infrastructure
-- Sets up the table and functions for true rank climbing (future use)
-- =====================================================

-- Table to store historical rank snapshots
CREATE TABLE IF NOT EXISTS leaderboard_rank_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  global_rank INTEGER,
  total_top100_played INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, snapshot_date)
);

-- Enable RLS
ALTER TABLE leaderboard_rank_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own snapshots
CREATE POLICY "Users can view their own rank snapshots"
  ON leaderboard_rank_snapshots
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: System can insert snapshots (via service role)
CREATE POLICY "Service role can insert snapshots"
  ON leaderboard_rank_snapshots
  FOR INSERT
  WITH CHECK (true);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_rank_snapshots_date 
  ON leaderboard_rank_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_rank_snapshots_user 
  ON leaderboard_rank_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_snapshots_user_date 
  ON leaderboard_rank_snapshots(user_id, snapshot_date DESC);

-- Function to capture daily rank snapshots (to be called by scheduled job)
CREATE OR REPLACE FUNCTION capture_leaderboard_snapshot()
RETURNS void AS $$
BEGIN
  INSERT INTO leaderboard_rank_snapshots (user_id, snapshot_date, global_rank, total_top100_played)
  SELECT 
    up.id as user_id,
    CURRENT_DATE as snapshot_date,
    RANK() OVER (ORDER BY COUNT(DISTINCT cr.course_id) DESC)::INTEGER as global_rank,
    COUNT(DISTINCT cr.course_id)::INTEGER as total_top100_played
  FROM user_profiles up
  JOIN course_ratings cr ON cr.user_id = up.id
  JOIN course_top100_memberships ctm ON cr.course_id = ctm.course_id
  WHERE cr.is_mock = false
  GROUP BY up.id
  ON CONFLICT (user_id, snapshot_date) 
  DO UPDATE SET 
    global_rank = EXCLUDED.global_rank,
    total_top100_played = EXCLUDED.total_top100_played;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role only (for scheduled jobs)
REVOKE ALL ON FUNCTION capture_leaderboard_snapshot() FROM PUBLIC;

-- Schedule daily snapshot capture (if pg_cron is available)
-- This will run at 00:05 UTC every day
SELECT cron.schedule(
  'capture-leaderboard-snapshot',
  '5 0 * * *',
  $$ SELECT capture_leaderboard_snapshot(); $$
);
