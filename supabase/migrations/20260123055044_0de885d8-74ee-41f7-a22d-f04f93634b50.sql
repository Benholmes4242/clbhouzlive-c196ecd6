-- ============================================
-- CHAMPIONSHIP MODE: CORE RPC FUNCTIONS
-- ============================================

-- 1. get_championship_leaderboard - Enhanced leaderboard with rank movement and divisions
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
    SELECT id INTO v_season_id 
    FROM championship_seasons 
    WHERE status = 'active' 
    LIMIT 1;
  ELSE
    v_season_id := p_season_id;
  END IF;

  -- If no season found, return empty
  IF v_season_id IS NULL THEN
    RETURN;
  END IF;

  -- Get total player count for zone calculation
  SELECT COUNT(*) INTO v_total_players FROM user_season_stats WHERE season_id = v_season_id;

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
    SELECT urs.user_id, urs.global_rank 
    FROM user_rank_snapshots urs
    WHERE urs.season_id = v_season_id AND urs.snapshot_date = v_yesterday
  ),
  week_snapshot AS (
    SELECT urs.user_id, urs.global_rank 
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
    cs.courses_logged::INTEGER,
    
    -- Rank change: positive = improved (went from higher number to lower)
    (COALESCE(ys.global_rank, cs.current_rank) - cs.current_rank)::INTEGER as rank_change_today,
    (COALESCE(ws.global_rank, cs.current_rank) - cs.current_rank)::INTEGER as rank_change_week,
    
    dc.division_id,
    dc.display_name as division_name,
    dc.ring_color as division_ring_color,
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

-- 2. get_user_championship_status - Detailed status for the current user
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
      ROW_NUMBER() OVER (ORDER BY uss.courses_logged DESC, uss.last_activity_at DESC NULLS LAST) as current_rank
    FROM user_season_stats uss
    WHERE uss.season_id = v_season_id
  ),
  my_stats AS (
    SELECT * FROM user_stats WHERE user_id = p_user_id
  ),
  yesterday_snap AS (
    SELECT global_rank FROM user_rank_snapshots 
    WHERE user_id = p_user_id AND season_id = v_season_id AND snapshot_date = v_yesterday
  ),
  week_snap AS (
    SELECT global_rank FROM user_rank_snapshots 
    WHERE user_id = p_user_id AND season_id = v_season_id AND snapshot_date = v_week_ago
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
    
    ms.current_rank::INTEGER as global_rank,
    ms.courses_logged::INTEGER,
    
    dc.division_id,
    dc.display_name as division_name,
    dc.ring_color as division_ring_color,
    
    (SELECT display_name FROM division_config WHERE threshold > ms.courses_logged ORDER BY threshold LIMIT 1) as next_division_name,
    (SELECT MIN(threshold) - ms.courses_logged FROM division_config WHERE threshold > ms.courses_logged)::INTEGER as courses_to_promotion,
    
    (COALESCE(ys.global_rank, ms.current_rank) - ms.current_rank)::INTEGER as rank_change_today,
    (COALESCE(wsn.global_rank, ms.current_rank) - ms.current_rank)::INTEGER as rank_change_week,
    
    ms.best_rank::INTEGER as best_rank_this_season,
    COALESCE(ms.active_streak_days, 0)::INTEGER as active_streak_days,
    COALESCE(ms.longest_streak_days, 0)::INTEGER as longest_streak_this_season,
    
    CASE WHEN ms.current_rank <= 3 THEN 'promotion' ELSE 'safe' END as zone_type,
    
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

-- 3. get_active_season - Simple helper to get current season
CREATE OR REPLACE FUNCTION public.get_active_season()
RETURNS TABLE (
  id UUID,
  season_number INTEGER,
  name TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.season_number,
    cs.name,
    cs.start_date,
    cs.end_date,
    EXTRACT(DAY FROM cs.end_date - NOW())::INTEGER as days_remaining
  FROM championship_seasons cs
  WHERE cs.status = 'active'
  LIMIT 1;
END;
$$;

-- 4. get_division_config - Get all divisions for UI
CREATE OR REPLACE FUNCTION public.get_division_config()
RETURNS TABLE (
  division_id TEXT,
  display_name TEXT,
  threshold INTEGER,
  ring_color TEXT,
  sort_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.division_id,
    dc.display_name,
    dc.threshold,
    dc.ring_color,
    dc.sort_order
  FROM division_config dc
  ORDER BY dc.sort_order ASC;
END;
$$;

-- 5. ensure_user_season_stats - Create stats entry if not exists (called when user logs a course)
CREATE OR REPLACE FUNCTION public.ensure_user_season_stats(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id UUID;
  v_stats_id UUID;
BEGIN
  -- Get active season
  SELECT id INTO v_season_id FROM championship_seasons WHERE status = 'active' LIMIT 1;
  
  IF v_season_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if stats exist
  SELECT id INTO v_stats_id FROM user_season_stats 
  WHERE user_id = p_user_id AND season_id = v_season_id;
  
  IF v_stats_id IS NULL THEN
    -- Create new stats entry
    INSERT INTO user_season_stats (user_id, season_id, courses_logged, last_activity_at)
    VALUES (p_user_id, v_season_id, 0, NOW())
    RETURNING id INTO v_stats_id;
  END IF;
  
  RETURN v_stats_id;
END;
$$;