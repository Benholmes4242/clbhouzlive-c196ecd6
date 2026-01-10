
-- Create college_season_stats table for aggregated college statistics
CREATE TABLE public.college_season_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES public.sr_seasons(id) ON DELETE CASCADE,
  normalized_name TEXT NOT NULL,
  player_count INTEGER NOT NULL DEFAULT 0,
  earnings_total NUMERIC NOT NULL DEFAULT 0,
  wins_total INTEGER NOT NULL DEFAULT 0,
  cuts_total INTEGER NOT NULL DEFAULT 0,
  top10_total INTEGER NOT NULL DEFAULT 0,
  top25_total INTEGER NOT NULL DEFAULT 0,
  events_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(season_id, normalized_name)
);

-- Enable RLS
ALTER TABLE public.college_season_stats ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth required for viewing leaderboards)
CREATE POLICY "College stats are publicly readable" 
ON public.college_season_stats 
FOR SELECT 
USING (true);

-- Create index for fast lookups
CREATE INDEX idx_college_season_stats_normalized_name ON public.college_season_stats(normalized_name);
CREATE INDEX idx_college_season_stats_season ON public.college_season_stats(season_id);
CREATE INDEX idx_college_season_stats_earnings ON public.college_season_stats(earnings_total DESC);

-- Function to refresh college stats for a given season
CREATE OR REPLACE FUNCTION public.refresh_college_season_stats(target_season_id UUID)
RETURNS INTEGER AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  -- Delete existing stats for this season
  DELETE FROM public.college_season_stats WHERE season_id = target_season_id;
  
  -- Insert aggregated stats
  INSERT INTO public.college_season_stats (
    season_id,
    normalized_name,
    player_count,
    earnings_total,
    wins_total,
    cuts_total,
    top10_total,
    top25_total,
    events_total
  )
  SELECT 
    target_season_id,
    public.normalize_college_name(p.college) as normalized_name,
    COUNT(DISTINCT p.id) as player_count,
    COALESCE(SUM((ps.raw_data->'statistics'->>'earnings')::numeric), 0) as earnings_total,
    COALESCE(SUM((ps.raw_data->'statistics'->>'first_place')::integer), 0) as wins_total,
    COALESCE(SUM((ps.raw_data->'statistics'->>'cuts_made')::integer), 0) as cuts_total,
    COALESCE(SUM((ps.raw_data->'statistics'->>'top_10')::integer), 0) as top10_total,
    COALESCE(SUM((ps.raw_data->'statistics'->>'top_25')::integer), 0) as top25_total,
    COALESCE(SUM((ps.raw_data->'statistics'->>'events_played')::integer), 0) as events_total
  FROM sr_players p
  INNER JOIN sr_player_statistics ps ON ps.player_id = p.id AND ps.season_id = target_season_id
  WHERE p.college IS NOT NULL 
    AND p.college != ''
    AND public.normalize_college_name(p.college) != ''
  GROUP BY public.normalize_college_name(p.college);
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed initial data for 2025 season
SELECT public.refresh_college_season_stats('8d78d0da-6a71-4d51-a68c-a6139c9ecfae');
