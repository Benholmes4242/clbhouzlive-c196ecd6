-- Fix get_user_championship_status: rename global_rank alias to avoid conflict with return column
CREATE OR REPLACE FUNCTION public.get_user_championship_status(
  p_user_id UUID,
  p_season_id UUID DEFAULT NULL
)
RETURNS TABLE (
  season_id UUID,
  season_name TEXT,
  season_ends_at TIMESTAMPTZ,
  days_remaining INTEGER,
  global_rank INTEGER,
  courses_logged INTEGER,
  division_id TEXT,
  division_name TEXT,
  division_ring_color TEXT,
  next_division_name TEXT,
  courses_to_promotion INTEGER,
  rank_change_today INTEGER,
  rank_change_week INTEGER,
  best_rank_this_season INTEGER,
  active_streak_days INTEGER,
  longest_streak_this_season INTEGER,
  zone_type TEXT,
  rivals_count INTEGER,
  rivals_ahead INTEGER,
  closest_rival_gap INTEGER,
  closest_rival_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id UUID;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_week_ago DATE := CURRENT_DATE - INTERVAL '7 days';
BEGIN
  -- Resolve season
  IF p_season_id IS NULL THEN
    SELECT id INTO v_season_id FROM championship_seasons WHERE status = 'active' LIMIT 1;
  ELSE
    v_season_id := p_season_id;
  END IF;

  IF v_season_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      uss.*,
      ROW_NUMBER() OVER (ORDER BY uss.courses_logged DESC, uss.last_activity_at DESC NULLS LAST) as computed_rank
    FROM user_season_stats uss
    WHERE uss.season_id = v_season_id
  ),
  my_stats AS (
    SELECT * FROM user_stats WHERE user_id = p_user_id
  ),
  yesterday_snap AS (
    SELECT urs.global_rank as snap_rank FROM user_rank_snapshots urs
    WHERE urs.user_id = p_user_id AND urs.season_id = v_season_id AND urs.snapshot_date = v_yesterday
  ),
  week_snap AS (
    SELECT urs.global_rank as snap_rank FROM user_rank_snapshots urs
    WHERE urs.user_id = p_user_id AND urs.season_id = v_season_id AND urs.snapshot_date = v_week_ago
  ),
  rival_stats AS (
    SELECT 
      COUNT(*)::INTEGER as total_rivals,
      COUNT(*) FILTER (WHERE ur.current_gap < 0)::INTEGER as ahead_count,
      MIN(ABS(ur.current_gap))::INTEGER as closest_gap
    FROM user_rivals ur
    WHERE ur.user_id = p_user_id AND ur.is_active = true
  ),
  closest_rival AS (
    SELECT up.display_name
    FROM user_rivals ur
    JOIN user_profiles up ON up.id = ur.rival_id
    WHERE ur.user_id = p_user_id AND ur.is_active = true
    ORDER BY ABS(ur.current_gap) ASC
    LIMIT 1
  )
  SELECT
    cs.id as season_id,
    cs.name as season_name,
    cs.end_date as season_ends_at,
    EXTRACT(DAY FROM cs.end_date - NOW())::INTEGER as days_remaining,
    
    ms.computed_rank::INTEGER as global_rank,
    ms.courses_logged::INTEGER,
    
    dc.division_id,
    dc.display_name as division_name,
    dc.ring_color as division_ring_color,
    
    (SELECT dc2.display_name FROM division_config dc2 WHERE dc2.threshold > ms.courses_logged ORDER BY dc2.threshold LIMIT 1) as next_division_name,
    (SELECT MIN(dc3.threshold) - ms.courses_logged FROM division_config dc3 WHERE dc3.threshold > ms.courses_logged)::INTEGER as courses_to_promotion,
    
    (COALESCE(ys.snap_rank, ms.computed_rank) - ms.computed_rank)::INTEGER as rank_change_today,
    (COALESCE(wsn.snap_rank, ms.computed_rank) - ms.computed_rank)::INTEGER as rank_change_week,
    
    ms.best_rank::INTEGER as best_rank_this_season,
    COALESCE(ms.active_streak_days, 0)::INTEGER as active_streak_days,
    COALESCE(ms.longest_streak_days, 0)::INTEGER as longest_streak_this_season,
    
    CASE WHEN ms.computed_rank <= 3 THEN 'promotion' ELSE 'safe' END as zone_type,
    
    rs.total_rivals as rivals_count,
    rs.ahead_count as rivals_ahead,
    rs.closest_gap as closest_rival_gap,
    cr.display_name as closest_rival_name
    
  FROM my_stats ms
  JOIN championship_seasons cs ON cs.id = v_season_id
  LEFT JOIN division_config dc ON dc.division_id = ms.current_division
  LEFT JOIN yesterday_snap ys ON true
  LEFT JOIN week_snap wsn ON true
  LEFT JOIN rival_stats rs ON true
  LEFT JOIN closest_rival cr ON true;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_championship_status(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_championship_status(UUID, UUID) TO anon;