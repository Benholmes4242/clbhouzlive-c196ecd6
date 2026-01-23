-- Fix remaining ambiguous global_rank references in get_user_championship_status
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
    SELECT cs.id INTO v_season_id FROM championship_seasons cs WHERE cs.status = 'active' LIMIT 1;
  ELSE
    v_season_id := p_season_id;
  END IF;

  IF v_season_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      uss.user_id,
      uss.courses_logged,
      uss.current_division,
      uss.best_rank,
      uss.active_streak_days,
      uss.longest_streak_days,
      ROW_NUMBER() OVER (ORDER BY uss.courses_logged DESC, uss.last_activity_at DESC NULLS LAST) as computed_rank
    FROM user_season_stats uss
    WHERE uss.season_id = v_season_id
  ),
  my_stats AS (
    SELECT * FROM user_stats us2 WHERE us2.user_id = p_user_id
  ),
  yesterday_snap AS (
    SELECT urs.global_rank as snap_rank 
    FROM user_rank_snapshots urs
    WHERE urs.user_id = p_user_id AND urs.season_id = v_season_id AND urs.snapshot_date = v_yesterday
    LIMIT 1
  ),
  week_snap AS (
    SELECT urs.global_rank as snap_rank 
    FROM user_rank_snapshots urs
    WHERE urs.user_id = p_user_id AND urs.season_id = v_season_id AND urs.snapshot_date = v_week_ago
    LIMIT 1
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
    SELECT up.display_name as rival_name
    FROM user_rivals ur
    JOIN user_profiles up ON up.id = ur.rival_id
    WHERE ur.user_id = p_user_id AND ur.is_active = true
    ORDER BY ABS(ur.current_gap) ASC
    LIMIT 1
  )
  SELECT
    v_season_id as season_id,
    cs.name as season_name,
    cs.end_date as season_ends_at,
    EXTRACT(DAY FROM cs.end_date - NOW())::INTEGER as days_remaining,
    
    ms.computed_rank::INTEGER as global_rank,
    ms.courses_logged::INTEGER as courses_logged,
    
    COALESCE(dc.division_id, 'rookie') as division_id,
    COALESCE(dc.display_name, 'Rookie Club') as division_name,
    COALESCE(dc.ring_color, '#6B7280') as division_ring_color,
    
    (SELECT dc2.display_name FROM division_config dc2 WHERE dc2.threshold > COALESCE(ms.courses_logged, 0) ORDER BY dc2.threshold LIMIT 1) as next_division_name,
    (SELECT MIN(dc3.threshold) - COALESCE(ms.courses_logged, 0) FROM division_config dc3 WHERE dc3.threshold > COALESCE(ms.courses_logged, 0))::INTEGER as courses_to_promotion,
    
    (COALESCE(ys.snap_rank, ms.computed_rank) - ms.computed_rank)::INTEGER as rank_change_today,
    (COALESCE(wsn.snap_rank, ms.computed_rank) - ms.computed_rank)::INTEGER as rank_change_week,
    
    COALESCE(ms.best_rank, ms.computed_rank)::INTEGER as best_rank_this_season,
    COALESCE(ms.active_streak_days, 0)::INTEGER as active_streak_days,
    COALESCE(ms.longest_streak_days, 0)::INTEGER as longest_streak_this_season,
    
    CASE WHEN ms.computed_rank <= 3 THEN 'promotion' ELSE 'safe' END as zone_type,
    
    COALESCE(rs.total_rivals, 0) as rivals_count,
    COALESCE(rs.ahead_count, 0) as rivals_ahead,
    rs.closest_gap as closest_rival_gap,
    cr.rival_name as closest_rival_name
    
  FROM championship_seasons cs
  LEFT JOIN my_stats ms ON true
  LEFT JOIN division_config dc ON dc.division_id = ms.current_division
  LEFT JOIN yesterday_snap ys ON true
  LEFT JOIN week_snap wsn ON true
  LEFT JOIN rival_stats rs ON true
  LEFT JOIN closest_rival cr ON true
  WHERE cs.id = v_season_id;
END;
$$;

