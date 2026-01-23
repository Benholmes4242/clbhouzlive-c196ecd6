-- ============================================================
-- RPC: get_podium_seasonal
-- Returns top 3 for current season (live competition)
-- ============================================================
CREATE OR REPLACE FUNCTION get_podium_seasonal(
  p_scope TEXT DEFAULT 'global',
  p_division_id TEXT DEFAULT NULL,
  p_current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  podium_position INTEGER,
  user_id UUID,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  courses_logged INTEGER,
  division_id TEXT,
  division_name TEXT,
  streak_days INTEGER,
  is_on_streak BOOLEAN,
  rank_change_today INTEGER,
  narrative_text TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id UUID;
BEGIN
  -- Get current active season
  SELECT id INTO v_season_id
  FROM championship_seasons
  WHERE status = 'active'
  LIMIT 1;

  RETURN QUERY
  WITH friend_ids AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE p_current_user_id IS NOT NULL
      AND uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  season_stats AS (
    SELECT 
      uss.user_id,
      uss.courses_logged,
      uss.current_division,
      uss.active_streak_days,
      uss.best_rank,
      uss.current_rank,
      dc.display_name as division_display_name,
      -- Calculate rank change from yesterday's snapshot
      COALESCE(
        (SELECT urs.global_rank FROM user_rank_snapshots urs 
         WHERE urs.user_id = uss.user_id 
         AND urs.snapshot_date = CURRENT_DATE - 1
         LIMIT 1) - uss.current_rank,
        0
      ) as rank_change
    FROM user_season_stats uss
    LEFT JOIN division_config dc ON dc.division_id = uss.current_division
    WHERE uss.season_id = v_season_id
  ),
  filtered_users AS (
    SELECT 
      ss.*,
      up.display_name as user_display_name,
      up.username as user_username,
      up.profile_photo_url
    FROM season_stats ss
    JOIN user_profiles up ON up.id = ss.user_id
    WHERE up.is_public = true
      AND CASE 
        WHEN p_scope = 'global' THEN true
        WHEN p_scope = 'division' AND p_division_id IS NOT NULL THEN ss.current_division = p_division_id
        WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
          ss.user_id IN (SELECT friend_id FROM friend_ids) OR ss.user_id = p_current_user_id
        ELSE true
      END
  ),
  ranked AS (
    SELECT 
      fu.*,
      ROW_NUMBER() OVER (ORDER BY fu.courses_logged DESC, fu.user_id) as pos
    FROM filtered_users fu
  )
  SELECT 
    r.pos::INTEGER as podium_position,
    r.user_id,
    r.user_display_name::TEXT as display_name,
    r.user_username::TEXT as username,
    r.profile_photo_url::TEXT as avatar_url,
    r.courses_logged::INTEGER,
    r.current_division::TEXT as division_id,
    r.division_display_name::TEXT as division_name,
    COALESCE(r.active_streak_days, 0)::INTEGER as streak_days,
    (COALESCE(r.active_streak_days, 0) >= 3)::BOOLEAN as is_on_streak,
    r.rank_change::INTEGER as rank_change_today,
    -- Generate narrative text
    CASE 
      WHEN r.pos = 1 AND COALESCE(r.active_streak_days, 0) >= 3 THEN 'On a ' || r.active_streak_days || '-course run'
      WHEN r.pos = 1 THEN 'Leading ' || COALESCE(r.division_display_name, 'Championship')
      WHEN r.rank_change > 0 THEN 'Up ' || r.rank_change || ' today'
      WHEN r.pos <= 3 THEN 'Holding podium spot'
      ELSE NULL
    END::TEXT as narrative_text
  FROM ranked r
  WHERE r.pos <= 3
  ORDER BY r.pos;
END;
$$;

GRANT EXECUTE ON FUNCTION get_podium_seasonal TO authenticated;
GRANT EXECUTE ON FUNCTION get_podium_seasonal TO anon;

-- ============================================================
-- RPC: get_podium_all_time
-- Returns top 3 all-time (historic legacy)
-- ============================================================
CREATE OR REPLACE FUNCTION get_podium_all_time(
  p_scope TEXT DEFAULT 'global',
  p_current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  podium_position INTEGER,
  user_id UUID,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  all_time_courses INTEGER,
  seasons_won INTEGER,
  podium_finishes INTEGER,
  narrative_text TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH friend_ids AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE p_current_user_id IS NOT NULL
      AND uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  all_time_stats AS (
    SELECT 
      hof.user_id,
      hof.all_time_courses_logged,
      hof.seasons_won,
      hof.podium_finishes,
      up.display_name as user_display_name,
      up.username as user_username,
      up.profile_photo_url
    FROM user_hall_of_fame hof
    JOIN user_profiles up ON up.id = hof.user_id
    WHERE up.is_public = true
  ),
  filtered_users AS (
    SELECT ats.*
    FROM all_time_stats ats
    WHERE 
      CASE 
        WHEN p_scope = 'global' THEN true
        WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
          ats.user_id IN (SELECT friend_id FROM friend_ids) OR ats.user_id = p_current_user_id
        ELSE true
      END
  ),
  ranked AS (
    SELECT 
      fu.*,
      ROW_NUMBER() OVER (ORDER BY fu.all_time_courses_logged DESC, fu.seasons_won DESC, fu.user_id) as pos
    FROM filtered_users fu
  )
  SELECT 
    r.pos::INTEGER as podium_position,
    r.user_id,
    r.user_display_name::TEXT as display_name,
    r.user_username::TEXT as username,
    r.profile_photo_url::TEXT as avatar_url,
    r.all_time_courses_logged::INTEGER as all_time_courses,
    r.seasons_won::INTEGER,
    r.podium_finishes::INTEGER,
    -- Generate legacy narrative
    CASE 
      WHEN r.pos = 1 AND r.seasons_won > 0 THEN 'All-time leader • ' || r.seasons_won || ' season' || CASE WHEN r.seasons_won > 1 THEN 's' ELSE '' END || ' won'
      WHEN r.pos = 1 THEN 'All-time leader'
      WHEN r.seasons_won > 0 THEN r.seasons_won || 'x Season Champion'
      WHEN r.podium_finishes > 0 THEN 'Hall of Fame member'
      ELSE 'Most courses logged'
    END::TEXT as narrative_text
  FROM ranked r
  WHERE r.pos <= 3
  ORDER BY r.pos;
END;
$$;

GRANT EXECUTE ON FUNCTION get_podium_all_time TO authenticated;
GRANT EXECUTE ON FUNCTION get_podium_all_time TO anon;

-- ============================================================
-- RPC: get_user_podium_proximity
-- Returns how close the current user is to the podium
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_podium_proximity(
  p_user_id UUID,
  p_time_filter TEXT DEFAULT 'season',
  p_scope TEXT DEFAULT 'global',
  p_division_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_position INTEGER,
  third_place_courses INTEGER,
  courses_to_podium INTEGER,
  is_on_podium BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_courses INTEGER;
  v_third_courses INTEGER;
  v_user_rank INTEGER;
  v_season_id UUID;
BEGIN
  -- Get current active season
  SELECT id INTO v_season_id
  FROM championship_seasons
  WHERE status = 'active'
  LIMIT 1;

  IF p_time_filter = 'season' THEN
    -- Get user's current season courses
    SELECT uss.courses_logged INTO v_user_courses
    FROM user_season_stats uss
    WHERE uss.season_id = v_season_id
      AND uss.user_id = p_user_id;
    
    -- Get 3rd place courses for scope
    SELECT courses_logged INTO v_third_courses
    FROM (
      SELECT uss.courses_logged, ROW_NUMBER() OVER (ORDER BY uss.courses_logged DESC) as pos
      FROM user_season_stats uss
      WHERE uss.season_id = v_season_id
        AND (p_scope = 'global' OR (p_scope = 'division' AND uss.current_division = p_division_id))
    ) sub
    WHERE pos = 3;
    
    -- Calculate user's rank
    SELECT COUNT(*) + 1 INTO v_user_rank
    FROM user_season_stats uss
    WHERE uss.season_id = v_season_id
      AND uss.courses_logged > COALESCE(v_user_courses, 0);
  ELSE
    -- All-time
    SELECT all_time_courses_logged INTO v_user_courses
    FROM user_hall_of_fame
    WHERE user_hall_of_fame.user_id = p_user_id;
    
    SELECT all_time_courses_logged INTO v_third_courses
    FROM (
      SELECT all_time_courses_logged, ROW_NUMBER() OVER (ORDER BY all_time_courses_logged DESC) as pos
      FROM user_hall_of_fame
    ) sub
    WHERE pos = 3;
    
    -- Calculate user's rank
    SELECT COUNT(*) + 1 INTO v_user_rank
    FROM user_hall_of_fame
    WHERE all_time_courses_logged > COALESCE(v_user_courses, 0);
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(v_user_rank, 999)::INTEGER as user_position,
    COALESCE(v_third_courses, 0)::INTEGER as third_place_courses,
    GREATEST(0, COALESCE(v_third_courses, 0) - COALESCE(v_user_courses, 0) + 1)::INTEGER as courses_to_podium,
    (COALESCE(v_user_rank, 999) <= 3)::BOOLEAN as is_on_podium;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_podium_proximity TO authenticated;

-- ============================================================
-- RPC: archive_season_podium
-- Called at season end to snapshot podium positions
-- ============================================================
CREATE OR REPLACE FUNCTION archive_season_podium(
  p_season_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season RECORD;
BEGIN
  -- Get season info
  SELECT * INTO v_season FROM championship_seasons WHERE id = p_season_id;
  
  IF v_season IS NULL THEN
    RAISE EXCEPTION 'Season not found';
  END IF;

  -- Archive global podium
  WITH ranked AS (
    SELECT 
      uss.user_id,
      uss.courses_logged,
      uss.current_division,
      ROW_NUMBER() OVER (ORDER BY uss.courses_logged DESC) as pos
    FROM user_season_stats uss
    WHERE uss.season_id = p_season_id
  )
  INSERT INTO season_podium_archive (
    season_id, season_number, season_name, scope,
    first_place_user_id, first_place_courses, first_place_division,
    second_place_user_id, second_place_courses, second_place_division,
    third_place_user_id, third_place_courses, third_place_division
  )
  SELECT 
    p_season_id,
    v_season.season_number,
    v_season.name,
    'global',
    MAX(CASE WHEN pos = 1 THEN user_id END),
    MAX(CASE WHEN pos = 1 THEN courses_logged END),
    MAX(CASE WHEN pos = 1 THEN current_division END),
    MAX(CASE WHEN pos = 2 THEN user_id END),
    MAX(CASE WHEN pos = 2 THEN courses_logged END),
    MAX(CASE WHEN pos = 2 THEN current_division END),
    MAX(CASE WHEN pos = 3 THEN user_id END),
    MAX(CASE WHEN pos = 3 THEN courses_logged END),
    MAX(CASE WHEN pos = 3 THEN current_division END)
  FROM ranked
  WHERE pos <= 3
  ON CONFLICT (season_id, scope, division_id) DO NOTHING;

  -- Update Hall of Fame stats for podium finishers
  -- Winner
  UPDATE user_hall_of_fame
  SET 
    seasons_won = seasons_won + 1,
    podium_finishes = podium_finishes + 1,
    last_win_season_id = p_season_id,
    updated_at = NOW()
  WHERE user_id = (
    SELECT user_id FROM user_season_stats 
    WHERE season_id = p_season_id 
    ORDER BY courses_logged DESC 
    LIMIT 1
  );

  -- 2nd and 3rd place
  UPDATE user_hall_of_fame
  SET 
    podium_finishes = podium_finishes + 1,
    updated_at = NOW()
  WHERE user_id IN (
    SELECT user_id FROM (
      SELECT user_id, ROW_NUMBER() OVER (ORDER BY courses_logged DESC) as pos
      FROM user_season_stats 
      WHERE season_id = p_season_id
    ) sub
    WHERE pos IN (2, 3)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION archive_season_podium TO authenticated;