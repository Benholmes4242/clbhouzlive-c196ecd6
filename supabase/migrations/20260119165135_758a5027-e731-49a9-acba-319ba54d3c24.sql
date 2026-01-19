-- Phase 4: Gamification Depth Database Schema
-- Creates user_streaks table, course metadata columns, combination_achievements table, triggers and RPC functions

-- ============================================
-- Part 1: User Streaks Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Current streak tracking
  current_streak_months INTEGER NOT NULL DEFAULT 0,
  current_streak_start DATE,
  last_activity_month DATE,  -- Format: first day of month (e.g., 2026-01-01)
  
  -- Historical best
  longest_streak_months INTEGER NOT NULL DEFAULT 0,
  longest_streak_start DATE,
  longest_streak_end DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT user_streaks_user_unique UNIQUE (user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_streaks
CREATE POLICY "Users can view their own streaks"
  ON public.user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON public.user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert streaks"
  ON public.user_streaks FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Part 2: Course Metadata Extension
-- ============================================

-- Add course_type enum (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_type') THEN
    CREATE TYPE course_type AS ENUM ('links', 'parkland', 'heathland', 'desert', 'mountain', 'coastal', 'mixed');
  END IF;
END$$;

-- Add columns to golf_courses table
ALTER TABLE public.golf_courses
  ADD COLUMN IF NOT EXISTS course_type course_type,
  ADD COLUMN IF NOT EXISTS has_hosted_major BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS major_championships TEXT[],
  ADD COLUMN IF NOT EXISTS country_code CHAR(3);

-- Indexes for combination achievement queries
CREATE INDEX IF NOT EXISTS idx_golf_courses_type ON public.golf_courses(course_type);
CREATE INDEX IF NOT EXISTS idx_golf_courses_major ON public.golf_courses(has_hosted_major) WHERE has_hosted_major = true;
CREATE INDEX IF NOT EXISTS idx_golf_courses_country_code ON public.golf_courses(country_code);

-- ============================================
-- Part 3: Combination Achievements Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.combination_achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tier_name TEXT NOT NULL,
  badge_image_key TEXT,
  
  -- Achievement criteria
  achievement_type TEXT NOT NULL, -- 'course_type', 'country_count', 'country_set', 'major_venues'
  target_value INTEGER NOT NULL,
  criteria_json JSONB,
  
  -- Display
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.combination_achievements ENABLE ROW LEVEL SECURITY;

-- Everyone can read combination achievements (they're definitions, not user data)
CREATE POLICY "Anyone can view combination achievements"
  ON public.combination_achievements FOR SELECT
  USING (true);

-- Insert combination achievements
INSERT INTO public.combination_achievements (id, name, description, tier_name, achievement_type, target_value, criteria_json, sort_order, badge_image_key) VALUES
  ('links-lover', 'Links Lover', 'Play 10 links courses from the Top 100', 'Links Master', 'course_type', 10, '{"course_type": "links"}', 1, 'linksLoverBadge'),
  ('parkland-pioneer', 'Parkland Pioneer', 'Play 10 parkland courses from the Top 100', 'Parkland Master', 'course_type', 10, '{"course_type": "parkland"}', 2, 'parklandPioneerBadge'),
  ('island-hopper', 'Island Hopper', 'Play Top 100 courses in 5 different countries', 'World Traveler', 'country_count', 5, NULL, 3, 'islandHopperBadge'),
  ('major-hunter', 'Major Hunter', 'Play 5 major championship venues', 'Major Champion', 'major_venues', 5, NULL, 4, 'majorHunterBadge'),
  ('home-nations', 'Home Nations', 'Play courses in England, Scotland, Wales, and Ireland', 'British Isles Master', 'country_set', 4, '{"countries": ["GBR", "IRL"]}', 5, 'homeNationsBadge')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Part 4: Streak Calculation Trigger
-- ============================================

CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_rating_month DATE;
  v_current_streak user_streaks%ROWTYPE;
  v_prev_month DATE;
BEGIN
  -- Skip if user_id is null
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get the user and month of the new rating
  v_user_id := NEW.user_id;
  v_rating_month := DATE_TRUNC('month', NEW.created_at)::DATE;
  
  -- Get or create streak record
  SELECT * INTO v_current_streak
  FROM user_streaks
  WHERE user_id = v_user_id;
  
  IF NOT FOUND THEN
    -- First rating ever - create streak record
    INSERT INTO user_streaks (
      user_id,
      current_streak_months,
      current_streak_start,
      last_activity_month,
      longest_streak_months,
      longest_streak_start
    ) VALUES (
      v_user_id,
      1,
      v_rating_month,
      v_rating_month,
      1,
      v_rating_month
    );
    RETURN NEW;
  END IF;
  
  -- Check if this is same month as last activity (no change needed)
  IF v_current_streak.last_activity_month = v_rating_month THEN
    RETURN NEW;
  END IF;
  
  -- Calculate expected previous month for streak continuation
  v_prev_month := (v_rating_month - INTERVAL '1 month')::DATE;
  
  IF v_current_streak.last_activity_month = v_prev_month THEN
    -- Streak continues! Increment
    UPDATE user_streaks
    SET
      current_streak_months = current_streak_months + 1,
      last_activity_month = v_rating_month,
      longest_streak_months = GREATEST(longest_streak_months, current_streak_months + 1),
      longest_streak_end = CASE
        WHEN current_streak_months + 1 > longest_streak_months
        THEN v_rating_month
        ELSE longest_streak_end
      END,
      updated_at = NOW()
    WHERE user_id = v_user_id;
  ELSE
    -- Streak broken - reset
    UPDATE user_streaks
    SET
      current_streak_months = 1,
      current_streak_start = v_rating_month,
      last_activity_month = v_rating_month,
      updated_at = NOW()
    WHERE user_id = v_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on course_ratings insert
DROP TRIGGER IF EXISTS trigger_update_user_streak ON public.course_ratings;
CREATE TRIGGER trigger_update_user_streak
  AFTER INSERT ON public.course_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_streak();

-- ============================================
-- Part 5: Streak Achievements RPC Function
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_streak_achievements(p_user_id UUID)
RETURNS TABLE (
  achievement_id TEXT,
  achievement_name TEXT,
  tier_name TEXT,
  threshold_months INTEGER,
  is_earned BOOLEAN,
  earned_at TIMESTAMPTZ,
  current_progress INTEGER
) AS $$
DECLARE
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  -- Get user's streak data
  SELECT
    COALESCE(current_streak_months, 0),
    COALESCE(longest_streak_months, 0)
  INTO v_current_streak, v_longest_streak
  FROM user_streaks
  WHERE user_id = p_user_id;
  
  -- Default to 0 if no record
  v_current_streak := COALESCE(v_current_streak, 0);
  v_longest_streak := COALESCE(v_longest_streak, 0);
  
  -- Return streak achievements
  RETURN QUERY
  SELECT
    'streak-3' AS achievement_id,
    '3-Month Streak' AS achievement_name,
    'Committed' AS tier_name,
    3 AS threshold_months,
    (v_longest_streak >= 3) AS is_earned,
    CASE WHEN v_longest_streak >= 3 THEN NOW() ELSE NULL END AS earned_at,
    v_current_streak AS current_progress
  UNION ALL
  SELECT
    'streak-6',
    '6-Month Streak',
    'Devoted',
    6,
    (v_longest_streak >= 6),
    CASE WHEN v_longest_streak >= 6 THEN NOW() ELSE NULL END,
    v_current_streak
  UNION ALL
  SELECT
    'streak-12',
    '12-Month Streak',
    'Obsessed',
    12,
    (v_longest_streak >= 12),
    CASE WHEN v_longest_streak >= 12 THEN NOW() ELSE NULL END,
    v_current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Part 6: Combination Achievements RPC Function
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_combination_achievements(p_user_id UUID)
RETURNS TABLE (
  achievement_id TEXT,
  achievement_name TEXT,
  tier_name TEXT,
  description TEXT,
  target_value INTEGER,
  current_progress INTEGER,
  is_earned BOOLEAN,
  progress_details JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_rated_courses AS (
    -- Get all Top 100 courses the user has rated
    SELECT DISTINCT
      c.id,
      c.course_type,
      c.country_code,
      c.has_hosted_major
    FROM course_ratings cr
    JOIN golf_courses c ON c.id = cr.course_id
    JOIN course_top100_memberships ctm ON ctm.course_id = c.id
    WHERE cr.user_id = p_user_id
  ),
  course_type_counts AS (
    SELECT course_type::TEXT as ct, COUNT(*)::INTEGER as count
    FROM user_rated_courses
    WHERE course_type IS NOT NULL
    GROUP BY course_type
  ),
  country_stats AS (
    SELECT
      COUNT(DISTINCT country_code)::INTEGER as country_count,
      ARRAY_AGG(DISTINCT country_code) as countries
    FROM user_rated_courses
    WHERE country_code IS NOT NULL
  ),
  major_count AS (
    SELECT COUNT(*)::INTEGER as count
    FROM user_rated_courses
    WHERE has_hosted_major = true
  )
  SELECT
    ca.id,
    ca.name,
    ca.tier_name,
    ca.description,
    ca.target_value,
    CASE
      WHEN ca.achievement_type = 'course_type' THEN
        COALESCE((SELECT count FROM course_type_counts WHERE ct = ca.criteria_json->>'course_type'), 0)
      WHEN ca.achievement_type = 'country_count' THEN
        COALESCE((SELECT country_count FROM country_stats), 0)
      WHEN ca.achievement_type = 'major_venues' THEN
        COALESCE((SELECT count FROM major_count), 0)
      WHEN ca.achievement_type = 'country_set' THEN
        COALESCE((
          SELECT COUNT(*)::INTEGER
          FROM (
            SELECT UNNEST(ARRAY(SELECT jsonb_array_elements_text(ca.criteria_json->'countries'))) as req_country
          ) req
          WHERE req.req_country = ANY((SELECT countries FROM country_stats))
        ), 0)
      ELSE 0
    END as current_progress,
    CASE
      WHEN ca.achievement_type = 'course_type' THEN
        COALESCE((SELECT count FROM course_type_counts WHERE ct = ca.criteria_json->>'course_type'), 0) >= ca.target_value
      WHEN ca.achievement_type = 'country_count' THEN
        COALESCE((SELECT country_count FROM country_stats), 0) >= ca.target_value
      WHEN ca.achievement_type = 'major_venues' THEN
        COALESCE((SELECT count FROM major_count), 0) >= ca.target_value
      WHEN ca.achievement_type = 'country_set' THEN
        COALESCE((
          SELECT COUNT(*)::INTEGER
          FROM (
            SELECT UNNEST(ARRAY(SELECT jsonb_array_elements_text(ca.criteria_json->'countries'))) as req_country
          ) req
          WHERE req.req_country = ANY((SELECT countries FROM country_stats))
        ), 0) >= ca.target_value
      ELSE false
    END as is_earned,
    CASE
      WHEN ca.achievement_type = 'country_count' OR ca.achievement_type = 'country_set' THEN
        (SELECT TO_JSONB(countries) FROM country_stats)
      ELSE NULL
    END as progress_details
  FROM combination_achievements ca
  WHERE ca.is_active = true
  ORDER BY ca.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;