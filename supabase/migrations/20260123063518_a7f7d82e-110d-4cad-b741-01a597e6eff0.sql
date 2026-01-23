-- =====================================================
-- EXPLORATION & HANDICAP LEADERBOARDS - PHASE 1
-- Database Schema, Triggers, RPCs, and Backfill
-- =====================================================

-- ===========================================
-- 1.1 HANDICAP HISTORY TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS user_handicap_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  handicap_value DOUBLE PRECISION NOT NULL,
  previous_value DOUBLE PRECISION, -- NULL for first entry
  change_amount DOUBLE PRECISION GENERATED ALWAYS AS (
    CASE WHEN previous_value IS NOT NULL 
    THEN previous_value - handicap_value 
    ELSE NULL END
  ) STORED,
  
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'sync')),
  
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- For season tracking
  season_id UUID REFERENCES championship_seasons(id)
);

-- Indexes for leaderboard queries
CREATE INDEX idx_handicap_history_user_date ON user_handicap_history(user_id, recorded_at DESC);
CREATE INDEX idx_handicap_history_recorded ON user_handicap_history(recorded_at DESC);
CREATE INDEX idx_handicap_history_season ON user_handicap_history(season_id, user_id);

-- RLS
ALTER TABLE user_handicap_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own handicap history"
  ON user_handicap_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own handicap history"
  ON user_handicap_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- 1.2 HANDICAP HISTORY TRIGGER
-- ===========================================
CREATE OR REPLACE FUNCTION capture_handicap_change()
RETURNS TRIGGER AS $$
DECLARE
  v_season_id UUID;
