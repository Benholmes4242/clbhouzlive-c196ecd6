-- Create season_rewards table for reward tiers
CREATE TABLE IF NOT EXISTS public.season_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  min_rank INT NOT NULL,
  max_rank INT NOT NULL,
  badge_icon TEXT,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_season_results table for final standings
CREATE TABLE IF NOT EXISTS public.user_season_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  final_xp INT NOT NULL,
  final_rank INT NOT NULL,
  reward_tier TEXT NOT NULL,
  badge_icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, season_id)
);

-- Create user_seen_season_recaps table to track which recaps users have seen
CREATE TABLE IF NOT EXISTS public.user_seen_season_recaps (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, season_id)
);

-- Add processing_flag to seasons table
ALTER TABLE public.seasons 
ADD COLUMN IF NOT EXISTS processing_flag BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.season_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_season_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_seen_season_recaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for season_rewards
CREATE POLICY "Anyone can view season rewards"
  ON public.season_rewards
  FOR SELECT
  USING (true);

-- RLS Policies for user_season_results
CREATE POLICY "Anyone can view season results"
  ON public.user_season_results
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert season results"
  ON public.user_season_results
  FOR INSERT
  WITH CHECK (false); -- Only service role via cron

-- RLS Policies for user_seen_season_recaps
CREATE POLICY "Users can view their own seen recaps"
  ON public.user_seen_season_recaps
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own seen recaps"
  ON public.user_seen_season_recaps
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_season_rewards_season_id ON public.season_rewards(season_id);
CREATE INDEX IF NOT EXISTS idx_user_season_results_user_id ON public.user_season_results(user_id);
CREATE INDEX IF NOT EXISTS idx_user_season_results_season_id ON public.user_season_results(season_id);

-- Insert default reward tiers for the current season (assuming the first season exists)
DO $$
DECLARE
  v_season_id UUID;
BEGIN
  -- Get the first active season
  SELECT id INTO v_season_id FROM public.seasons WHERE is_active = true LIMIT 1;
  
  IF v_season_id IS NOT NULL THEN
    -- Insert reward tiers
    INSERT INTO public.season_rewards (season_id, tier, min_rank, max_rank, label) VALUES
      (v_season_id, 'diamond', 1, 1, 'Champion'),
      (v_season_id, 'platinum', 2, 5, 'Top 5'),
      (v_season_id, 'gold', 6, 10, 'Top 10'),
      (v_season_id, 'silver', 11, 25, 'Top 25'),
      (v_season_id, 'bronze', 26, 50, 'Top 50'),
      (v_season_id, 'participant', 51, 999999, 'Participant');
  END IF;
END $$;