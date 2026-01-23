-- Backfill user_season_stats from existing course_ratings data
-- This populates the Championship Mode leaderboard with real historical data

INSERT INTO user_season_stats (
  user_id,
  season_id,
  courses_logged,
  current_rank,
  best_rank,
  current_division,
  highest_division_reached,
  active_streak_days,
  longest_streak_days,
  last_activity_at,
  created_at,
  updated_at
)
SELECT 
  cr.user_id,
  cs.id as season_id,
  COUNT(DISTINCT cr.course_id) as courses_logged,
  ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT cr.course_id) DESC) as current_rank,
  ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT cr.course_id) DESC) as best_rank,
  CASE 
    WHEN COUNT(DISTINCT cr.course_id) >= 50 THEN 'Champion Club'
    WHEN COUNT(DISTINCT cr.course_id) >= 30 THEN 'Masters Club'
    WHEN COUNT(DISTINCT cr.course_id) >= 20 THEN 'Elite Club'
    WHEN COUNT(DISTINCT cr.course_id) >= 10 THEN 'Contender Club'
    WHEN COUNT(DISTINCT cr.course_id) >= 5 THEN 'Rising Club'
    ELSE 'Rookie Club'
  END as current_division,
  CASE 
    WHEN COUNT(DISTINCT cr.course_id) >= 50 THEN 'Champion Club'
    WHEN COUNT(DISTINCT cr.course_id) >= 30 THEN 'Masters Club'
    WHEN COUNT(DISTINCT cr.course_id) >= 20 THEN 'Elite Club'
    WHEN COUNT(DISTINCT cr.course_id) >= 10 THEN 'Contender Club'
    WHEN COUNT(DISTINCT cr.course_id) >= 5 THEN 'Rising Club'
    ELSE 'Rookie Club'
  END as highest_division_reached,
  0 as active_streak_days,
  0 as longest_streak_days,
  MAX(cr.created_at) as last_activity_at,
  NOW() as created_at,
  NOW() as updated_at
FROM course_ratings cr
CROSS JOIN championship_seasons cs
WHERE cs.status = 'active'
  AND cr.user_id IS NOT NULL
  AND cr.created_at >= cs.start_date
  AND cr.created_at <= cs.end_date
GROUP BY cr.user_id, cs.id
ON CONFLICT (user_id, season_id) 
DO UPDATE SET
  courses_logged = EXCLUDED.courses_logged,
  current_rank = EXCLUDED.current_rank,
  current_division = EXCLUDED.current_division,
  last_activity_at = EXCLUDED.last_activity_at,
  updated_at = NOW();