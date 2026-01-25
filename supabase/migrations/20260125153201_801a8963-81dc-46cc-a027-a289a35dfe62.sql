
-- =====================================================
-- FIX: Championship Leaderboard to Only Count Top 100 Courses
-- =====================================================
-- Issue: Danny Holmes shows 7 courses but only 6 are Top 100
-- Root cause: RPCs and triggers count ALL courses, not just Top 100
-- =====================================================

-- 1. Fix the All-Time Leaderboard RPC
-- Only count courses that exist in course_top100_memberships
CREATE OR REPLACE FUNCTION public.get_championship_leaderboard_alltime(
  p_scope text DEFAULT 'global'::text, 
  p_limit integer DEFAULT 50, 
  p_offset integer DEFAULT 0, 
  p_current_user_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  user_id uuid, 
  username text, 
  display_name text, 
  profile_photo_url text, 
  home_club text, 
  total_courses bigint, 
  rank bigint, 
  is_friend boolean, 
  is_rival boolean, 
  current_division text
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  WITH course_counts AS (
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id) as total_courses
    FROM course_ratings cr
    -- ONLY count courses that are in a Top 100 list
    INNER JOIN course_top100_memberships ctm ON cr.course_id = ctm.course_id
    WHERE cr.user_id IS NOT NULL
    GROUP BY cr.user_id
    HAVING COUNT(DISTINCT cr.course_id) > 0
  ),
  ranked_users AS (
    SELECT 
      cc.user_id,
      cc.total_courses,
      ROW_NUMBER() OVER (ORDER BY cc.total_courses DESC, cc.user_id) as rank
    FROM course_counts cc
  ),
  friend_ids AS (
    SELECT friend_id
    FROM user_friends
    WHERE user_id = p_current_user_id AND status = 'accepted'
  ),
  rival_ids AS (
    SELECT rival_id
    FROM user_rivals
    WHERE user_id = p_current_user_id AND is_active = true
  )
  SELECT 
    ru.user_id,
    up.username,
    up.display_name,
    up.profile_photo_url,
    up.home_club,
    ru.total_courses,
    ru.rank,
    EXISTS (SELECT 1 FROM friend_ids fi WHERE fi.friend_id = ru.user_id) as is_friend,
    EXISTS (SELECT 1 FROM rival_ids ri WHERE ri.rival_id = ru.user_id) as is_rival,
    COALESCE(
      (SELECT dc.division_id 
       FROM division_config dc 
       WHERE dc.threshold <= ru.total_courses 
       ORDER BY dc.threshold DESC 
       LIMIT 1),
      'rookie'
    )::text as current_division
  FROM ranked_users ru
  JOIN user_profiles up ON up.id = ru.user_id
  WHERE 
    CASE 
      WHEN p_scope = 'friends' THEN 
        ru.user_id = p_current_user_id 
        OR EXISTS (SELECT 1 FROM friend_ids fi WHERE fi.friend_id = ru.user_id)
      ELSE true
    END
  ORDER BY ru.rank
  LIMIT p_limit
  OFFSET p_offset;
$function$;

