
-- Add tour_codes TEXT[] column to sr_players
ALTER TABLE public.sr_players ADD COLUMN IF NOT EXISTS tour_codes TEXT[] DEFAULT '{}';

-- Create index for efficient tour filtering
CREATE INDEX IF NOT EXISTS idx_sr_players_tour_codes ON public.sr_players USING GIN(tour_codes);

-- Backfill tour_codes from sr_leaderboards → sr_tournaments → sr_seasons
UPDATE public.sr_players
SET tour_codes = derived.codes
FROM (
  SELECT lb.player_id, ARRAY_AGG(DISTINCT s.tour_name ORDER BY s.tour_name) AS codes
  FROM sr_leaderboards lb
  JOIN sr_tournaments t ON lb.tournament_id = t.id
  JOIN sr_seasons s ON t.season_id = s.id
  WHERE s.tour_name IS NOT NULL
  GROUP BY lb.player_id
) AS derived
WHERE sr_players.id = derived.player_id;
