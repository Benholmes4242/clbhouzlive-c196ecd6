
-- ============================================================
-- Sprint 3: College Golf - Snapshots, Movers, Rivalries, Follows
-- ============================================================

-- 1) Weekly snapshots table for computing week-over-week deltas
CREATE TABLE public.college_stats_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.sr_seasons(id) ON DELETE CASCADE,
  normalized_name TEXT NOT NULL,
  week_start DATE NOT NULL, -- Monday UTC
  week_end DATE NOT NULL,   -- Sunday UTC
  earnings_total NUMERIC NOT NULL DEFAULT 0,
  wins_total INTEGER NOT NULL DEFAULT 0,
  cuts_total INTEGER NOT NULL DEFAULT 0,
  top10_total INTEGER NOT NULL DEFAULT 0,
  top25_total INTEGER NOT NULL DEFAULT 0,
  player_count INTEGER NOT NULL DEFAULT 0,
  events_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(season_id, normalized_name, week_start)
);

ALTER TABLE public.college_stats_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Snapshots are publicly readable" ON public.college_stats_snapshots FOR SELECT USING (true);

CREATE INDEX idx_college_snapshots_season_week ON public.college_stats_snapshots(season_id, week_start);
CREATE INDEX idx_college_snapshots_name ON public.college_stats_snapshots(season_id, normalized_name);
CREATE INDEX idx_college_snapshots_earnings ON public.college_stats_snapshots(season_id, week_start, earnings_total DESC);

-- 2) Weekly movers table (pre-computed deltas)
CREATE TABLE public.college_weekly_movers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.sr_seasons(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  normalized_name TEXT NOT NULL,
  earnings_delta NUMERIC NOT NULL DEFAULT 0,
  wins_delta INTEGER NOT NULL DEFAULT 0,
  cuts_delta INTEGER NOT NULL DEFAULT 0,
  top10_delta INTEGER NOT NULL DEFAULT 0,
  earnings_rank_this_week INTEGER,
  earnings_rank_last_week INTEGER,
  earnings_rank_change INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(season_id, normalized_name, week_start)
);

ALTER TABLE public.college_weekly_movers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Movers are publicly readable" ON public.college_weekly_movers FOR SELECT USING (true);

CREATE INDEX idx_college_movers_season_week ON public.college_weekly_movers(season_id, week_start);
CREATE INDEX idx_college_movers_delta ON public.college_weekly_movers(season_id, week_start, earnings_delta DESC);

-- 3) College rivalries table
CREATE TABLE public.college_rivalries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  college_a TEXT NOT NULL,
  college_b TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(college_a, college_b)
);

ALTER TABLE public.college_rivalries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rivalries are publicly readable" ON public.college_rivalries FOR SELECT USING (true);

CREATE INDEX idx_college_rivalries_a ON public.college_rivalries(college_a);
CREATE INDEX idx_college_rivalries_b ON public.college_rivalries(college_b);

-- Seed initial rivalries (top programs + regional/conference matchups)
INSERT INTO public.college_rivalries (college_a, college_b, weight) VALUES
  ('georgia', 'texas', 2),
  ('georgia', 'alabama', 2),
  ('texas', 'oklahomastate', 2),
  ('texas', 'texas', 1),
  ('alabama', 'auburn', 2),
  ('stanford', 'california', 2),
  ('usc', 'ucla', 2),
  ('northcarolina', 'duke', 2),
  ('florida', 'floridastate', 2),
  ('ohiostate', 'michigan', 2),
  ('arizonastate', 'arizona', 2),
  ('oklahoma', 'oklahomastate', 2),
  ('clemson', 'southcarolina', 2),
  ('lsu', 'alabama', 1),
  ('tennessee', 'georgia', 1),
  ('washington', 'oregon', 2),
  ('sandiegostate', 'unlv', 1),
  ('kentstate', 'ohiostate', 1),
  ('pepperdine', 'usc', 1),
  ('illinois', 'northwestern', 2)
ON CONFLICT (college_a, college_b) DO NOTHING;

-- 4) User followed colleges
CREATE TABLE public.user_followed_colleges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, normalized_name)
);

ALTER TABLE public.user_followed_colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their followed colleges" 
  ON public.user_followed_colleges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can follow colleges" 
  ON public.user_followed_colleges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow colleges" 
  ON public.user_followed_colleges FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_followed_colleges_user ON public.user_followed_colleges(user_id);