-- Also fix get_championship_leaderboard to avoid null division_id issues
CREATE OR REPLACE FUNCTION public.get_championship_leaderboard(
  p_season_id UUID DEFAULT NULL,
  p_scope TEXT DEFAULT 'global',
  p_time_range TEXT DEFAULT 'season',
  p_current_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  rank INTEGER,
  courses_logged INTEGER,
  rank_change_today INTEGER,
  rank_change_week INTEGER,
  division_id TEXT,
  division_name TEXT,
  division_ring_color TEXT,
  courses_to_next_division INTEGER,
  last_activity_at TIMESTAMPTZ,
  is_active_streak BOOLEAN,
  streak_days INTEGER,
  zone_type TEXT,
  is_friend BOOLEAN,
  is_rival BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id UUID;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_week_ago DATE := CURRENT_DATE - INTERVAL '7 days';
  v_total_players INTEGER;
BEGIN
  -- Resolve season (use active if not specified)
  IF p_season_id IS NULL THEN
    SELECT cs.id INTO v_season_id 
    FROM championship_seasons cs
    WHERE cs.status = 'active' 
    LIMIT 1;
  ELSE
    v_season_id := p_season_id;
  END IF;

  -- If no season found, return empty
  IF v_season_id IS NULL THEN
    RETURN;
  END IF;

  -- Get total player count for zone calculation
  SELECT COUNT(*) INTO v_total_players FROM user_season_stats uss WHERE uss.season_id = v_season_id;

  RETURN QUERY
  WITH current_stats AS (
    SELECT 
      uss.user_id,
      uss.courses_logged,
      uss.current_division,
      uss.last_activity_at,
      uss.active_streak_days,
      ROW_NUMBER() OVER (ORDER BY uss.courses_logged DESC, uss.last_activity_at DESC NULLS LAST) as current_rank
    FROM user_season_stats uss
    WHERE uss.season_id = v_season_id
  ),
  yesterday_snapshot AS (
    SELECT urs.user_id, urs.global_rank as snap_rank
    FROM user_rank_snapshots urs
    WHERE urs.season_id = v_season_id AND urs.snapshot_date = v_yesterday
  ),
  week_snapshot AS (
    SELECT urs.user_id, urs.global_rank as snap_rank
    FROM user_rank_snapshots urs
    WHERE urs.season_id = v_season_id AND urs.snapshot_date = v_week_ago
  ),
  user_friends_cte AS (
    SELECT uf.friend_id FROM user_friends uf
    WHERE uf.user_id = p_current_user_id AND uf.status = 'accepted'
  ),
  user_rivals_cte AS (
    SELECT ur.rival_id FROM user_rivals ur
    WHERE ur.user_id = p_current_user_id AND ur.is_active = true
  )
  SELECT
    up.id as user_id,
    up.username,
    up.display_name,
    up.profile_photo_url,
    up.home_club,
    
    cs.current_rank::INTEGER as rank,
    cs.courses_logged::INTEGER as courses_logged,
    
    -- Rank change: positive = improved (went from higher number to lower)
    (COALESCE(ys.snap_rank, cs.current_rank) - cs.current_rank)::INTEGER as rank_change_today,
    (COALESCE(ws.snap_rank, cs.current_rank) - cs.current_rank)::INTEGER as rank_change_week,
    
    COALESCE(dc.division_id, 'rookie') as division_id,
    COALESCE(dc.display_name, 'Rookie Club') as division_name,
    COALESCE(dc.ring_color, '#6B7280') as division_ring_color,
    (
      SELECT MIN(dc2.threshold) - cs.courses_logged 
      FROM division_config dc2
      WHERE dc2.threshold > cs.courses_logged
    )::INTEGER as courses_to_next_division,
    
    cs.last_activity_at,
    (cs.last_activity_at > NOW() - INTERVAL '3 days') as is_active_streak,
    COALESCE(cs.active_streak_days, 0)::INTEGER as streak_days,
    
    -- Zone calculation (top 3 = promotion, bottom would be relegation if enabled)
    CASE 
      WHEN cs.current_rank <= 3 THEN 'promotion'
      ELSE 'safe'
    END as zone_type,
    
    (ufc.friend_id IS NOT NULL) as is_friend,
    (urc.rival_id IS NOT NULL) as is_rival
    
  FROM current_stats cs
  JOIN user_profiles up ON up.id = cs.user_id
  LEFT JOIN yesterday_snapshot ys ON ys.user_id = cs.user_id
  LEFT JOIN week_snapshot ws ON ws.user_id = cs.user_id
  LEFT JOIN division_config dc ON dc.division_id = cs.current_division
  LEFT JOIN user_friends_cte ufc ON ufc.friend_id = cs.user_id
  LEFT JOIN user_rivals_cte urc ON urc.rival_id = cs.user_id
  WHERE up.is_public = true OR up.id = p_current_user_id
  ORDER BY cs.current_rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_championship_status(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_championship_status(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_championship_leaderboard(UUID, TEXT, TEXT, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_championship_leaderboard(UUID, TEXT, TEXT, UUID, INTEGER, INTEGER) TO anon;