-- ============================================
-- CHAMPIONSHIP MODE: PHASE 1 DATABASE SCHEMA
-- Clean migration with unique index names
-- ============================================

-- 1. Championship Seasons
CREATE TABLE public.championship_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

CREATE INDEX idx_champ_seasons_status ON public.championship_seasons(status);
CREATE INDEX idx_champ_seasons_dates ON public.championship_seasons(start_date, end_date);

ALTER TABLE public.championship_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view seasons" ON public.championship_seasons FOR SELECT USING (true);

-- 2. Division Config
CREATE TABLE public.division_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  ring_color TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  promotion_zone_size INTEGER DEFAULT 3,
  relegation_zone_size INTEGER DEFAULT 0,
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.division_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view divisions" ON public.division_config FOR SELECT USING (true);

INSERT INTO public.division_config (division_id, display_name, threshold, ring_color, sort_order) VALUES
  ('rookie', 'Rookie Club', 0, '#6B7280', 1),
  ('fairway', 'Fairway Club', 5, '#10B981', 2),
  ('eagle', 'Eagle Club', 10, '#3B82F6', 3),
  ('founders', 'Founders Club', 20, '#8B5CF6', 4),
  ('heritage', 'Heritage Club', 50, '#F59E0B', 5),
  ('champion', 'Champion Club', 100, '#EF4444', 6);

-- 3. User Season Stats
CREATE TABLE public.user_season_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.championship_seasons(id) ON DELETE CASCADE,
  courses_logged INTEGER NOT NULL DEFAULT 0,
  current_rank INTEGER,
  best_rank INTEGER,
  rank_at_season_end INTEGER,
  current_division TEXT NOT NULL DEFAULT 'rookie',
  highest_division_reached TEXT NOT NULL DEFAULT 'rookie',
  promotion_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  active_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  streak_last_updated DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, season_id)
);

CREATE INDEX idx_champ_user_stats_season ON public.user_season_stats(season_id);
CREATE INDEX idx_champ_user_stats_rank ON public.user_season_stats(season_id, courses_logged DESC, last_activity_at DESC);
CREATE INDEX idx_champ_user_stats_user ON public.user_season_stats(user_id);

ALTER TABLE public.user_season_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view season stats" ON public.user_season_stats FOR SELECT USING (true);
CREATE POLICY "Users can update own stats" ON public.user_season_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert stats" ON public.user_season_stats FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- 4. User Rank Snapshots (with unique index names)
CREATE TABLE public.user_rank_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.championship_seasons(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  global_rank INTEGER NOT NULL,
  regional_rank INTEGER,
  region_slug TEXT,
  courses_logged INTEGER NOT NULL,
  division TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, season_id, snapshot_date)
);

CREATE INDEX idx_champ_snapshots_user_date ON public.user_rank_snapshots(user_id, snapshot_date DESC);
CREATE INDEX idx_champ_snapshots_season_date ON public.user_rank_snapshots(season_id, snapshot_date);

ALTER TABLE public.user_rank_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rank snapshots" ON public.user_rank_snapshots FOR SELECT USING (true);

-- 5. User Rivals
CREATE TABLE public.user_rivals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  rival_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  rival_type TEXT NOT NULL DEFAULT 'auto' CHECK (rival_type IN ('auto', 'manual', 'suggested')),
  is_active BOOLEAN DEFAULT true,
  times_overtaken INTEGER DEFAULT 0,
  times_been_overtaken INTEGER DEFAULT 0,
  current_gap INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, rival_id),
  CHECK (user_id != rival_id)
);

CREATE INDEX idx_champ_rivals_user ON public.user_rivals(user_id, is_active);

ALTER TABLE public.user_rivals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own rivals" ON public.user_rivals FOR SELECT USING (auth.uid() = user_id OR auth.uid() = rival_id);
CREATE POLICY "Users can manage own rivals" ON public.user_rivals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rivals" ON public.user_rivals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rivals" ON public.user_rivals FOR DELETE USING (auth.uid() = user_id);

-- 6. Season Badges
CREATE TABLE public.season_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.championship_seasons(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_data JSONB DEFAULT '{}',
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, season_id, badge_type)
);

CREATE INDEX idx_champ_badges_user ON public.season_badges(user_id);

ALTER TABLE public.season_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON public.season_badges FOR SELECT USING (true);

-- 7. Update trigger function
CREATE OR REPLACE FUNCTION public.update_championship_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_champ_user_stats_updated_at
  BEFORE UPDATE ON public.user_season_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_championship_updated_at();

CREATE TRIGGER trigger_champ_rivals_updated_at
  BEFORE UPDATE ON public.user_rivals
  FOR EACH ROW EXECUTE FUNCTION public.update_championship_updated_at();

-- 8. Create Season 1 (active)
INSERT INTO public.championship_seasons (season_number, name, start_date, end_date, status)
VALUES (1, 'Season 1', '2026-01-01 00:00:00+00', '2026-03-31 23:59:59+00', 'active');