CREATE INDEX idx_followed_colleges_name ON public.user_followed_colleges(normalized_name);

-- 5) Bootstrap: Seed "last week" snapshot for demo (Option 1)
-- Get current Monday and last Monday
DO $$
DECLARE
  current_season_id UUID;
  this_monday DATE;
  last_monday DATE;
BEGIN
  -- Get the current season
  SELECT id INTO current_season_id FROM sr_seasons ORDER BY year DESC LIMIT 1;
  
  -- Calculate Mondays
  this_monday := date_trunc('week', CURRENT_DATE)::DATE;
  last_monday := this_monday - INTERVAL '7 days';
  
  -- Insert "last week" snapshot (slightly reduced values for demo)
  INSERT INTO public.college_stats_snapshots (
    season_id, normalized_name, week_start, week_end,
    earnings_total, wins_total, cuts_total, top10_total, top25_total, player_count, events_total
  )
  SELECT 
    season_id,
    normalized_name,
    last_monday,
    last_monday + INTERVAL '6 days',
    GREATEST(0, earnings_total - (earnings_total * 0.05)), -- 5% less
    GREATEST(0, wins_total - 1),
    GREATEST(0, cuts_total - 2),
    GREATEST(0, top10_total - 1),
    GREATEST(0, top25_total - 2),
    player_count,
    GREATEST(0, events_total - 3)
  FROM public.college_season_stats
  WHERE season_id = current_season_id
  ON CONFLICT (season_id, normalized_name, week_start) DO NOTHING;
  
  -- Insert "this week" snapshot (current values)
  INSERT INTO public.college_stats_snapshots (
    season_id, normalized_name, week_start, week_end,
    earnings_total, wins_total, cuts_total, top10_total, top25_total, player_count, events_total
  )
  SELECT 
    season_id,
    normalized_name,
    this_monday,
    this_monday + INTERVAL '6 days',
    earnings_total,
    wins_total,
    cuts_total,
    top10_total,
    top25_total,
    player_count,
    events_total
  FROM public.college_season_stats
  WHERE season_id = current_season_id
  ON CONFLICT (season_id, normalized_name, week_start) DO NOTHING;
  
  -- Compute movers for this week
  INSERT INTO public.college_weekly_movers (
    season_id, week_start, normalized_name,
    earnings_delta, wins_delta, cuts_delta, top10_delta,
    earnings_rank_this_week, earnings_rank_last_week, earnings_rank_change
  )
  SELECT 
    curr.season_id,
    curr.week_start,
    curr.normalized_name,
    curr.earnings_total - COALESCE(prev.earnings_total, 0),
    curr.wins_total - COALESCE(prev.wins_total, 0),
    curr.cuts_total - COALESCE(prev.cuts_total, 0),
    curr.top10_total - COALESCE(prev.top10_total, 0),
    curr_rank.rn,
    prev_rank.rn,
    COALESCE(prev_rank.rn, curr_rank.rn) - curr_rank.rn
  FROM public.college_stats_snapshots curr
  LEFT JOIN public.college_stats_snapshots prev 
    ON prev.season_id = curr.season_id 
    AND prev.normalized_name = curr.normalized_name
    AND prev.week_start = curr.week_start - INTERVAL '7 days'
  LEFT JOIN (
    SELECT normalized_name, ROW_NUMBER() OVER (ORDER BY earnings_total DESC) as rn
    FROM public.college_stats_snapshots
    WHERE season_id = current_season_id AND week_start = this_monday
  ) curr_rank ON curr_rank.normalized_name = curr.normalized_name
  LEFT JOIN (
    SELECT normalized_name, ROW_NUMBER() OVER (ORDER BY earnings_total DESC) as rn
    FROM public.college_stats_snapshots
    WHERE season_id = current_season_id AND week_start = last_monday
  ) prev_rank ON prev_rank.normalized_name = curr.normalized_name
  WHERE curr.season_id = current_season_id AND curr.week_start = this_monday
  ON CONFLICT (season_id, normalized_name, week_start) DO UPDATE SET
    earnings_delta = EXCLUDED.earnings_delta,
    wins_delta = EXCLUDED.wins_delta,
    cuts_delta = EXCLUDED.cuts_delta,
    top10_delta = EXCLUDED.top10_delta,
    earnings_rank_this_week = EXCLUDED.earnings_rank_this_week,
    earnings_rank_last_week = EXCLUDED.earnings_rank_last_week,
    earnings_rank_change = EXCLUDED.earnings_rank_change;
END $$;