-- 2. Fix the Seasonal Leaderboard RPC
-- Update current_stats CTE to calculate Top 100 course counts on the fly
CREATE OR REPLACE FUNCTION public.get_championship_leaderboard(
  p_season_id uuid DEFAULT NULL::uuid, 
  p_scope text DEFAULT 'global'::text, 
  p_time_range text DEFAULT 'season'::text, 
  p_current_user_id uuid DEFAULT NULL::uuid, 
  p_limit integer DEFAULT 100, 
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  user_id uuid, 
  username text, 
  display_name text, 
  profile_photo_url text, 
  home_club text, 
  rank integer, 
  courses_logged integer, 
  rank_change_today integer, 
  rank_change_week integer, 
  division_id text, 
  division_name text, 
  division_ring_color text, 
  courses_to_next_division integer, 
  last_activity_at timestamp with time zone, 
  is_active_streak boolean, 
  streak_days integer, 
  zone_type text, 
  is_friend boolean, 
  is_rival boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_season_id UUID;
  v_season_start DATE;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_week_ago DATE := CURRENT_DATE - INTERVAL '7 days';
  v_total_players INTEGER;
BEGIN
  -- Resolve season (use active if not specified)
  IF p_season_id IS NULL THEN
    SELECT cs.id, cs.start_date INTO v_season_id, v_season_start
    FROM championship_seasons cs
    WHERE cs.status = 'active' 
    LIMIT 1;
  ELSE
    SELECT cs.id, cs.start_date INTO v_season_id, v_season_start
    FROM championship_seasons cs
    WHERE cs.id = p_season_id;
  END IF;

  -- If no season found, return empty
  IF v_season_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH top100_course_counts AS (
    -- Only count Top 100 courses rated during this season
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id) as courses_logged,
      MAX(cr.created_at) as last_activity_at
    FROM course_ratings cr
    INNER JOIN course_top100_memberships ctm ON cr.course_id = ctm.course_id
    WHERE cr.created_at >= v_season_start
    GROUP BY cr.user_id
  ),
  current_stats AS (
    SELECT 
      tcc.user_id,
      tcc.courses_logged,
      tcc.last_activity_at,
      COALESCE(uss.current_division, 'rookie') as current_division,
      COALESCE(uss.active_streak_days, 0) as active_streak_days,
      ROW_NUMBER() OVER (ORDER BY tcc.courses_logged DESC, tcc.last_activity_at DESC NULLS LAST) as current_rank
    FROM top100_course_counts tcc
    LEFT JOIN user_season_stats uss ON uss.user_id = tcc.user_id AND uss.season_id = v_season_id
    WHERE tcc.courses_logged > 0
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
    
    -- Zone calculation (top 3 = promotion)
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
$function$;

-- 3. Fix the User Championship Status RPC
-- Calculate courses_logged from Top 100 courses only
CREATE OR REPLACE FUNCTION public.get_user_championship_status(
  p_user_id uuid, 
  p_season_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  season_id uuid, 
  season_name text, 
  season_ends_at timestamp with time zone, 
  days_remaining integer, 
  global_rank integer, 
  courses_logged integer, 
  division_id text, 
  division_name text, 
  division_ring_color text, 
  next_division_name text, 
  courses_to_promotion integer, 
  rank_change_today integer, 
  rank_change_week integer, 
  best_rank_this_season integer, 
  active_streak_days integer, 
  longest_streak_this_season integer, 
  zone_type text, 
  rivals_count integer, 
  rivals_ahead integer, 
  closest_rival_gap integer, 
  closest_rival_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_season_id UUID;
  v_season_start DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_week_ago DATE := CURRENT_DATE - INTERVAL '7 days';
BEGIN
  -- Resolve season
  IF p_season_id IS NULL THEN
    SELECT cs.id, cs.start_date INTO v_season_id, v_season_start 
    FROM championship_seasons cs WHERE cs.status = 'active' LIMIT 1;
  ELSE
    SELECT cs.id, cs.start_date INTO v_season_id, v_season_start 
    FROM championship_seasons cs WHERE cs.id = p_season_id;
  END IF;

  IF v_season_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH top100_course_counts AS (
    -- Only count Top 100 courses for championship
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id) as courses_logged,
      MAX(cr.created_at) as last_activity_at
    FROM course_ratings cr
    INNER JOIN course_top100_memberships ctm ON cr.course_id = ctm.course_id
    WHERE cr.created_at >= v_season_start
    GROUP BY cr.user_id
  ),
  all_user_stats AS (
    SELECT 
      tcc.user_id,
      tcc.courses_logged,
      tcc.last_activity_at,
      ROW_NUMBER() OVER (ORDER BY tcc.courses_logged DESC, tcc.last_activity_at DESC NULLS LAST) as computed_rank
    FROM top100_course_counts tcc
  ),
  my_stats AS (
    SELECT * FROM all_user_stats aus WHERE aus.user_id = p_user_id
  ),
  my_streak_stats AS (
    SELECT 
      COALESCE(uss.active_streak_days, 0) as active_streak_days,
      COALESCE(uss.longest_streak_days, 0) as longest_streak_days,
      COALESCE(uss.best_rank, 0) as best_rank,
      uss.current_division
    FROM user_season_stats uss
    WHERE uss.user_id = p_user_id AND uss.season_id = v_season_id
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
    
    COALESCE(ms.computed_rank, 0)::INTEGER as global_rank,
    COALESCE(ms.courses_logged, 0)::INTEGER as courses_logged,
    
    COALESCE(dc.division_id, 'rookie') as division_id,
    COALESCE(dc.display_name, 'Rookie Club') as division_name,
    COALESCE(dc.ring_color, '#6B7280') as division_ring_color,
    
    (SELECT dc2.display_name FROM division_config dc2 WHERE dc2.threshold > COALESCE(ms.courses_logged, 0) ORDER BY dc2.threshold LIMIT 1) as next_division_name,
    (SELECT MIN(dc3.threshold) - COALESCE(ms.courses_logged, 0) FROM division_config dc3 WHERE dc3.threshold > COALESCE(ms.courses_logged, 0))::INTEGER as courses_to_promotion,
    
    (COALESCE(ys.snap_rank, ms.computed_rank) - COALESCE(ms.computed_rank, 0))::INTEGER as rank_change_today,
    (COALESCE(wsn.snap_rank, ms.computed_rank) - COALESCE(ms.computed_rank, 0))::INTEGER as rank_change_week,
    
    COALESCE(mss.best_rank, COALESCE(ms.computed_rank, 0))::INTEGER as best_rank_this_season,
    COALESCE(mss.active_streak_days, 0)::INTEGER as active_streak_days,
    COALESCE(mss.longest_streak_days, 0)::INTEGER as longest_streak_this_season,
    
    CASE WHEN COALESCE(ms.computed_rank, 0) <= 3 THEN 'promotion' ELSE 'safe' END as zone_type,
    
    COALESCE(rs.total_rivals, 0) as rivals_count,
    COALESCE(rs.ahead_count, 0) as rivals_ahead,
    rs.closest_gap as closest_rival_gap,
    cr.rival_name as closest_rival_name
    
  FROM championship_seasons cs
  LEFT JOIN my_stats ms ON true
  LEFT JOIN my_streak_stats mss ON true
  LEFT JOIN division_config dc ON dc.division_id = COALESCE(mss.current_division, 'rookie')
  LEFT JOIN yesterday_snap ys ON true
  LEFT JOIN week_snap wsn ON true
  LEFT JOIN rival_stats rs ON true
  LEFT JOIN closest_rival cr ON true
  WHERE cs.id = v_season_id;
END;
$function$;

-- 4. Fix the trigger that updates user_season_stats
-- Only increment courses_logged if the course is in Top 100
CREATE OR REPLACE FUNCTION public.update_user_season_stats_on_course_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_season_id UUID;
  v_season_start DATE;
  v_season_end DATE;
  v_is_top100 BOOLEAN;
BEGIN
  -- Check if this course is in a Top 100 list
  SELECT EXISTS(
    SELECT 1 FROM course_top100_memberships ctm WHERE ctm.course_id = NEW.course_id
  ) INTO v_is_top100;

  -- If not a Top 100 course, skip championship tracking
  IF NOT v_is_top100 THEN
    RETURN NEW;
  END IF;

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
      best_rank,
      last_activity_at
    )
    VALUES (
      NEW.user_id,
      v_season_id,
      1,
      0,
      'rookie',
      0,
      0,
      NEW.created_at
    )
    ON CONFLICT (user_id, season_id)
    DO UPDATE SET
      courses_logged = user_season_stats.courses_logged + 1,
      last_activity_at = NEW.created_at;
  END IF;

  RETURN NEW;
END;
$function$;

-- 5. Recalculate existing user_season_stats to fix existing data
-- This updates courses_logged to only count Top 100 courses
WITH top100_counts AS (
  SELECT 
    cr.user_id,
    cs.id as season_id,
    COUNT(DISTINCT cr.course_id) as top100_courses
  FROM course_ratings cr
  INNER JOIN course_top100_memberships ctm ON cr.course_id = ctm.course_id
  CROSS JOIN (SELECT id, start_date FROM championship_seasons WHERE status = 'active' LIMIT 1) cs
  WHERE cr.created_at >= cs.start_date
  GROUP BY cr.user_id, cs.id
)
UPDATE user_season_stats uss
SET courses_logged = COALESCE(tc.top100_courses, 0)
FROM top100_counts tc
WHERE uss.user_id = tc.user_id 
  AND uss.season_id = tc.season_id;

-- Also set courses_logged to 0 for users with no Top 100 courses
UPDATE user_season_stats uss
SET courses_logged = 0
WHERE NOT EXISTS (
  SELECT 1 
  FROM course_ratings cr
  INNER JOIN course_top100_memberships ctm ON cr.course_id = ctm.course_id
  INNER JOIN championship_seasons cs ON cs.id = uss.season_id
  WHERE cr.user_id = uss.user_id
    AND cr.created_at >= cs.start_date
);