BEGIN
  -- Only proceed if handicap actually changed and new value is not null
  IF (OLD.eg_handicap_index IS DISTINCT FROM NEW.eg_handicap_index) 
     AND NEW.eg_handicap_index IS NOT NULL THEN
    
    -- Get current active season
    SELECT id INTO v_season_id 
    FROM championship_seasons 
    WHERE status = 'active' 
    LIMIT 1;
    
    INSERT INTO user_handicap_history (
      user_id,
      handicap_value,
      previous_value,
      source,
      recorded_at,
      season_id
    ) VALUES (
      NEW.id,
      NEW.eg_handicap_index,
      OLD.eg_handicap_index,
      'manual',
      NOW(),
      v_season_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_capture_handicap_change
  AFTER UPDATE OF eg_handicap_index ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION capture_handicap_change();

-- ===========================================
-- 1.3 REGIONS CONFIGURATION TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS regions_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  
  -- Hierarchy
  parent_region_slug TEXT REFERENCES regions_config(slug),
  region_type TEXT NOT NULL CHECK (region_type IN ('continent', 'country', 'state', 'county', 'golf_region')),
  
  -- For country-level regions
  country_code TEXT, -- ISO 3166-1 alpha-2 (e.g., 'GB', 'US')
  
  -- For sub-country regions  
  country_codes TEXT[], -- Countries this region belongs to
  
  -- Completion threshold
  courses_required INTEGER NOT NULL DEFAULT 1, -- Courses needed to "complete" region
  
  -- Display
  flag_emoji TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_regions_config_type ON regions_config(region_type, is_active);
CREATE INDEX idx_regions_config_country ON regions_config(country_code);
CREATE INDEX idx_regions_config_parent ON regions_config(parent_region_slug);

-- Seed continents first (no parent)
INSERT INTO regions_config (slug, name, region_type, flag_emoji, sort_order) VALUES
  ('europe', 'Europe', 'continent', '🇪🇺', 1),
  ('north-america', 'North America', 'continent', '🌎', 2),
  ('asia', 'Asia', 'continent', '🌏', 3),
  ('oceania', 'Oceania', 'continent', '🌏', 4),
  ('africa', 'Africa', 'continent', '🌍', 5),
  ('south-america', 'South America', 'continent', '🌎', 6)
ON CONFLICT (slug) DO NOTHING;

-- Seed UK regions
INSERT INTO regions_config (slug, name, region_type, country_codes, flag_emoji, sort_order) VALUES
  ('england', 'England', 'country', ARRAY['GB'], '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 1),
  ('scotland', 'Scotland', 'country', ARRAY['GB'], '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 2),
  ('wales', 'Wales', 'country', ARRAY['GB'], '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 3),
  ('northern-ireland', 'Northern Ireland', 'country', ARRAY['GB'], '🇬🇧', 4),
  ('ireland', 'Ireland', 'country', ARRAY['IE'], '🇮🇪', 5)
ON CONFLICT (slug) DO NOTHING;

-- ===========================================
-- 1.4 COUNTRY-TO-REGION MAPPING
-- ===========================================
CREATE TABLE IF NOT EXISTS country_region_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL, -- ISO code from golf_courses
  region_slug TEXT NOT NULL REFERENCES regions_config(slug),
  
  UNIQUE(country_code, region_slug)
);

-- Seed mappings
INSERT INTO country_region_mapping (country_code, region_slug) VALUES
  ('GB', 'europe'),
  ('IE', 'europe'),
  ('FR', 'europe'),
  ('ES', 'europe'),
  ('PT', 'europe'),
  ('DE', 'europe'),
  ('IT', 'europe'),
  ('NL', 'europe'),
  ('BE', 'europe'),
  ('AT', 'europe'),
  ('CH', 'europe'),
  ('DK', 'europe'),
  ('SE', 'europe'),
  ('NO', 'europe'),
  ('FI', 'europe'),
  ('CZ', 'europe'),
  ('PL', 'europe'),
  ('GR', 'europe'),
  ('TR', 'europe'),
  ('US', 'north-america'),
  ('CA', 'north-america'),
  ('MX', 'north-america'),
  ('AU', 'oceania'),
  ('NZ', 'oceania'),
  ('JP', 'asia'),
  ('KR', 'asia'),
  ('TH', 'asia'),
  ('MY', 'asia'),
  ('SG', 'asia'),
  ('CN', 'asia'),
  ('IN', 'asia'),
  ('AE', 'asia'),
  ('ZA', 'africa'),
  ('MA', 'africa'),
  ('EG', 'africa'),
  ('KE', 'africa'),
  ('AR', 'south-america'),
  ('BR', 'south-america'),
  ('CL', 'south-america'),
  ('CO', 'south-america')
ON CONFLICT (country_code, region_slug) DO NOTHING;

-- ===========================================
-- 1.5 USER EXPLORATION STATS (Materialized)
-- ===========================================
CREATE TABLE IF NOT EXISTS user_exploration_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Country stats
  countries_played INTEGER NOT NULL DEFAULT 0,
  country_list TEXT[] DEFAULT '{}', -- Array of country codes
  
  -- Region stats
  regions_completed INTEGER NOT NULL DEFAULT 0,
  region_list TEXT[] DEFAULT '{}', -- Array of region slugs
  
  -- Timestamps
  last_country_added_at TIMESTAMPTZ,
  last_region_completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_exploration_stats_countries ON user_exploration_stats(countries_played DESC);
CREATE INDEX idx_exploration_stats_regions ON user_exploration_stats(regions_completed DESC);

-- RLS
ALTER TABLE user_exploration_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for exploration stats"
  ON user_exploration_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own exploration stats"
  ON user_exploration_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exploration stats"
  ON user_exploration_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- ===========================================
-- 1.6 UPDATE EXPLORATION STATS TRIGGER
-- ===========================================
CREATE OR REPLACE FUNCTION update_exploration_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_country_code TEXT;
  v_user_countries TEXT[];
  v_new_regions TEXT[];
BEGIN
  -- Get country code for the rated course
  SELECT country INTO v_country_code
  FROM golf_courses
  WHERE id = NEW.course_id;
  
  IF v_country_code IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Ensure user has exploration stats row
  INSERT INTO user_exploration_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current countries for user
  SELECT country_list INTO v_user_countries
  FROM user_exploration_stats
  WHERE user_id = NEW.user_id;
  
  -- Add country if new
  IF NOT (v_country_code = ANY(COALESCE(v_user_countries, '{}'))) THEN
    -- Get regions this country belongs to (that user doesn't already have)
    SELECT ARRAY_AGG(crm.region_slug) INTO v_new_regions
    FROM country_region_mapping crm
    WHERE crm.country_code = v_country_code
      AND NOT (crm.region_slug = ANY(
        SELECT COALESCE(region_list, '{}') FROM user_exploration_stats WHERE user_id = NEW.user_id
      ));
    
    -- Update stats
    UPDATE user_exploration_stats
    SET 
      countries_played = countries_played + 1,
      country_list = array_append(COALESCE(country_list, '{}'), v_country_code),
      regions_completed = regions_completed + COALESCE(array_length(v_new_regions, 1), 0),
      region_list = COALESCE(region_list, '{}') || COALESCE(v_new_regions, '{}'),
      last_country_added_at = NOW(),
      last_region_completed_at = CASE WHEN v_new_regions IS NOT NULL AND array_length(v_new_regions, 1) > 0 THEN NOW() ELSE last_region_completed_at END,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_exploration_stats
  AFTER INSERT ON course_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_exploration_stats();

-- ===========================================
-- 2.1 get_countries_leaderboard RPC
-- ===========================================
CREATE OR REPLACE FUNCTION get_countries_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_current_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  countries_played INTEGER,
  country_list TEXT[],
  recent_countries TEXT[],
  rank INTEGER,
  is_friend BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT 
      up.id as ru_user_id,
      up.display_name as ru_display_name,
      up.profile_photo_url as ru_profile_photo_url,
      up.home_club as ru_home_club,
      ues.countries_played as ru_countries_played,
      ues.country_list as ru_country_list,
      (SELECT ARRAY_AGG(c ORDER BY c) FROM (
        SELECT unnest(ues.country_list) as c 
        LIMIT 5
      ) sub) as ru_recent_countries,
      ROW_NUMBER() OVER (ORDER BY ues.countries_played DESC, ues.last_country_added_at DESC NULLS LAST) as ru_rank
    FROM user_exploration_stats ues
    JOIN user_profiles up ON up.id = ues.user_id
    WHERE up.is_public = true
      AND ues.countries_played > 0
  ),
  friend_list AS (
    SELECT friend_id FROM user_friends
    WHERE user_id = p_current_user_id AND status = 'accepted'
  )
  SELECT 
    ru.ru_user_id,
    ru.ru_display_name,
    ru.ru_profile_photo_url,
    ru.ru_home_club,
    ru.ru_countries_played::INTEGER,
    ru.ru_country_list,
    ru.ru_recent_countries,
    ru.ru_rank::INTEGER,
    (fl.friend_id IS NOT NULL) as is_friend
  FROM ranked_users ru
  LEFT JOIN friend_list fl ON fl.friend_id = ru.ru_user_id
  WHERE (p_scope = 'global')
     OR (p_scope = 'friends' AND (fl.friend_id IS NOT NULL OR ru.ru_user_id = p_current_user_id))
  ORDER BY ru.ru_rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_countries_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_countries_leaderboard TO anon;

-- ===========================================
-- 2.2 get_regions_leaderboard RPC
-- ===========================================
CREATE OR REPLACE FUNCTION get_regions_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_region_type TEXT DEFAULT 'all',
  p_parent_region TEXT DEFAULT NULL,
  p_current_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  regions_completed INTEGER,
  total_regions INTEGER,
  region_list TEXT[],
  completion_percentage NUMERIC,
  rank INTEGER,
  is_friend BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_regions INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_total_regions
  FROM regions_config
  WHERE is_active = true
    AND (p_region_type = 'all' OR region_type = p_region_type)
    AND (p_parent_region IS NULL OR parent_region_slug = p_parent_region);

  RETURN QUERY
  WITH ranked_users AS (
    SELECT 
      up.id as ru_user_id,
      up.display_name as ru_display_name,
      up.profile_photo_url as ru_profile_photo_url,
      up.home_club as ru_home_club,
      ues.regions_completed as ru_regions_completed,
      ues.region_list as ru_region_list,
      ROW_NUMBER() OVER (ORDER BY ues.regions_completed DESC, ues.last_region_completed_at DESC NULLS LAST) as ru_rank
    FROM user_exploration_stats ues
    JOIN user_profiles up ON up.id = ues.user_id
    WHERE up.is_public = true
      AND ues.regions_completed > 0
  ),
  friend_list AS (
    SELECT friend_id FROM user_friends
    WHERE user_id = p_current_user_id AND status = 'accepted'
  )
  SELECT 
    ru.ru_user_id,
    ru.ru_display_name,
    ru.ru_profile_photo_url,
    ru.ru_home_club,
    ru.ru_regions_completed::INTEGER,
    v_total_regions,
    ru.ru_region_list,
    ROUND((ru.ru_regions_completed::NUMERIC / NULLIF(v_total_regions, 0)) * 100, 1),
    ru.ru_rank::INTEGER,
    (fl.friend_id IS NOT NULL) as is_friend
  FROM ranked_users ru
  LEFT JOIN friend_list fl ON fl.friend_id = ru.ru_user_id
  WHERE (p_scope = 'global')
     OR (p_scope = 'friends' AND (fl.friend_id IS NOT NULL OR ru.ru_user_id = p_current_user_id))
  ORDER BY ru.ru_rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_regions_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_regions_leaderboard TO anon;

-- ===========================================
-- 2.3 get_handicap_improvement_leaderboard RPC
-- ===========================================
CREATE OR REPLACE FUNCTION get_handicap_improvement_leaderboard(
  p_days INTEGER DEFAULT 30,
  p_scope TEXT DEFAULT 'global',
  p_region TEXT DEFAULT NULL,
  p_club_id UUID DEFAULT NULL,
  p_current_user_id UUID DEFAULT NULL,
  p_min_rounds INTEGER DEFAULT 3,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  handicap_before DOUBLE PRECISION,
  handicap_current DOUBLE PRECISION,
  improvement DOUBLE PRECISION,
  rounds_in_period INTEGER,
  rank INTEGER,
  is_friend BOOLEAN,
  is_big_mover BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff_date TIMESTAMPTZ := NOW() - (p_days || ' days')::INTERVAL;
BEGIN
  RETURN QUERY
  WITH user_earliest_in_period AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id as ue_user_id,
      uhh.handicap_value as earliest_handicap
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at <= v_cutoff_date
    ORDER BY uhh.user_id, uhh.recorded_at DESC
  ),
  improvements AS (
    SELECT 
      ue.ue_user_id as imp_user_id,
      ue.earliest_handicap as imp_handicap_before,
      up.eg_handicap_index as imp_handicap_current,
      (ue.earliest_handicap - up.eg_handicap_index) as imp_improvement
    FROM user_earliest_in_period ue
    JOIN user_profiles up ON up.id = ue.ue_user_id
    WHERE up.is_public = true
      AND up.show_handicap = true
      AND up.eg_handicap_index IS NOT NULL
      AND ue.earliest_handicap > up.eg_handicap_index
  ),
  ranked_users AS (
    SELECT 
      up.id as ru_user_id,
      up.display_name as ru_display_name,
      up.profile_photo_url as ru_profile_photo_url,
      up.home_club as ru_home_club,
      i.imp_handicap_before as ru_handicap_before,
      i.imp_handicap_current as ru_handicap_current,
      i.imp_improvement as ru_improvement,
      0 as ru_rounds_in_period,
      ROW_NUMBER() OVER (ORDER BY i.imp_improvement DESC) as ru_rank,
      (i.imp_improvement >= 2.0) as ru_is_big_mover
    FROM improvements i
    JOIN user_profiles up ON up.id = i.imp_user_id
  ),
  friend_list AS (
    SELECT friend_id FROM user_friends
    WHERE user_id = p_current_user_id AND status = 'accepted'
  )
  SELECT 
    ru.ru_user_id,
    ru.ru_display_name,
    ru.ru_profile_photo_url,
    ru.ru_home_club,
    ru.ru_handicap_before,
    ru.ru_handicap_current,
    ru.ru_improvement,
    ru.ru_rounds_in_period::INTEGER,
    ru.ru_rank::INTEGER,
    (fl.friend_id IS NOT NULL) as is_friend,
    ru.ru_is_big_mover
  FROM ranked_users ru
  LEFT JOIN friend_list fl ON fl.friend_id = ru.ru_user_id
  WHERE (p_scope = 'global')
     OR (p_scope = 'friends' AND (fl.friend_id IS NOT NULL OR ru.ru_user_id = p_current_user_id))
  ORDER BY ru.ru_rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_handicap_improvement_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_handicap_improvement_leaderboard TO anon;

-- ===========================================
-- 2.4 get_lowest_handicap_leaderboard RPC
-- ===========================================
CREATE OR REPLACE FUNCTION get_lowest_handicap_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_region TEXT DEFAULT NULL,
  p_club_id UUID DEFAULT NULL,
  p_current_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  primary_club_id UUID,
  current_handicap DOUBLE PRECISION,
  rank INTEGER,
  is_friend BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT 
      up.id as ru_user_id,
      up.display_name as ru_display_name,
      up.profile_photo_url as ru_profile_photo_url,
      up.home_club as ru_home_club,
      up.primary_club_id as ru_primary_club_id,
      up.eg_handicap_index as ru_current_handicap,
      ROW_NUMBER() OVER (ORDER BY up.eg_handicap_index ASC NULLS LAST) as ru_rank
    FROM user_profiles up
    WHERE up.is_public = true
      AND up.show_handicap = true
      AND up.eg_handicap_index IS NOT NULL
  ),
  friend_list AS (
    SELECT friend_id FROM user_friends
    WHERE user_id = p_current_user_id AND status = 'accepted'
  )
  SELECT 
    ru.ru_user_id,
    ru.ru_display_name,
    ru.ru_profile_photo_url,
    ru.ru_home_club,
    ru.ru_primary_club_id,
    ru.ru_current_handicap,
    ru.ru_rank::INTEGER,
    (fl.friend_id IS NOT NULL) as is_friend
  FROM ranked_users ru
  LEFT JOIN friend_list fl ON fl.friend_id = ru.ru_user_id
  WHERE (p_scope = 'global')
     OR (p_scope = 'friends' AND (fl.friend_id IS NOT NULL OR ru.ru_user_id = p_current_user_id))
     OR (p_scope = 'club' AND ru.ru_primary_club_id = p_club_id)
  ORDER BY ru.ru_rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_lowest_handicap_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_lowest_handicap_leaderboard TO anon;

-- ===========================================
-- 2.5 get_season_improvement_leaderboard RPC
-- ===========================================
CREATE OR REPLACE FUNCTION get_season_improvement_leaderboard(
  p_season_id UUID DEFAULT NULL,
  p_scope TEXT DEFAULT 'global',
  p_current_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  handicap_season_start DOUBLE PRECISION,
  handicap_current DOUBLE PRECISION,
  improvement DOUBLE PRECISION,
  rank INTEGER,
  is_friend BOOLEAN,
  season_name TEXT,
  days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id UUID;
  v_season_name TEXT;
  v_season_start TIMESTAMPTZ;
  v_season_end TIMESTAMPTZ;
  v_days_remaining INTEGER;
BEGIN
  IF p_season_id IS NULL THEN
    SELECT id, name, start_date, end_date 
    INTO v_season_id, v_season_name, v_season_start, v_season_end
    FROM championship_seasons 
    WHERE status = 'active' 
    LIMIT 1;
  ELSE
    SELECT id, name, start_date, end_date 
    INTO v_season_id, v_season_name, v_season_start, v_season_end
    FROM championship_seasons 
    WHERE id = p_season_id;
  END IF;
  
  v_days_remaining := GREATEST(0, EXTRACT(DAY FROM v_season_end - NOW())::INTEGER);

  RETURN QUERY
  WITH season_start_handicaps AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id as ssh_user_id,
      uhh.handicap_value as ssh_handicap_season_start
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at <= COALESCE(v_season_start, NOW())
    ORDER BY uhh.user_id, uhh.recorded_at DESC
  ),
  improvements AS (
    SELECT 
      ssh.ssh_user_id as imp_user_id,
      ssh.ssh_handicap_season_start as imp_handicap_season_start,
      up.eg_handicap_index as imp_handicap_current,
      (ssh.ssh_handicap_season_start - up.eg_handicap_index) as imp_improvement
    FROM season_start_handicaps ssh
    JOIN user_profiles up ON up.id = ssh.ssh_user_id
    WHERE up.is_public = true
      AND up.show_handicap = true
      AND up.eg_handicap_index IS NOT NULL
      AND ssh.ssh_handicap_season_start > up.eg_handicap_index
  ),
  ranked_users AS (
    SELECT 
      up.id as ru_user_id,
      up.display_name as ru_display_name,
      up.profile_photo_url as ru_profile_photo_url,
      up.home_club as ru_home_club,
      i.imp_handicap_season_start as ru_handicap_season_start,
      i.imp_handicap_current as ru_handicap_current,
      i.imp_improvement as ru_improvement,
      ROW_NUMBER() OVER (ORDER BY i.imp_improvement DESC) as ru_rank
    FROM improvements i
    JOIN user_profiles up ON up.id = i.imp_user_id
  ),
  friend_list AS (
    SELECT friend_id FROM user_friends
    WHERE user_id = p_current_user_id AND status = 'accepted'
  )
  SELECT 
    ru.ru_user_id,
    ru.ru_display_name,
    ru.ru_profile_photo_url,
    ru.ru_home_club,
    ru.ru_handicap_season_start,
    ru.ru_handicap_current,
    ru.ru_improvement,
    ru.ru_rank::INTEGER,
    (fl.friend_id IS NOT NULL) as is_friend,
    COALESCE(v_season_name, 'Current Season') as season_name,
    COALESCE(v_days_remaining, 0) as days_remaining
  FROM ranked_users ru
  LEFT JOIN friend_list fl ON fl.friend_id = ru.ru_user_id
  WHERE (p_scope = 'global')
     OR (p_scope = 'friends' AND (fl.friend_id IS NOT NULL OR ru.ru_user_id = p_current_user_id))
  ORDER BY ru.ru_rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_season_improvement_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_season_improvement_leaderboard TO anon;

-- ===========================================
-- 2.6 get_user_exploration_status RPC
-- ===========================================
CREATE OR REPLACE FUNCTION get_user_exploration_status(
  p_user_id UUID
)
RETURNS TABLE (
  countries_played INTEGER,
  countries_rank INTEGER,
  country_list TEXT[],
  regions_completed INTEGER,
  regions_rank INTEGER,
  total_regions INTEGER,
  region_list TEXT[],
  next_country_suggestion TEXT,
  next_region_suggestion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT * FROM user_exploration_stats WHERE user_id = p_user_id
  ),
  country_rank AS (
    SELECT (COUNT(*) + 1)::INTEGER as crank
    FROM user_exploration_stats
    WHERE countries_played > COALESCE((SELECT countries_played FROM user_stats), 0)
  ),
  region_rank AS (
    SELECT (COUNT(*) + 1)::INTEGER as rrank
    FROM user_exploration_stats
    WHERE regions_completed > COALESCE((SELECT regions_completed FROM user_stats), 0)
  ),
  total_reg AS (
    SELECT COUNT(*)::INTEGER as total FROM regions_config WHERE is_active = true
  )
  SELECT 
    COALESCE(us.countries_played, 0)::INTEGER,
    COALESCE(cr.crank, 1)::INTEGER,
    COALESCE(us.country_list, '{}'),
    COALESCE(us.regions_completed, 0)::INTEGER,
    COALESCE(rr.rrank, 1)::INTEGER,
    COALESCE(tr.total, 0)::INTEGER,
    COALESCE(us.region_list, '{}'),
    NULL::TEXT as next_country_suggestion,
    NULL::TEXT as next_region_suggestion
  FROM (SELECT 1) dummy
  LEFT JOIN user_stats us ON true
  CROSS JOIN country_rank cr
  CROSS JOIN region_rank rr
  CROSS JOIN total_reg tr;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_exploration_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_exploration_status TO anon;

-- ===========================================
-- BACKFILL: Seed handicap history baseline
-- ===========================================
INSERT INTO user_handicap_history (user_id, handicap_value, source, recorded_at, season_id)
SELECT 
  id as user_id,
  eg_handicap_index as handicap_value,
  'import' as source,
  COALESCE(updated_at, NOW()) as recorded_at,
  (SELECT id FROM championship_seasons WHERE status = 'active' LIMIT 1) as season_id
FROM user_profiles
WHERE eg_handicap_index IS NOT NULL
ON CONFLICT DO NOTHING;

-- ===========================================
-- BACKFILL: Populate exploration stats
-- ===========================================
INSERT INTO user_exploration_stats (user_id, countries_played, country_list, regions_completed, region_list, updated_at)
SELECT 
  cr.user_id,
  COUNT(DISTINCT gc.country)::INTEGER as countries_played,
  ARRAY_AGG(DISTINCT gc.country) FILTER (WHERE gc.country IS NOT NULL) as country_list,
  COUNT(DISTINCT crm.region_slug)::INTEGER as regions_completed,
  ARRAY_AGG(DISTINCT crm.region_slug) FILTER (WHERE crm.region_slug IS NOT NULL) as region_list,
  NOW() as updated_at
FROM course_ratings cr
JOIN golf_courses gc ON gc.id = cr.course_id
LEFT JOIN country_region_mapping crm ON crm.country_code = gc.country
WHERE gc.country IS NOT NULL
  AND cr.user_id IS NOT NULL
GROUP BY cr.user_id
ON CONFLICT (user_id) 
DO UPDATE SET
  countries_played = EXCLUDED.countries_played,
  country_list = EXCLUDED.country_list,
  regions_completed = EXCLUDED.regions_completed,
  region_list = EXCLUDED.region_list,
  updated_at = NOW();